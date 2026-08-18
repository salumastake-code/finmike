// ============================================================
// FINMIKE — Core Game Types
// ============================================================

export type Stage = 'grow' | 'build' | 'thrive' | 'legacy';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// ---- Life Meters ----
export interface LifeMeters {
  financialSecurity: number; // 0–100
  health: number;
  happiness: number;
  relationships: number;
  futureSecurity: number;
}

// ---- Dream Goal ----
export interface DreamGoal {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  saved: number;
  unlocked: boolean;
  unlocks?: string;      // world feature this goal unlocks e.g. 'garden' | 'pet' | 'treehouse'
  interestEarnedToday?: number;
}

// ---- World Unlocks ----
export interface WorldUnlocks {
  garden: boolean;
  pet: boolean;
  treehouse: boolean;
  bicycle: boolean;
}

// ---- Garden ----
export type CropId = 'strawberry' | 'tomato' | 'herb';

export interface CropPlot {
  id: string;            // unique plot id
  cropId: CropId;
  plantedDay: number;    // day number when planted
  matureAt: number;      // days until ready (from plantedDay)
  harvested: boolean;
  damaged: boolean;      // storm damage
}

export interface Garden {
  plots: CropPlot[];     // up to 4 plots
  totalHarvested: number;
  marketInventory: Record<CropId, number>; // harvested crops ready to sell
}

// ---- Pet ----
export interface Pet {
  name: string;
  emoji: '🐶';
  fed: boolean;          // fed today?
  played: boolean;       // played today?
  happiness: number;     // 0–100
  daysNeglected: number;
}

// ---- Treehouse ----
export interface Treehouse {
  visited: boolean;      // ever visited?
  questGiven: boolean;   // grandpa quest given?
  butterflies: string[]; // collected butterfly ids
  decorations: string[];
}

// ---- Lemonade Stand ----
export interface LemonadeStand {
  owned: boolean;
  supplyCount: number;   // lemons in inventory
  pricePerCup: number;   // price player has set
  helperShiftsToday: number; // paid helper shifts run today ($5 each, no energy cost)
  hasUmbrella: boolean;
  totalEarned: number;
}

// ---- Lemon Tree (individual tree instance) ----
export interface LemonTreeInstance {
  id: string;
  plantedOnDay: number;  // which game day it was planted
  daysOld: number;       // days since planted
  matureAt: number;      // days until first harvest (3)
  lastHarvestedDay: number; // day number of last harvest (0 = never)
  lemonYield: number;    // lemons per harvest (10)
  harvestEveryDays: number; // days between harvests (3)
}

// Legacy single-tree shape kept for migration compatibility
export interface LemonTree {
  planted: boolean;
  daysOld: number;
  matureAt: number;
  lemonYield: number;
}

// ---- Activity Tokens ----
export interface ActivityTokens {
  total: number;         // tokens available this day
  spent: number;         // tokens used today
  hoursElapsed: number;  // hours elapsed today (day starts at 7am, ends at 9pm = 14hrs max)
}

// ---- Neighbor / Mentor Character ----
export interface Neighbor {
  id: string;
  name: string;
  emoji: string;
  archetype: 'saver' | 'entrepreneur' | 'investor' | 'spender';
  dialogue: NeighborDialogue[];
  questActive: boolean;
  questId?: string;
}

export interface NeighborDialogue {
  id: string;
  trigger: 'greeting' | 'quest_offer' | 'quest_complete' | 'weather' | 'tip';
  text: string;
}

// ---- Quest ----
export interface Quest {
  id: string;
  title: string;
  description: string;
  givenBy: string;       // neighbor id
  reward: QuestReward;
  completed: boolean;
  active: boolean;
  condition: QuestCondition;
}

export interface QuestReward {
  coins?: number;
  tokens?: number;
  item?: string;
  dreamProgress?: number;
}

export interface QuestCondition {
  type: 'earn_coins' | 'sell_cups' | 'plant_tree' | 'save_coins' | 'survive_rain';
  target: number;
  current: number;
}

// ---- Player Save State ----
export interface PlayerSave {
  version: number;
  createdAt: string;
  lastPlayedAt: string;

  // Identity
  playerName: string;
  avatarId: string;
  age: number;
  stage: Stage;

  // Economy
  coins: number;
  totalEarned: number;
  totalSpent: number;

  // World
  dayNumber: number;
  season: Season;
  weather: Weather;

  // Core systems
  tokens: ActivityTokens;
  lifeMeters: LifeMeters;
  dreamGoal: DreamGoal;

  // Businesses / assets
  lemonadeStand: LemonadeStand;
  lemonTree: LemonTree;       // legacy (kept for save compat)
  lemonTrees: LemonTreeInstance[]; // multiple trees

  // Unlockable world features
  garden?: Garden;
  pet?: Pet;
  treehouse?: Treehouse;

  // Characters
  neighbors: Neighbor[];

  // Quests
  quests: Quest[];

  // World unlocks
  worldUnlocks: WorldUnlocks;

  // Collections
  seedCollection: string[];
  badges: string[];
}
