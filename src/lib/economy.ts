import type { PlayerSave, Weather } from '@/types/game';

// ============================================================
// Economy Engine — separated from UI so balance can be tuned
// without touching components
// ============================================================

const SUPPLY_COST = 5;        // cost per batch of 10 lemons
const LEMONS_PER_BATCH = 10;
const CUPS_PER_LEMON = 1;
const HELPER_WAGE_PER_DAY = 10; // $10/helper/day, paid at start of day
const TOKEN_COST_RUN_STAND = 1;
const TOKEN_COST_TEND_TREE = 1;
const TOKEN_COST_LEARN = 2;
const TOKEN_COST_EXPLORE = 1;
const TOKEN_COST_BUY_SUPPLIES = 1;
const TOKEN_COST_HIRE_HELPER = 1;

// Hours each activity advances the clock (day runs 7am → 9pm = 14hrs max)
export const HOURS: Record<string, number> = {
  run_stand:      4,  // a full shift
  buy_supplies:   1,
  plant_tree:     2,
  harvest_tree:   2,
  plant_crop:     2,
  harvest_crop:   2,
  sell_market:    1,
  feed_pet:       1,
  play_pet:       1,
  visit_treehouse: 2,
  catch_butterfly: 2,
  talk_neighbor:  1,
  contribute:     1,
  hire_helper:    1,
};

export const DAY_START = 7;   // 7am
export const DAY_END   = 21;  // 9pm

// Spend one token + advance hours; returns updated tokens object
// Returns null if no tokens left or day already over
import type { ActivityTokens } from '@/types/game';
export function spendToken(tokens: ActivityTokens, action: string): ActivityTokens | null {
  if (tokens.spent >= tokens.total) return null;
  const hrs = HOURS[action] ?? 1;
  return {
    ...tokens,
    spent: tokens.spent + 1,
    hoursElapsed: Math.min(tokens.hoursElapsed + hrs, DAY_END - DAY_START),
  };
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

  const shiftsRunByHelpers = lemonadeStand.shiftsRunByHelpers ?? 0;
  const helperCoversThis = shiftsRunByHelpers < lemonadeStand.helperCount;

  // Need energy if no helper covering this shift
  if (!helperCoversThis && tokens.spent + TOKEN_COST_RUN_STAND > tokens.total) {
    return { error: 'Not enough energy left today.' };
  }
  // Helpers need to have been paid today
  if (helperCoversThis && !lemonadeStand.helpersPaidToday) {
    return { error: `You need to pay your helper${lemonadeStand.helperCount > 1 ? 's' : ''} first! ($${lemonadeStand.helperCount * 10} today)` };
  }
  if (lemonadeStand.supplyCount === 0) return { error: 'You\'re out of lemons! Buy supplies first.' };

  const customers = simulateCustomers(weather, lemonadeStand.pricePerCup);
  const maxCups = lemonadeStand.supplyCount * CUPS_PER_LEMON;
  const cupsServed = Math.min(customers, maxCups);
  const limitingFactor: 'supplies' | 'customers' | null =
    cupsServed === 0 ? null :
    maxCups < customers ? 'supplies' :
    customers < maxCups ? 'customers' : null;

  const revenue = cupsServed * lemonadeStand.pricePerCup;
  const profit = revenue; // helper wage already paid upfront at start of day
  const tokensUsed = helperCoversThis ? 0 : TOKEN_COST_RUN_STAND;

  return { cupsServed, revenue, suppliesUsed: cupsServed, helperCost: 0, profit, tokensUsed, limitingFactor };
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

  if (result.tokensUsed > 0) {
    updated.tokens = spendToken(save.tokens, 'run_stand') ?? save.tokens;
  } else {
    updated.lemonadeStand.shiftsRunByHelpers = (save.lemonadeStand.shiftsRunByHelpers ?? 0) + 1;
    updated.tokens = { ...save.tokens };
  }

  updated.lifeMeters.happiness = Math.min(100, updated.lifeMeters.happiness + 2);
  return updated;
}

