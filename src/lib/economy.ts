import type { PlayerSave, Weather } from '@/types/game';

// ============================================================
// Economy Engine — separated from UI so balance can be tuned
// without touching components
// ============================================================

const SUPPLY_COST = 5;        // cost per batch of 10 lemons
const LEMONS_PER_BATCH = 10;
const CUPS_PER_LEMON = 1;
const HELPER_SHIFT_COST = 5;    // $5 to hire someone for one shift (no energy spent)
const TOKEN_COST_RUN_STAND = 1;
const TOKEN_COST_TEND_TREE = 1;
const TOKEN_COST_LEARN = 1;
const TOKEN_COST_EXPLORE = 1;
const TOKEN_COST_BUY_SUPPLIES = 1;
const TOKEN_COST_HIRE_HELPER = 0;  // hiring costs no energy, just $5

// Spend one token; returns updated tokens or null if none left
import type { ActivityTokens } from '@/types/game';
export function spendToken(tokens: ActivityTokens, _action?: string): ActivityTokens | null {
  if (tokens.spent >= tokens.total) return null;
  return { ...tokens, spent: tokens.spent + 1 };
}

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
export function simulateCustomers(weather: Weather, price: number, hasUpgrade = false): number {
  const base = hasUpgrade ? 12 : 8;
  const weatherMod = weatherDemandMultiplier(weather);
  // Hard cap: pre-upgrade max $3, post-upgrade max $4 — anything above is treated as max
  const effectivePrice = Math.min(price, hasUpgrade ? 4 : 3);
  const priceDropRate = hasUpgrade ? 0.10 : 0.15;
  const priceMod = Math.max(0, 1 - (effectivePrice - 1) * priceDropRate);
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
  if (tokens.spent + TOKEN_COST_RUN_STAND > tokens.total) return { error: 'Not enough energy left today.' };
  if (lemonadeStand.supplyCount === 0) return { error: 'You\'re out of lemons! Buy supplies first.' };

  const customers = simulateCustomers(weather, lemonadeStand.pricePerCup, lemonadeStand.hasUpgrade);
  const maxCups = lemonadeStand.supplyCount * CUPS_PER_LEMON;
  const cupsServed = Math.min(customers, maxCups);
  const limitingFactor: 'supplies' | 'customers' | null =
    cupsServed === 0 ? null :
    maxCups < customers ? 'supplies' :
    customers < maxCups ? 'customers' : null;
  const revenue = cupsServed * lemonadeStand.pricePerCup;
  return { cupsServed, revenue, suppliesUsed: cupsServed, helperCost: 0, profit: revenue, tokensUsed: TOKEN_COST_RUN_STAND, limitingFactor };
}

// ---- Apply stand results to save ----
export function applyStandResult(save: PlayerSave, result: StandResult): PlayerSave {
  const updated = { ...save };
  updated.lemonadeStand = { ...save.lemonadeStand };
  updated.lifeMeters = { ...save.lifeMeters };
  updated.coins += result.profit;
  updated.totalEarned += result.revenue;
  updated.lemonadeStand.supplyCount -= result.suppliesUsed;
  updated.lemonadeStand.totalEarned += result.revenue;
  updated.tokens = spendToken(save.tokens, 'run_stand') ?? save.tokens;
  updated.lifeMeters.happiness = Math.min(100, updated.lifeMeters.happiness + 2);
  return updated;
}

export interface HireShiftResult { save: PlayerSave; cupsServed: number; revenue: number; profit: number; isBadShift: boolean }

// ---- Hire someone for one shift ($5, no energy cost) ----
// 25% chance of a bad shift — helper was slow/distracted, fewer cups sold
const MAX_HIRED_SHIFTS_PER_DAY = 5;

