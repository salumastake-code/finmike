import type { PlayerSave, Bike, BikeUpgrade, BikeUpgradeInfo } from '@/types/game';
import { spendToken } from './economy';

// ============================================================
// Bike Economy
// ============================================================

export const BIKE_UPGRADES: BikeUpgradeInfo[] = [
  {
    id: 'tires',
    name: 'Fast Tires',
    emoji: '🛞',
    cost: 20,
    desc: 'Grip the road better. Helps in races and makes deliveries faster.',
    raceBonus: 15,
    deliveryBonus: false,
  },
  {
    id: 'brakes',
    name: 'Better Brakes',
    emoji: '🔧',
    cost: 15,
    desc: 'Corner faster. Gives you an edge on tricky race tracks.',
    raceBonus: 10,
    deliveryBonus: false,
  },
  {
    id: 'basket',
    name: 'Delivery Basket',
    emoji: '🧺',
    cost: 10,
    desc: 'Carry 10 lemons at once instead of 5. Doubles delivery earnings!',
    raceBonus: 0,
    deliveryBonus: true,
  },
  {
    id: 'paint',
    name: 'Cool Paint Job',
    emoji: '🎨',
    cost: 12,
    desc: 'Your bike looks amazing. Small confidence boost in races.',
    raceBonus: 5,
    deliveryBonus: false,
  },
];

export const DELIVERY_LEMONS = 5;      // lemons needed per delivery (10 with basket)
export const DELIVERY_PAYMENT = 10;    // dollars earned per delivery
export const DELIVERY_ENERGY_COST = 1; // with bike (was 3 without)
export const RACE_ENERGY_COST = 1;
export const RACE_INTERVAL_DAYS = 7;   // weekly race

export function initBike(): Bike {
  return {
    upgrades: [],
    racesEntered: 0,
    racesWon: 0,
    lastRaceDay: 0,
    lastDeliveryDay: 0,
    deliveriesToday: 0,
    totalDeliveries: 0,
  };
}

// ---- How many lemons a delivery takes ----
function deliveryLemonCost(bike: Bike): number {
  return bike.upgrades.includes('basket') ? 10 : 5;
}

// ---- How much a delivery pays ----
function deliveryPayment(bike: Bike): number {
  return bike.upgrades.includes('basket') ? DELIVERY_PAYMENT * 2 : DELIVERY_PAYMENT;
}

// ---- Bakery delivery (rainy/stormy days only) ----
export function runDelivery(save: PlayerSave): PlayerSave | { error: string } {
  if (!save.bike) return { error: 'You need a bike first!' };
  if (!save.worldUnlocks.bicycle) return { error: 'Unlock the bicycle dream first!' };

  const isRainyDay = save.weather === 'rainy' || save.weather === 'stormy';
  if (!isRainyDay) return { error: "The bakery only needs deliveries on rainy days. Come back when it's raining!" };

  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < DELIVERY_ENERGY_COST) return { error: 'Not enough energy for a delivery run.' };

  const lemonCost = deliveryLemonCost(save.bike);
  if (save.lemonadeStand.supplyCount < lemonCost) {
    return { error: `You need ${lemonCost} lemons for a delivery. You only have ${save.lemonadeStand.supplyCount}.` };
  }

  const payment = deliveryPayment(save.bike);

  return {
    ...save,
    coins: save.coins + payment,
    totalEarned: save.totalEarned + payment,
    tokens: spendToken(save.tokens, 'delivery') ?? save.tokens,
    lemonadeStand: {
      ...save.lemonadeStand,
      supplyCount: save.lemonadeStand.supplyCount - lemonCost,
    },
    bike: {
      ...save.bike,
      lastDeliveryDay: save.dayNumber,
      deliveriesToday: (save.bike.deliveriesToday ?? 0) + 1,
      totalDeliveries: (save.bike.totalDeliveries ?? 0) + 1,
    },
  };
}

