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
}

// ---- Lemonade Stand ----
export interface LemonadeStand {
  owned: boolean;
  supplyCount: number;   // lemons in inventory
  pricePerCup: number;   // price player has set
  hasHelper: boolean;    // hired a helper?
  hasUmbrella: boolean;  // weather protection?
  totalEarned: number;
}

// ---- Lemon Tree ----
export interface LemonTree {
  planted: boolean;
  daysOld: number;       // days since planted
  matureAt: number;      // day it becomes productive (e.g. 3)
  lemonYield: number;    // lemons produced per harvest when mature
}

// ---- Activity Tokens ----
export interface ActivityTokens {
  total: number;         // tokens available this day
  spent: number;         // tokens used today
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
  lemonTree: LemonTree;

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
