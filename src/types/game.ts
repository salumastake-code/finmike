// ============================================================
// FINMIKE — Core Game Types
// ============================================================

export type Stage = 'grow' | 'build' | 'thrive' | 'legacy';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// ---- Mood ----
export type Mood = 'great' | 'good' | 'okay' | 'sad';

// ---- Life Meters ----
export interface LifeMeters {
  financialSecurity: number;
  health: number;
  happiness: number;
  relationships: number;
  futureSecurity: number;
}

// ---- Piggy Bank ----
export interface PiggyBank {
  balance: number;
  interestEarnedToday: number;
  totalInterestEarned: number;
}

// ---- Town Bank (Stage 2) ----
export interface TownBank {
  balance: number;
  interestEarnedToday: number;
  totalInterestEarned: number;
  loan?: BankLoan;
  bakeryCost: number;       // cost to buy the bakery (2500)
  bakeryPurchased: boolean;
}

export interface BankLoan {
  principal: number;        // original amount borrowed
  totalRepayable: number;   // principal + interest
  dailyPayment: number;     // auto-deducted each day
  remainingDays: number;    // days left to repay
  amountRepaid: number;
  takenOnDay: number;
  missedPayments: number;   // days where player couldn't cover payment
  pastDue: number;          // amount currently past due (principal of missed payments + late fees)
  lateFees: number;         // cumulative late fees
  paymentMode: 'auto' | 'manual'; // chosen at loan origination
}

// ---- Dream Goal ----
export interface DreamGoal {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  saved: number;
  unlocked: boolean;
  unlocks?: string;
  interestEarnedToday?: number;
}

// ---- World Unlocks ----
export interface WorldUnlocks {
  garden: boolean;
  pet: boolean;
  treehouse: boolean;
  bicycle: boolean;
  // Stage 2
  stage2: boolean;
  bakery: boolean;
  townBank: boolean;
  townPark: boolean;
}

// ---- Garden ----
export type CropId = 'strawberry' | 'tomato' | 'herb';

export interface CropPlot {
  id: string;
  cropId: CropId;
  plantedDay: number;
  matureAt: number;
  harvested: boolean;
  damaged: boolean;
}

export interface Garden {
  plots: CropPlot[];
  totalHarvested: number;
  marketInventory: Record<CropId, number>;
}

// ---- Pet ----
export interface Pet {
  name: string;
  emoji: '🐶';
  fed: boolean;
  played: boolean;
  happiness: number;
  daysNeglected: number;
}

// ---- Treehouse ----
export interface Treehouse {
  visited: boolean;
  questGiven: boolean;
  butterflies: string[];
  decorations: string[];
}

// ---- Lemonade Stand ----
export interface LemonadeStand {
  owned: boolean;
  supplyCount: number;
  pricePerCup: number;
  helperShiftsToday: number;
  hasUmbrella: boolean;
  hasUpgrade: boolean;
  totalEarned: number;
}

// ---- Second Lemonade Stand ----
export interface SecondStand {
  unlockedOnDay: number;
  supplyCount: number;
  pricePerCup: number;
  helperHiredToday: boolean;
  totalEarned: number;
  totalDaysRun: number;
}

// ---- Lemon Tree ----
export interface LemonTreeInstance {
  id: string;
  plantedOnDay: number;
  daysOld: number;
  matureAt: number;
  lastHarvestedDay: number;
  lemonYield: number;
  harvestEveryDays: number;
}

export interface LemonTree {
  planted: boolean;
  daysOld: number;
  matureAt: number;
  lemonYield: number;
}

// ---- Activity Tokens ----
export interface ActivityTokens {
  total: number;
  spent: number;
}

// ---- Grandpa Lessons ----
export interface GrandpaLesson {
  id: string;
  title: string;
  concept: string;
  completed: boolean;
  skillReward: number;
}

// ---- Bike ----
export type BikeUpgrade = 'tires' | 'brakes' | 'paint' | 'basket';

export interface BikeUpgradeInfo {
  id: BikeUpgrade;
  name: string;
  emoji: string;
  cost: number;
  desc: string;
  raceBonus: number;
  deliveryBonus: boolean;
}

export interface Bike {
  upgrades: BikeUpgrade[];
  racesEntered: number;
  racesWon: number;
  lastRaceDay: number;
  lastDeliveryDay: number;
  deliveriesToday: number;
  totalDeliveries: number;
}

// ---- Pond & Collectibles ----
export type CollectibleId = 'blue_feather' | 'smooth_stone' | 'old_coin' | 'rare_fish' | 'wildflower';

export interface Pond {
  fishingTripsToday: number;
  totalFishCaught: number;
  collectibles: CollectibleId[];
  lastFishingDay: number;
}

// ============================================================
// STAGE 2 TYPES
// ============================================================

