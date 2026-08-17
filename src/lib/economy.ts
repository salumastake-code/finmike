import type { PlayerSave, Weather } from '@/types/game';

// ============================================================
// Economy Engine — separated from UI so balance can be tuned
// without touching components
// ============================================================

const SUPPLY_COST = 5;        // cost per batch of 10 lemons
const LEMONS_PER_BATCH = 10;
const CUPS_PER_LEMON = 1;
const HELPER_WAGE_PER_DAY = 3;
const TOKEN_COST_RUN_STAND = 2;
const TOKEN_COST_TEND_TREE = 1;
const TOKEN_COST_LEARN = 2;
const TOKEN_COST_EXPLORE = 1;
const TOKEN_COST_BUY_SUPPLIES = 1;
const TOKEN_COST_HIRE_HELPER = 1;

// ---- Weather demand modifier ----
export function weatherDemandMultiplier(weather: Weather): number {
  switch (weather) {
    case 'sunny':  return 1.0;
    case 'cloudy': return 0.8;
    case 'rainy':  return 0.4;
    case 'stormy': return 0.1;
    default:       return 1.0;
  }
}

// ---- How many customers show up ----
export function simulateCustomers(weather: Weather, price: number): number {
  const base = 8; // baseline customers on a sunny day at price 1
  const weatherMod = weatherDemandMultiplier(weather);
  // Higher price = fewer customers (simple linear demand)
  const priceMod = Math.max(0, 1 - (price - 1) * 0.15);
  return Math.floor(base * weatherMod * priceMod);
}

// ---- Run lemonade stand for one session ----
export interface StandResult {
  cupsServed: number;
  revenue: number;
  suppliesUsed: number;
  helperCost: number;
  profit: number;
  tokensUsed: number;
  limitingFactor: 'supplies' | 'customers' | null;
}

export function runLemonadeStand(save: PlayerSave): StandResult | { error: string } {
  const { lemonadeStand, tokens, weather } = save;

  if (!lemonadeStand.owned) return { error: 'You don\'t have a lemonade stand yet.' };
  if (!lemonadeStand.hasHelper && tokens.spent + TOKEN_COST_RUN_STAND > tokens.total) {
    return { error: 'Not enough activity tokens left today.' };
  }
  if (lemonadeStand.supplyCount === 0) return { error: 'You\'re out of lemons! Buy supplies first.' };

  const customers = simulateCustomers(weather, lemonadeStand.pricePerCup);
  const maxCups = lemonadeStand.supplyCount * CUPS_PER_LEMON;
  const cupsServed = Math.min(customers, maxCups);
  // limitingFactor: were we capped by supplies or by customer count?
  const limitingFactor: 'supplies' | 'customers' | null =
    cupsServed === 0 ? null :
    maxCups < customers ? 'supplies' :
    customers < maxCups ? 'customers' : null;

  const revenue = cupsServed * lemonadeStand.pricePerCup;
  const helperCost = lemonadeStand.hasHelper ? HELPER_WAGE_PER_DAY : 0;
  // Profit floored at 0 — the helper doesn't take money you don't have
  const profit = Math.max(0, revenue - helperCost);
  const tokensUsed = lemonadeStand.hasHelper ? 0 : TOKEN_COST_RUN_STAND;

  return { cupsServed, revenue, suppliesUsed: cupsServed, helperCost, profit, tokensUsed, limitingFactor };
}

// ---- Apply stand results to save ----
export function applyStandResult(save: PlayerSave, result: StandResult): PlayerSave {
  const updated = { ...save };
  updated.lemonadeStand = { ...save.lemonadeStand };
  updated.tokens = { ...save.tokens };
  updated.lifeMeters = { ...save.lifeMeters };

  updated.coins += result.profit;
  updated.totalEarned += result.revenue;
  updated.totalSpent += result.helperCost;
  updated.lemonadeStand.supplyCount -= result.suppliesUsed;
  updated.lemonadeStand.totalEarned += result.revenue;
  updated.tokens.spent += result.tokensUsed;

  // Small happiness boost from running the stand
  updated.lifeMeters.happiness = Math.min(100, updated.lifeMeters.happiness + 2);

  return updated;
}

// ---- Buy supplies ----
export function buySupplies(save: PlayerSave): PlayerSave | { error: string } {
  if (save.tokens.spent + TOKEN_COST_BUY_SUPPLIES > save.tokens.total) {
    return { error: 'Not enough activity tokens to go shopping.' };
  }
  if (save.coins < SUPPLY_COST) {
    return { error: `You need ${SUPPLY_COST} dollars to buy supplies. You have ${save.coins}.` };
  }

  const updated = { ...save };
  updated.lemonadeStand = { ...save.lemonadeStand };
  updated.tokens = { ...save.tokens };

  updated.coins -= SUPPLY_COST;
  updated.totalSpent += SUPPLY_COST;
  updated.lemonadeStand.supplyCount += LEMONS_PER_BATCH;
  updated.tokens.spent += TOKEN_COST_BUY_SUPPLIES;

  return updated;
}