export function hireForShift(save: PlayerSave): HireShiftResult | { error: string } {
  if (save.coins < HELPER_SHIFT_COST) return { error: `Hiring someone for a shift costs $${HELPER_SHIFT_COST}. You only have $${save.coins}.` };
  if (save.lemonadeStand.supplyCount === 0) return { error: 'You\'re out of lemons! Buy supplies first.' };
  if ((save.lemonadeStand.helperShiftsToday ?? 0) >= MAX_HIRED_SHIFTS_PER_DAY) {
    return { error: `You can only hire ${MAX_HIRED_SHIFTS_PER_DAY} shifts per day. Come back tomorrow!` };
  }

  const { weather, lemonadeStand } = save;
  const baseCustomers = simulateCustomers(weather, lemonadeStand.pricePerCup, lemonadeStand.hasUpgrade);

  // 25% chance of a bad shift — helper sells at half efficiency
  const isBadShift = Math.random() < 0.25;
  const customers = isBadShift ? Math.floor(baseCustomers * 0.4) : baseCustomers;

  const maxCups = lemonadeStand.supplyCount * CUPS_PER_LEMON;
  const cupsServed = Math.min(customers, maxCups);
  const revenue = cupsServed * lemonadeStand.pricePerCup;
  const profit = revenue - HELPER_SHIFT_COST; // can be negative

  const nextSave: PlayerSave = {
    ...save,
    coins: save.coins - HELPER_SHIFT_COST + revenue,
    totalEarned: save.totalEarned + revenue,
    totalSpent: save.totalSpent + HELPER_SHIFT_COST,
    lemonadeStand: {
      ...lemonadeStand,
      supplyCount: lemonadeStand.supplyCount - cupsServed,
      totalEarned: lemonadeStand.totalEarned + revenue,
      helperShiftsToday: (lemonadeStand.helperShiftsToday ?? 0) + 1,
    },
  };
  return { save: nextSave, cupsServed, revenue, profit, isBadShift };
}

// ---- Buy supplies ----
export function buySupplies(save: PlayerSave): PlayerSave | { error: string } {
  if (save.tokens.spent + TOKEN_COST_BUY_SUPPLIES > save.tokens.total) {
    return { error: 'Not enough energy to go shopping.' };
  }
  if (save.coins < SUPPLY_COST) {
    return { error: `You need ${SUPPLY_COST} dollars to buy supplies. You have ${save.coins}.` };
  }
  const updated = { ...save };
  updated.lemonadeStand = { ...save.lemonadeStand };
  updated.tokens = spendToken(save.tokens, 'buy_supplies') ?? save.tokens;
  updated.coins -= SUPPLY_COST;
  updated.totalSpent += SUPPLY_COST;
  updated.lemonadeStand.supplyCount += LEMONS_PER_BATCH;
  return updated;
}

// ---- Plant a new lemon tree (multiple allowed) ----
export function plantLemonTree(save: PlayerSave): PlayerSave | { error: string } {
  if (save.coins < 15) return { error: 'Planting a tree costs 15 dollars.' };
  if (save.tokens.spent + TOKEN_COST_TEND_TREE > save.tokens.total) {
    return { error: 'Not enough energy to plant today.' };
  }
  const newTree: import('@/types/game').LemonTreeInstance = {
    id: `tree-${Date.now()}`,
    plantedOnDay: save.dayNumber,
    daysOld: 0,
    matureAt: 3,
    lastHarvestedDay: 0,
    lemonYield: 10,
    harvestEveryDays: 3,
  };
  return {
    ...save,
    coins: save.coins - 15,
    totalSpent: save.totalSpent + 15,
    tokens: spendToken(save.tokens, 'plant_tree') ?? save.tokens,
    lemonTrees: [...(save.lemonTrees ?? []), newTree],
    // Keep legacy lemonTree in sync for any old UI references
    lemonTree: { planted: true, daysOld: 0, matureAt: 3, lemonYield: 10 },
  };
}