// ---- Calculate race score (0–100) ----
export function calcRaceScore(bike: Bike): number {
  const upgradeBonus = BIKE_UPGRADES
    .filter(u => bike.upgrades.includes(u.id))
    .reduce((sum, u) => sum + u.raceBonus, 0);
  // Base score 20–50 random + upgrade bonuses
  const base = 20 + Math.floor(Math.random() * 30);
  return Math.min(100, base + upgradeBonus);
}

// ---- Run weekly bike race ----
export interface RaceResult {
  save: PlayerSave;
  playerScore: number;
  opponentScore: number;
  won: boolean;
  place: 1 | 2 | 3;
  prize: number;
}

// miniGameScore: 0–1 from tap timing mini-game (1 = perfect, 0 = missed all)
export function runRace(save: PlayerSave, miniGameScore = 0.5): RaceResult | { error: string } {
  if (!save.bike) return { error: 'You need a bike first!' };

  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < RACE_ENERGY_COST) return { error: 'Not enough energy to race today.' };

  const daysSinceLastRace = save.dayNumber - (save.bike.lastRaceDay ?? 0);
  if (save.bike.lastRaceDay > 0 && daysSinceLastRace < RACE_INTERVAL_DAYS) {
    const daysLeft = RACE_INTERVAL_DAYS - daysSinceLastRace;
    return { error: `Next race in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Races are held weekly!` };
  }

  // Mini-game contributes 40% of score; upgrades contribute 60%
  const upgradeBonus = BIKE_UPGRADES
    .filter(u => save.bike!.upgrades.includes(u.id))
    .reduce((sum, u) => sum + u.raceBonus, 0);
  const playerScore = Math.min(100, Math.round(miniGameScore * 40 + upgradeBonus + 15));

  // Two opponents — get harder over time
  const difficulty = Math.min(save.bike.racesEntered * 5, 30);
  const opp1 = 30 + Math.floor(Math.random() * 40) + difficulty;
  const opp2 = 25 + Math.floor(Math.random() * 35) + difficulty;
  const opponentScore = Math.max(opp1, opp2);

  const won = playerScore > opponentScore;
  const secondPlace = playerScore > Math.min(opp1, opp2) && !won;
  const place: 1 | 2 | 3 = won ? 1 : secondPlace ? 2 : 3;

  // Prizes: 1st = $15 + happiness, 2nd = $5, 3rd = nothing (just fun)
  const prize = place === 1 ? 15 : place === 2 ? 5 : 0;

  const nextSave: PlayerSave = {
    ...save,
    coins: save.coins + prize,
    totalEarned: save.totalEarned + prize,
    tokens: spendToken(save.tokens, 'race') ?? save.tokens,
    lifeMeters: {
      ...save.lifeMeters,
      happiness: Math.min(100, save.lifeMeters.happiness + (won ? 15 : 5)),
    },
    bike: {
      ...save.bike,
      racesEntered: (save.bike.racesEntered ?? 0) + 1,
      racesWon: (save.bike.racesWon ?? 0) + (won ? 1 : 0),
      lastRaceDay: save.dayNumber,
    },
  };

  return { save: nextSave, playerScore, opponentScore, won, place, prize };
}

// ---- Buy a bike upgrade ----
export function buyBikeUpgrade(save: PlayerSave, upgradeId: BikeUpgrade): PlayerSave | { error: string } {
  if (!save.bike) return { error: 'No bike yet!' };
  if (save.bike.upgrades.includes(upgradeId)) return { error: 'Already have that upgrade!' };
  const upgrade = BIKE_UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return { error: 'Unknown upgrade.' };
  if (save.coins < upgrade.cost) return { error: `You need $${upgrade.cost} for that upgrade. You have $${save.coins}.` };

  return {
    ...save,
    coins: save.coins - upgrade.cost,
    totalSpent: save.totalSpent + upgrade.cost,
    bike: { ...save.bike, upgrades: [...save.bike.upgrades, upgradeId] },
  };
}

// ---- Advance bike day ----
export function advanceBikeDay(save: PlayerSave): PlayerSave {
  if (!save.bike) return save;
  return { ...save, bike: { ...save.bike, deliveriesToday: 0 } };
}
