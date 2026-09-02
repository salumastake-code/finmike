// ============================================================
// FINMIKE — Core Game Types
// ============================================================

export type Stage = 'grow' | 'build' | 'thrive' | 'legacy';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// ---- Mood (replaces numeric Happiness in Stage 1 UI) ----
export type Mood = 'great' | 'good' | 'okay' | 'sad';

// ---- Life Meters ----
export interface LifeMeters {
  financialSecurity: number; // 0–100
  health: number;
  happiness: number;         // 0–100 internal; converted to Mood for display
  relationships: number;     // 0–100
  futureSecurity: number;
}

// ---- Piggy Bank (separate from Dream savings) ----
export interface PiggyBank {
  balance: number;           // current balance
  interestEarnedToday: number; // shown as daily drip in event log
  totalInterestEarned: number;
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
  decorations: string[]; // 'string_lights' | 'telescope' | 'flag' | 'rug'
}

// ---- Lemonade Stand ----
export interface LemonadeStand {
  owned: boolean;
  supplyCount: number;   // lemons in inventory
  pricePerCup: number;   // price player has set
  helperShiftsToday: number; // paid helper shifts run today ($5 each, no energy cost)
  hasUmbrella: boolean;
  hasUpgrade: boolean;   // $40 stand upgrade (better appearance → more customers)
  totalEarned: number;
}

// ---- Second Lemonade Stand ----
export interface SecondStand {
  unlockedOnDay: number;   // day it was unlocked
  supplyCount: number;     // lemons allocated to this stand
  pricePerCup: number;
  helperHiredToday: boolean; // player must actively hire each day
  totalEarned: number;
  totalDaysRun: number;
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
  total: number;         // tokens available this day (always 5)
  spent: number;         // tokens used today
}

// ---- Skill & Grandpa Lessons ----
export interface GrandpaLesson {
  id: string;
  title: string;
  concept: string;        // e.g. 'profit' | 'saving' | 'opportunity_cost' | 'hiring' | 'diversification'
  completed: boolean;
  skillReward: number;    // 3 for named lessons, 1 for simple sessions
}

// ---- Bike ----
export type BikeUpgrade = 'tires' | 'brakes' | 'paint' | 'basket';

export interface BikeUpgradeInfo {
  id: BikeUpgrade;
  name: string;
  emoji: string;
  cost: number;
  desc: string;
  raceBonus: number;       // added to race score
  deliveryBonus: boolean;  // basket lets you carry 10 lemons instead of 5
}

export interface Bike {
  upgrades: BikeUpgrade[];
  racesEntered: number;
  racesWon: number;
  lastRaceDay: number;     // day number of last race (race is weekly = every 7 days)
  lastDeliveryDay: number; // day number of last bakery delivery
  deliveriesToday: number;   // deliveries done today (resets each day)
  totalDeliveries: number;   // lifetime total
}

// ---- Pond & Collectibles ----
export type CollectibleId = 'blue_feather' | 'smooth_stone' | 'old_coin' | 'rare_fish' | 'wildflower';

export interface Pond {
  fishingTripsToday: number;
  totalFishCaught: number;
  collectibles: CollectibleId[];  // grandpa's 5-item quest items found
  lastFishingDay: number;
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

  // Piggy Bank (separate from dream savings)
  piggyBank: PiggyBank;

  // Skill (0–100, persistent across all stages)
  skill: number;

  // World
  dayNumber: number;
  season: Season;
  weather: Weather;

  // Core systems
  tokens: ActivityTokens;
  lifeMeters: LifeMeters;
  dreamGoal: DreamGoal;

  // Grandpa lessons
  grandpaLessons: GrandpaLesson[];
  grandpaChatsToday: number; // quick chats used today (max 2)

  // Businesses / assets
  lemonadeStand: LemonadeStand;
  lemonTree: LemonTree;       // legacy (kept for save compat)
  lemonTrees: LemonTreeInstance[]; // multiple trees

  // Unlockable world features
  garden?: Garden;
  pet?: Pet;
  treehouse?: Treehouse;
  bike?: Bike;
  pond?: Pond;

  // Characters
  neighbors: Neighbor[];

  // Quests
  quests: Quest[];

  // Second lemonade stand (unlocked via Grandpa quest)
  secondStand?: SecondStand;

  // World unlocks
  worldUnlocks: WorldUnlocks;

  // Collections
  seedCollection: string[];
  badges: string[];
}