// ---- Harvest a specific lemon tree ----
export function harvestLemonTreeById(save: PlayerSave, treeId: string): PlayerSave | { error: string } {
  const trees = save.lemonTrees ?? [];
  const tree = trees.find(t => t.id === treeId);
  if (!tree) return { error: 'Tree not found.' };
  if (tree.daysOld < tree.matureAt) {
    return { error: `This tree needs ${tree.matureAt - tree.daysOld} more day(s) to grow.` };
  }
  const daysSinceHarvest = tree.lastHarvestedDay === 0
    ? tree.daysOld
    : save.dayNumber - tree.lastHarvestedDay;
  if (daysSinceHarvest < tree.harvestEveryDays) {
    return { error: `This tree needs ${tree.harvestEveryDays - daysSinceHarvest} more day(s) before the next harvest.` };
  }
  if (save.tokens.spent + TOKEN_COST_TEND_TREE > save.tokens.total) {
    return { error: 'Not enough energy to harvest today.' };
  }
  return {
    ...save,
    tokens: spendToken(save.tokens, 'harvest_tree') ?? save.tokens,
    lemonadeStand: { ...save.lemonadeStand, supplyCount: save.lemonadeStand.supplyCount + tree.lemonYield },
    lemonTrees: trees.map(t => t.id === treeId ? { ...t, lastHarvestedDay: save.dayNumber } : t),
  };
}

// Legacy single-tree harvest (kept for compat)
export function harvestLemonTree(save: PlayerSave): PlayerSave | { error: string } {
  const trees = save.lemonTrees ?? [];
  if (trees.length === 0) return { error: 'No trees to harvest.' };
  // Find first harvestable tree
  const harvestable = trees.find(t => {
    if (t.daysOld < t.matureAt) return false;
    const daysSince = t.lastHarvestedDay === 0 ? t.daysOld : save.dayNumber - t.lastHarvestedDay;
    return daysSince >= t.harvestEveryDays;
  });
  if (!harvestable) return { error: 'No trees are ready to harvest yet.' };
  return harvestLemonTreeById(save, harvestable.id);
}

// ---- Withdraw from dream savings ----
export function withdrawFromDream(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (amount <= 0) return { error: 'Amount must be positive.' };
  if (save.dreamGoal.saved < amount) return { error: `You only have $${save.dreamGoal.saved.toFixed(0)} saved.` };
  if (save.dreamGoal.unlocked) return { error: 'Dream already reached — nothing to withdraw.' };
  return {
    ...save,
    coins: save.coins + amount,
    dreamGoal: { ...save.dreamGoal, saved: Math.max(0, save.dreamGoal.saved - amount) },
  };
}