// ---- Pay helpers for the day (must be done before helper shifts run) ----
export function payHelpers(save: PlayerSave): PlayerSave | { error: string } {
  const { lemonadeStand } = save;
  if (lemonadeStand.helperCount === 0) return { error: 'You don\'t have any helpers.' };
  if (lemonadeStand.helpersPaidToday) return { error: 'Helpers already paid today.' };
  const wage = lemonadeStand.helperCount * 10;
  if (save.coins < wage) {
    return { error: `You need $${wage} to pay your ${lemonadeStand.helperCount} helper${lemonadeStand.helperCount > 1 ? 's' : ''} today. You only have $${save.coins}.` };
  }
  return {
    ...save,
    coins: save.coins - wage,
    totalSpent: save.totalSpent + wage,
    lemonadeStand: { ...lemonadeStand, helpersPaidToday: true },
  };
}

// ---- Hire a helper ----
export function hireHelper(save: PlayerSave): PlayerSave | { error: string } {
  if (save.coins < 10) return { error: 'Hiring a helper costs $10.' };
  const tokens = spendToken(save.tokens, 'hire_helper');
  if (!tokens) return { error: 'Not enough energy to hire today.' };
  return {
    ...save,
    coins: save.coins - 10,
    totalSpent: save.totalSpent + 10,
    tokens,
    lemonadeStand: { ...save.lemonadeStand, helperCount: save.lemonadeStand.helperCount + 1 },
  };
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
  updated.dreamGoal = { ...save.dreamGoal };
  const helperWage = save.lemonadeStand.helperCount * 10;

  updated.dayNumber += 1;
  updated.tokens = { ...save.tokens, spent: 0, hoursElapsed: 0 };

  // Reset helpers + deduct daily wage automatically if they can afford it
  updated.lemonadeStand = {
    ...save.lemonadeStand,
    shiftsRunByHelpers: 0,
    helpersPaidToday: false,
  };

  // Grow all lemon trees
  updated.lemonTrees = (save.lemonTrees ?? []).map(t => ({ ...t, daysOld: t.daysOld + 1 }));
  // Keep legacy in sync
  updated.lemonTree = { ...save.lemonTree };
  if (save.lemonTree.planted) updated.lemonTree.daysOld = save.lemonTree.daysOld + 1;

  // 1% daily interest on dream goal savings
  if (save.dreamGoal.saved > 0 && !save.dreamGoal.unlocked) {
    const interest = Math.round(save.dreamGoal.saved * 0.01 * 100) / 100;
    updated.dreamGoal.saved = Math.min(
      save.dreamGoal.cost,
      Math.round((save.dreamGoal.saved + interest) * 100) / 100
    );
    updated.dreamGoal.interestEarnedToday = interest;
    if (updated.dreamGoal.saved >= save.dreamGoal.cost) updated.dreamGoal.unlocked = true;
  } else {
    updated.dreamGoal.interestEarnedToday = 0;
  }

  updated.weather = randomWeather();
  updated.lifeMeters = {
    financialSecurity: save.lifeMeters.financialSecurity,
    health: Math.max(0, save.lifeMeters.health - 1),
    happiness: Math.max(0, save.lifeMeters.happiness - 1),
    relationships: save.lifeMeters.relationships,
    futureSecurity: save.lifeMeters.futureSecurity,
  };

  // Auto-deduct helper wages if player can afford — warn if not
  if (save.lemonadeStand.helperCount > 0 && updated.coins >= helperWage) {
    updated.coins -= helperWage;
    updated.totalSpent += helperWage;
    updated.lemonadeStand.helpersPaidToday = true;
  }

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
  HELPER_WAGE_PER_DAY: 10, // per helper per day
  TOKEN_COST_RUN_STAND,
  TOKEN_COST_TEND_TREE,
  TOKEN_COST_BUY_SUPPLIES,
  TOKEN_COST_HIRE_HELPER,
  TREE_PLANT_COST: 15,
  TREE_YIELD: 10,
  TREE_HARVEST_EVERY: 3,
  TREE_MATURE_DAYS: 3,
};