// ---- Bakery ----
export type BakeryProductId = 'lemon_muffin' | 'bread' | 'cake';
export type BakeryPriceLevel = 'low' | 'medium' | 'high';

export interface BakeryProduct {
  id: BakeryProductId;
  name: string;
  emoji: string;
  skillRequired: number;
  ingredientCost: number; // per batch
  batchSize: number;      // units per batch
  baseSellPrice: { low: number; medium: number; high: number };
}

export interface Bakery {
  unlockedOnDay: number;
  priceLevel: BakeryPriceLevel;
  isOpen: boolean;
  batchesToday: number;
  totalEarned: number;
  totalSpent: number;     // ingredient costs
  todayRevenue: number;
  todayExpenses: number;
  reputation: number;     // 0–100 (shared with player reputation)
  // Competition event
  competitorActive: boolean;
  competitorStartDay: number;
  competitorResponseChosen: string | null; // 'lower_price' | 'advertise' | 'train' | 'improve' | 'nothing'
  competitorResolvesDay: number;
}

// ---- Employee ----
export type EmployeeAssignment = 'stand1' | 'stand2' | 'bakery' | 'dog_walking' | 'unassigned';
export type EmployeeStage = 'hired' | 'trained' | 'manager';

export interface Employee {
  id: string;
  name: string;
  emoji: string;
  hiredOnDay: number;
  wage: number;           // daily wage
  trainingLevel: number;  // 0–100
  stage: EmployeeStage;
  assignment: EmployeeAssignment;
  trainingDaysRemaining: number; // active training sessions left
  totalEarnedForPlayer: number;
}

// ---- Dog Walking ----
export interface DogWalking {
  unlockedOnDay: number;
  walksToday: number;
  totalWalks: number;
  walkerEmployeeId: string | null; // null = player does it
  reputationFromWalking: number;
  mishapCount: number;    // triggers reputation hit every 15-20 walks
}

// ---- Town Park (Stage 2 Dream Project) ----
export interface TownPark {
  fundsSaved: number;     // toward $1000-$1500 goal
  buildProgress: number;  // 0–100 (energy invested)
  built: boolean;
  additions: string[];    // 'basketball_court' | 'flowers'
  unlockedOpportunities: string[]; // 'wedding_order' | 'private_event' | 'mentor' | 'real_estate'
}

// ---- Reputation ----
export interface Reputation {
  score: number;          // 0–100
  history: { day: number; delta: number; reason: string }[];
}

// ---- Neighbor ----
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
  givenBy: string;
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

  // Savings
  piggyBank: PiggyBank;
  townBank?: TownBank;      // Stage 2

  // Skill
  skill: number;

  // Reputation (Stage 2)
  reputation?: Reputation;

  // World
  dayNumber: number;
  season: Season;
  weather: Weather;

  // Core systems
  tokens: ActivityTokens;
  lifeMeters: LifeMeters;
  dreamGoal: DreamGoal;

  // Grandpa
  grandpaLessons: GrandpaLesson[];
  grandpaChatsToday: number;

  // Businesses / assets
  lemonadeStand: LemonadeStand;
  lemonTree: LemonTree;
  lemonTrees: LemonTreeInstance[];

  // Stage 1 unlockables
  garden?: Garden;
  pet?: Pet;
  treehouse?: Treehouse;
  bike?: Bike;
  pond?: Pond;

  // Characters
  neighbors: Neighbor[];
  quests: Quest[];

  // Second lemonade stand
  secondStand?: SecondStand;

  // World unlocks
  worldUnlocks: WorldUnlocks;

  // Stage 2 systems
  bakery?: Bakery;
  employees?: Employee[];
  dogWalking?: DogWalking;
  townPark?: TownPark;

  // Collections
  seedCollection: string[];
  badges: string[];

  // Stage 2 state
  stage2FinaleShown?: boolean; // Grandpa's Stage 1 finale dialogue seen

  // Day planning
  dayPlan?: DayPlan;           // morning employee assignments
  lastDaySummary?: DaySummary; // end-of-day results to review
  dayPlanConfirmed: boolean;   // has today's plan been confirmed
  daySummaryReviewed: boolean; // has today's summary been reviewed
}

// ---- Day Plan ----
export interface DayPlan {
  day: number;
  assignments: { employeeId: string; assignment: EmployeeAssignment }[];
}

// ---- Day Summary ----
export interface DaySummaryBusiness {
  name: string;
  emoji: string;
  revenue: number;
  expenses: number;
  profit: number;
  repDelta: number;
  notes: string[]; // e.g. "Rain reduced demand", "Employee error"
}

export interface DaySummary {
  day: number;
  businesses: DaySummaryBusiness[];
  cashChange: number;
  savingsBalance: number;
  savingsInterest: number;
  loanPayment?: number;
  loanMissed?: boolean;
  lateFee?: number;
  pastDue?: number;
  totalPastDue?: number;
}