// ---- Plant lemon tree ----
export function plantLemonTree(save: PlayerSave): PlayerSave | { error: string } {
  if (save.lemonTree.planted) return { error: 'Your lemon tree is already growing!' };
  if (save.coins < 15) return { error: 'Planting a tree costs 15 dollars.' };
  if (save.tokens.spent + TOKEN_COST_TEND_TREE > save.tokens.total) {
    return { error: 'Not enough activity tokens to plant today.' };
  }

  const updated = { ...save };
  updated.lemonTree = { ...save.lemonTree, planted: true, daysOld: 0 };
  updated.tokens = { ...save.tokens, spent: save.tokens.spent + TOKEN_COST_TEND_TREE };
  updated.coins -= 15;
  updated.totalSpent += 15;

  return updated;
}

// ---- Harvest lemon tree ----
export function harvestLemonTree(save: PlayerSave): PlayerSave | { error: string } {
  if (!save.lemonTree.planted) return { error: 'No tree to harvest.' };
  if (save.lemonTree.daysOld < save.lemonTree.matureAt) {
    return { error: `Your tree needs ${save.lemonTree.matureAt - save.lemonTree.daysOld} more day(s) to grow.` };
  }
  if (save.tokens.spent + TOKEN_COST_TEND_TREE > save.tokens.total) {
    return { error: 'Not enough activity tokens to harvest today.' };
  }

  const updated = { ...save };
  updated.lemonadeStand = { ...save.lemonadeStand };
  updated.lemonTree = { ...save.lemonTree };
  updated.tokens = { ...save.tokens };

  updated.lemonadeStand.supplyCount += save.lemonTree.lemonYield;
  updated.tokens.spent += TOKEN_COST_TEND_TREE;

  return updated;
}

// ---- Contribute to dream goal ----
export function contributeToDream(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (amount <= 0) return { error: 'Amount must be positive.' };
  if (save.coins < amount) return { error: `You only have ${save.coins} dollars.` };
  if (save.dreamGoal.unlocked) return { error: 'Dream already reached!' };

  const updated = { ...save };
  updated.dreamGoal = { ...save.dreamGoal };
  updated.lifeMeters = { ...save.lifeMeters };

  updated.coins -= amount;
  updated.totalSpent += amount;
  updated.dreamGoal.saved = Math.min(save.dreamGoal.cost, save.dreamGoal.saved + amount);

  if (updated.dreamGoal.saved >= updated.dreamGoal.cost) {
    updated.dreamGoal.unlocked = true;
    updated.lifeMeters.happiness = Math.min(100, updated.lifeMeters.happiness + 20);
    updated.lifeMeters.financialSecurity = Math.min(100, updated.lifeMeters.financialSecurity + 10);
  }

  return updated;
}

// ---- Advance to next day ----
export function advanceDay(save: PlayerSave): PlayerSave {
  const updated = { ...save };
  updated.lemonTree = { ...save.lemonTree };
  updated.tokens = { ...save.tokens };

  updated.dayNumber += 1;
  updated.tokens.spent = 0; // reset tokens

  // Grow tree
  if (save.lemonTree.planted) {
    updated.lemonTree.daysOld = save.lemonTree.daysOld + 1;
  }

  // Random weather
  updated.weather = randomWeather();

  // Slow life meter decay — keeps balance in play
  // Note: must spread from save.lifeMeters BEFORE other mutations
  updated.lifeMeters = {
    financialSecurity: save.lifeMeters.financialSecurity,
    health: Math.max(0, save.lifeMeters.health - 1),
    happiness: Math.max(0, save.lifeMeters.happiness - 1),
    relationships: save.lifeMeters.relationships,
    futureSecurity: save.lifeMeters.futureSecurity,
  };

  return updated;
}

// ---- Random weather with weighted probability ----
function randomWeather(): PlayerSave['weather'] {
  const roll = Math.random();
  if (roll < 0.55) return 'sunny';
  if (roll < 0.80) return 'cloudy';
  if (roll < 0.95) return 'rainy';
  return 'stormy';
}

export const COSTS = {
  SUPPLY_COST,
  LEMONS_PER_BATCH,
  HELPER_WAGE_PER_DAY,
  TOKEN_COST_RUN_STAND,
  TOKEN_COST_TEND_TREE,
  TOKEN_COST_BUY_SUPPLIES,
  TOKEN_COST_HIRE_HELPER,
};