// ---- Contribute to dream goal ----
export function contributeToDream(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (amount <= 0) return { error: 'Amount must be positive.' };
  if (save.coins < amount) return { error: `You only have ${save.coins} dollars.` };
  if (save.dreamGoal.unlocked) return { error: 'Dream already reached!' };
  if (save.tokens.spent >= save.tokens.total) return { error: 'Not enough energy to head to the bank right now.' };

  const updated = { ...save };
  updated.dreamGoal = { ...save.dreamGoal };
  updated.lifeMeters = { ...save.lifeMeters };
  updated.tokens = spendToken(save.tokens, 'contribute') ?? save.tokens;

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
  updated.dreamGoal = { ...save.dreamGoal };

  updated.dayNumber += 1;
  updated.tokens = { ...save.tokens, spent: 0 };
  updated.lemonadeStand = { ...save.lemonadeStand, helperShiftsToday: 0 };
  updated.grandpaChatsToday = 0;

  // Grow all lemon trees
  updated.lemonTrees = (save.lemonTrees ?? []).map(t => ({ ...t, daysOld: t.daysOld + 1 }));
  // Keep legacy in sync
  updated.lemonTree = { ...save.lemonTree };
  if (save.lemonTree.planted) updated.lemonTree.daysOld = save.lemonTree.daysOld + 1;

  // 0.25% daily interest on dream goal savings
  if (save.dreamGoal.saved > 0 && !save.dreamGoal.unlocked) {
    const interest = Math.round(save.dreamGoal.saved * 0.0025 * 100) / 100;
    updated.dreamGoal.saved = Math.min(
      save.dreamGoal.cost,
      Math.round((save.dreamGoal.saved + interest) * 100) / 100
    );
    updated.dreamGoal.interestEarnedToday = interest;
    if (updated.dreamGoal.saved >= save.dreamGoal.cost) updated.dreamGoal.unlocked = true;
  } else {
    updated.dreamGoal.interestEarnedToday = 0;
  }

  // 0.25% daily interest on piggy bank
  updated.piggyBank = { ...save.piggyBank };
  if (save.piggyBank?.balance > 0) {
    const pbInterest = Math.round(save.piggyBank.balance * 0.0025 * 100) / 100;
    updated.piggyBank.balance = Math.round((save.piggyBank.balance + pbInterest) * 100) / 100;
    updated.piggyBank.interestEarnedToday = pbInterest;
    updated.piggyBank.totalInterestEarned = Math.round((save.piggyBank.totalInterestEarned + pbInterest) * 100) / 100;
  } else {
    updated.piggyBank.interestEarnedToday = 0;
  }

  updated.weather = randomWeather();
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

// ---- Piggy Bank: deposit cash into savings ----
export function depositToPiggyBank(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (amount <= 0) return { error: 'Amount must be positive.' };
  if (save.coins < amount) return { error: `You only have $${save.coins} to deposit.` };
  return {
    ...save,
    coins: save.coins - amount,
    piggyBank: {
      ...save.piggyBank,
      balance: Math.round((save.piggyBank.balance + amount) * 100) / 100,
    },
  };
}

// ---- Piggy Bank: withdraw from savings ----
export function withdrawFromPiggyBank(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (amount <= 0) return { error: 'Amount must be positive.' };
  if (save.piggyBank.balance < amount) return { error: `You only have $${save.piggyBank.balance.toFixed(2)} in your piggy bank.` };
  return {
    ...save,
    coins: save.coins + amount,
    piggyBank: {
      ...save.piggyBank,
      balance: Math.round((save.piggyBank.balance - amount) * 100) / 100,
    },
  };
}

// ---- Gain Skill points ----
export function gainSkill(save: PlayerSave, points: number): PlayerSave {
  return { ...save, skill: Math.min(100, (save.skill ?? 0) + points) };
}

// ---- Mood helper (converts happiness 0–100 to emoji mood) ----
export function getMood(happiness: number): { mood: string; emoji: string; label: string } {
  if (happiness >= 70) return { mood: 'great', emoji: '😊', label: 'Great' };
  if (happiness >= 45) return { mood: 'good',  emoji: '🙂', label: 'Good' };
  if (happiness >= 25) return { mood: 'okay',  emoji: '😐', label: 'Okay' };
  return { mood: 'sad', emoji: '😕', label: 'Feeling down' };
}

// ---- Stand Upgrade: $40, improves appearance → more customers + softer price penalty ----
export const STAND_UPGRADE_COST = 40;

export function buyStandUpgrade(save: PlayerSave): PlayerSave | { error: string } {
  if (save.lemonadeStand.hasUpgrade) return { error: 'Your stand is already upgraded!' };
  if (save.coins < STAND_UPGRADE_COST) return { error: `The upgrade costs $${STAND_UPGRADE_COST}. You only have $${save.coins}.` };
  return {
    ...save,
    coins: save.coins - STAND_UPGRADE_COST,
    totalSpent: save.totalSpent + STAND_UPGRADE_COST,
    lemonadeStand: { ...save.lemonadeStand, hasUpgrade: true },
    lifeMeters: { ...save.lifeMeters, happiness: Math.min(100, save.lifeMeters.happiness + 10) },
  };
}

// ---- Second Stand: unlock (Grandpa quest reward) ----
export function unlockSecondStand(save: PlayerSave): PlayerSave | { error: string } {
  if (save.secondStand) return { error: 'Second stand already unlocked!' };
  const allCollectibles: import('@/types/game').CollectibleId[] = ['blue_feather', 'smooth_stone', 'old_coin', 'rare_fish', 'wildflower'];
  const found = save.pond?.collectibles ?? [];
  const hasAll = allCollectibles.every(c => found.includes(c));
  if (!hasAll) return { error: 'You need all 5 collectibles first! Keep fishing at the pond.' };
  return {
    ...save,
    secondStand: {
      unlockedOnDay: save.dayNumber,
      supplyCount: 0,
      pricePerCup: 1,
      helperHiredToday: false,
      totalEarned: 0,
      totalDaysRun: 0,
    },
    // Happiness boost for major achievement
    lifeMeters: { ...save.lifeMeters, happiness: Math.min(100, save.lifeMeters.happiness + 15) },
  };
}

// ---- Second Stand: stock supplies (transfer from main supply) ----
export function stockSecondStand(save: PlayerSave, lemons: number): PlayerSave | { error: string } {
  if (!save.secondStand) return { error: 'No second stand yet!' };
  if (save.lemonadeStand.supplyCount < lemons) {
    return { error: `You only have ${save.lemonadeStand.supplyCount} lemons. Buy more supplies first.` };
  }
  return {
    ...save,
    lemonadeStand: { ...save.lemonadeStand, supplyCount: save.lemonadeStand.supplyCount - lemons },
    secondStand: { ...save.secondStand, supplyCount: save.secondStand.supplyCount + lemons },
  };
}

// ---- Second Stand: set price ----
export function setSecondStandPrice(save: PlayerSave, price: number): PlayerSave {
  if (!save.secondStand) return save;
  return { ...save, secondStand: { ...save.secondStand, pricePerCup: Math.max(1, Math.min(5, price)) } };
}

// ---- Second Stand: hire helper for the day ($5, no energy) ----
export interface SecondStandResult {
  save: PlayerSave;
  cupsServed: number;
  revenue: number;
  profit: number;
  isBadShift: boolean;
}

export function hireSecondStandHelper(save: PlayerSave): SecondStandResult | { error: string } {
  if (!save.secondStand) return { error: 'No second stand yet!' };
  if (save.secondStand.helperHiredToday) return { error: 'Helper already hired for today.' };
  if (save.coins < HELPER_SHIFT_COST) return { error: `Hiring costs $${HELPER_SHIFT_COST}. You only have $${save.coins}.` };
  if (save.secondStand.supplyCount === 0) return { error: 'The second stand has no lemons! Stock it first.' };

  const isBadShift = Math.random() < 0.25;
  const baseCustomers = simulateCustomers(save.weather, save.secondStand.pricePerCup);
  const customers = isBadShift ? Math.floor(baseCustomers * 0.4) : baseCustomers;
  const cupsServed = Math.min(customers, save.secondStand.supplyCount);
  const revenue = cupsServed * save.secondStand.pricePerCup;
  const profit = revenue - HELPER_SHIFT_COST;

  const nextSave: PlayerSave = {
    ...save,
    coins: save.coins - HELPER_SHIFT_COST + revenue,
    totalEarned: save.totalEarned + revenue,
    totalSpent: save.totalSpent + HELPER_SHIFT_COST,
    secondStand: {
      ...save.secondStand,
      supplyCount: save.secondStand.supplyCount - cupsServed,
      helperHiredToday: true,
      totalEarned: save.secondStand.totalEarned + revenue,
      totalDaysRun: save.secondStand.totalDaysRun + 1,
    },
  };
  return { save: nextSave, cupsServed, revenue, profit, isBadShift };
}

// ---- Advance second stand day ----
export function advanceSecondStandDay(save: PlayerSave): PlayerSave {
  if (!save.secondStand) return save;
  return { ...save, secondStand: { ...save.secondStand, helperHiredToday: false } };
}

export const COSTS = {
  SUPPLY_COST,
  LEMONS_PER_BATCH,
  HELPER_SHIFT_COST,
  TOKEN_COST_RUN_STAND,
  TOKEN_COST_TEND_TREE,
  TOKEN_COST_BUY_SUPPLIES,
  TOKEN_COST_HIRE_HELPER,
  TREE_PLANT_COST: 15,
  TREE_YIELD: 10,
  TREE_HARVEST_EVERY: 3,
  TREE_MATURE_DAYS: 3,
  STAND_UPGRADE_COST,
};
