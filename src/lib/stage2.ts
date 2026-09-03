import type {
  PlayerSave, Bakery, BakeryProductId, BakeryPriceLevel,
  Employee, EmployeeAssignment, DogWalking, TownPark,
  TownBank, BankLoan, Reputation,
} from '@/types/game';

// ============================================================
// BAKERY
// ============================================================

export const BAKERY_PRODUCTS: Record<BakeryProductId, {
  id: BakeryProductId; name: string; emoji: string;
  skillRequired: number; ingredientCost: number; batchSize: number;
  baseSellPrice: { low: number; medium: number; high: number };
  reputationImpact: { low: number; medium: number; high: number }; // per day
}> = {
  lemon_muffin: {
    id: 'lemon_muffin', name: 'Lemon Muffin', emoji: '🧁',
    skillRequired: 25, ingredientCost: 10, batchSize: 10,
    // 10 muffins × $3 medium = $30 revenue − $10 ingredients − $10 overhead = +$10 profit ✓
    baseSellPrice: { low: 2, medium: 3, high: 4 },
    reputationImpact: { low: 1, medium: 2, high: -1 },
  },
  bread: {
    id: 'bread', name: 'Bread', emoji: '🍞',
    skillRequired: 30, ingredientCost: 15, batchSize: 8,
    // 8 loaves × $5 medium = $40 revenue − $15 ingredients − $10 overhead = +$15 profit ✓
    baseSellPrice: { low: 3, medium: 5, high: 7 },
    reputationImpact: { low: 1, medium: 2, high: -2 },
  },
  cake: {
    id: 'cake', name: 'Cake', emoji: '🎂',
    skillRequired: 35, ingredientCost: 25, batchSize: 5,
    // 5 cakes × $12 medium = $60 revenue − $25 ingredients − $10 overhead = +$25 profit ✓
    baseSellPrice: { low: 8, medium: 12, high: 18 },
    reputationImpact: { low: 0, medium: 2, high: -3 },
  },
};

export const BAKERY_OPEN_COST = 2000; // dream project cost to open bakery
export const BAKERY_DAILY_RENT = 8;
export const BAKERY_DAILY_MAINTENANCE = 2;

export function initBakery(dayNumber: number): Bakery {
  return {
    unlockedOnDay: dayNumber,
    priceLevel: 'medium',
    isOpen: true,
    batchesToday: 0,
    totalEarned: 0,
    totalSpent: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    reputation: 50,
    competitorActive: false,
    competitorStartDay: 0,
    competitorResponseChosen: null,
    competitorResolvesDay: 0,
  };
}

export function setBakeryPrice(save: PlayerSave, level: BakeryPriceLevel): PlayerSave {
  if (!save.bakery) return save;
  return { ...save, bakery: { ...save.bakery, priceLevel: level } };
}

// Run a bakery shift (player personally works — costs 1⚡, bakes + sells)
export function runBakeryShift(save: PlayerSave, productId: BakeryProductId): PlayerSave | { error: string } {
  if (!save.bakery) return { error: 'No bakery yet!' };
  if (!save.worldUnlocks.bakery) return { error: 'Bakery not unlocked!' };
  const product = BAKERY_PRODUCTS[productId];
  if (save.skill < product.skillRequired) return { error: `You need ${product.skillRequired} Skill to bake ${product.name}.` };
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < 1) return { error: 'Not enough energy to work the bakery.' };
  if (save.coins < product.ingredientCost) return { error: `Ingredients cost $${product.ingredientCost}. You only have $${save.coins}.` };

  const priceLevel = save.bakery.priceLevel;
  const pricePerUnit = product.baseSellPrice[priceLevel];

  // Customer demand based on price + reputation + competitor
  const repMod = (save.bakery.reputation ?? 50) / 100;
  const competitorPenalty = save.bakery.competitorActive ? 0.8 : 1;
  const priceDemandMod = priceLevel === 'low' ? 1.2 : priceLevel === 'medium' ? 1.0 : 0.6;
  const customersWanted = Math.floor(product.batchSize * repMod * competitorPenalty * priceDemandMod);
  const unitsSold = Math.min(product.batchSize, customersWanted);
  const revenue = unitsSold * pricePerUnit;
  const expenses = product.ingredientCost + BAKERY_DAILY_RENT + BAKERY_DAILY_MAINTENANCE;
  const profit = revenue - expenses;

  // Reputation impact
  const repDelta = product.reputationImpact[priceLevel] + (save.bakery.reputation < 30 ? -1 : 0);
  const newRep = Math.max(0, Math.min(100, (save.bakery.reputation ?? 50) + repDelta));

  return {
    ...save,
    coins: save.coins + profit,
    totalEarned: save.totalEarned + revenue,
    totalSpent: save.totalSpent + expenses,
    tokens: { ...save.tokens, spent: save.tokens.spent + 1 },
    bakery: {
      ...save.bakery,
      batchesToday: save.bakery.batchesToday + 1,
      totalEarned: save.bakery.totalEarned + revenue,
      totalSpent: save.bakery.totalSpent + expenses,
      todayRevenue: save.bakery.todayRevenue + revenue,
      todayExpenses: save.bakery.todayExpenses + expenses,
      reputation: newRep,
    },
    reputation: save.reputation ? {
      ...save.reputation,
      score: newRep,
      history: [...(save.reputation.history ?? []).slice(-20), { day: save.dayNumber, delta: repDelta, reason: `Bakery ${priceLevel} pricing` }],
    } : undefined,
  };
}

export function advanceBakeryDay(save: PlayerSave): PlayerSave {
  if (!save.bakery) return save;
  // If bakery didn't operate at all today, small rep hit
  const repHit = save.bakery.batchesToday === 0 && !hasAssignedBakeryEmployee(save) ? -2 : 0;
  const newRep = Math.max(0, Math.min(100, save.bakery.reputation + repHit));

  // Check if competitor event should trigger (around day 10 of stage 2)
  const stage2Day = save.dayNumber - (save.bakery.unlockedOnDay ?? 0);
  let competitorActive = save.bakery.competitorActive;
  let competitorStartDay = save.bakery.competitorStartDay;
  let competitorResolvesDay = save.bakery.competitorResolvesDay;
  if (!competitorActive && stage2Day >= 10 && stage2Day <= 12 && Math.random() < 0.4) {
    competitorActive = true;
    competitorStartDay = save.dayNumber;
    competitorResolvesDay = save.dayNumber + 7;
  }
  // Resolve competitor after duration
  if (competitorActive && save.dayNumber >= competitorResolvesDay) {
    competitorActive = false;
  }

  return {
    ...save,
    bakery: {
      ...save.bakery,
      batchesToday: 0,
      todayRevenue: 0,
      todayExpenses: 0,
      reputation: newRep,
      competitorActive,
      competitorStartDay,
      competitorResolvesDay,
    },
  };
}

function hasAssignedBakeryEmployee(save: PlayerSave): boolean {
  return (save.employees ?? []).some(e => e.assignment === 'bakery');
}

export function respondToCompetitor(save: PlayerSave, response: string): PlayerSave | { error: string } {
  if (!save.bakery?.competitorActive) return { error: 'No active competitor event.' };
  const outcomes: Record<string, { repDelta: number; coinCost: number; desc: string }> = {
    lower_price:  { repDelta: 3,  coinCost: 0,   desc: 'Lowered prices to compete — customers noticed!' },
    advertise:    { repDelta: 5,  coinCost: 30,  desc: 'Ran advertisements around town. Reputation up!' },
    train:        { repDelta: 4,  coinCost: 20,  desc: 'Put extra training time in. Quality improved!' },
    improve:      { repDelta: 6,  coinCost: 50,  desc: 'Improved recipes and presentation. Big rep boost!' },
    nothing:      { repDelta: -3, coinCost: 0,   desc: 'Did nothing. The competitor kept stealing customers.' },
  };
  const outcome = outcomes[response];
  if (!outcome) return { error: 'Unknown response.' };
  if (save.coins < outcome.coinCost) return { error: `This option costs $${outcome.coinCost}. You only have $${save.coins}.` };
  const newRep = Math.max(0, Math.min(100, (save.bakery.reputation ?? 50) + outcome.repDelta));
  return {
    ...save,
    coins: save.coins - outcome.coinCost,
    totalSpent: save.totalSpent + outcome.coinCost,
    bakery: { ...save.bakery, reputation: newRep, competitorResponseChosen: response },
    reputation: save.reputation ? { ...save.reputation, score: newRep } : undefined,
  };
}

// ============================================================
// EMPLOYEES
// ============================================================

const EMPLOYEE_NAMES = ['Jamie', 'Sam', 'Alex', 'Riley', 'Morgan', 'Casey', 'Jordan', 'Taylor', 'Drew', 'Quinn'];
const EMPLOYEE_EMOJIS = ['👩', '👨', '🧑', '👩🏽', '👨🏽', '🧑🏽', '👩🏿', '👨🏿', '🧑🏿', '👩🏻'];

export const EMPLOYEE_WAGES: Record<EmployeeAssignment, number> = {
  stand1: 25, stand2: 25, bakery: 35, dog_walking: 15, unassigned: 0,
};

export const TRAINING_SESSIONS: Array<{ name: string; cost: number; energyCost: number; skillGain: number; days: number }> = [
  { name: 'Basic Training',         cost: 0,  energyCost: 1, skillGain: 10, days: 1 },
  { name: 'Customer Service Class', cost: 20, energyCost: 1, skillGain: 15, days: 2 },
  { name: 'Advanced Baking School', cost: 50, energyCost: 1, skillGain: 25, days: 3 },
  { name: 'Management Workshop',    cost: 75, energyCost: 2, skillGain: 30, days: 5 },
];

export function hireEmployee(save: PlayerSave, assignment: EmployeeAssignment): PlayerSave | { error: string } {
  const existingCount = (save.employees ?? []).length;
  if (existingCount >= 4) return { error: "You can't manage more than 4 employees right now." };
  const hiringFee = 40; // one-time hiring cost
  if (save.coins < hiringFee) return { error: `Hiring costs $${hiringFee}. You only have $${save.coins}.` };

  const nameIdx = existingCount % EMPLOYEE_NAMES.length;
  const employee: Employee = {
    id: `emp_${Date.now()}`,
    name: EMPLOYEE_NAMES[nameIdx],
    emoji: EMPLOYEE_EMOJIS[nameIdx],
    hiredOnDay: save.dayNumber,
    wage: EMPLOYEE_WAGES[assignment],
    trainingLevel: 0,
    stage: 'hired',
    assignment,
    trainingDaysRemaining: 0,
    totalEarnedForPlayer: 0,
  };

  return {
    ...save,
    coins: save.coins - hiringFee,
    totalSpent: save.totalSpent + hiringFee,
    employees: [...(save.employees ?? []), employee],
  };
}

export function startTraining(save: PlayerSave, employeeId: string, sessionIdx: number): PlayerSave | { error: string } {
  const employees = save.employees ?? [];
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return { error: 'Employee not found.' };
  if (emp.trainingDaysRemaining > 0) return { error: `${emp.name} is already in training!` };
  const session = TRAINING_SESSIONS[sessionIdx];
  if (!session) return { error: 'Unknown training session.' };
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < session.energyCost) return { error: `Training requires ${session.energyCost} energy.` };
  if (save.coins < session.cost) return { error: `This training costs $${session.cost}. You only have $${save.coins}.` };

  return {
    ...save,
    coins: save.coins - session.cost,
    totalSpent: save.totalSpent + session.cost,
    tokens: { ...save.tokens, spent: save.tokens.spent + session.energyCost },
    employees: employees.map(e => e.id === employeeId
      ? { ...e, trainingDaysRemaining: session.days }
      : e
    ),
  };
}

export function promoteToManager(save: PlayerSave, employeeId: string): PlayerSave | { error: string } {
  const employees = save.employees ?? [];
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return { error: 'Employee not found.' };
  if (emp.trainingLevel < 50) return { error: `${emp.name} needs at least 50 training before becoming a manager.` };
  if (emp.stage === 'manager') return { error: `${emp.name} is already a manager!` };
  return {
    ...save,
    employees: employees.map(e => e.id === employeeId ? { ...e, stage: 'manager' as const } : e),
    reputation: save.reputation ? {
      ...save.reputation,
      score: Math.min(100, save.reputation.score + 5),
      history: [...save.reputation.history.slice(-20), { day: save.dayNumber, delta: 5, reason: `${emp.name} promoted to manager` }],
    } : undefined,
  };
}

export function assignEmployee(save: PlayerSave, employeeId: string, assignment: EmployeeAssignment): PlayerSave | { error: string } {
  const employees = save.employees ?? [];
  if (!employees.find(e => e.id === employeeId)) return { error: 'Employee not found.' };
  const newWage = EMPLOYEE_WAGES[assignment];
  return {
    ...save,
    employees: employees.map(e => e.id === employeeId ? { ...e, assignment, wage: newWage } : e),
  };
}

export function advanceEmployeeDay(save: PlayerSave): PlayerSave {
  const employees = save.employees ?? [];
  if (employees.length === 0) return save;

  let coinsSpent = 0;
  let totalEarnedFromEmployees = 0;
  let repDelta = 0;

  const updated = employees.map(emp => {
    // Pay daily wage
    const wage = emp.assignment !== 'unassigned' ? emp.wage : 0;
    coinsSpent += wage;

    // Advance training — capture original remaining days BEFORE decrement
    let trainingDaysRemaining = emp.trainingDaysRemaining;
    let trainingLevel = emp.trainingLevel;
    let stage = emp.stage;
    if (trainingDaysRemaining > 0) {
      const originalDays = trainingDaysRemaining; // days the session was started with
      trainingDaysRemaining -= 1;
      if (trainingDaysRemaining === 0) {
        // Find the session that matches the original total length
        const session = TRAINING_SESSIONS.find(s => s.days === originalDays);
        if (session) {
          trainingLevel = Math.min(100, trainingLevel + session.skillGain);
          if (trainingLevel >= 50 && stage === 'hired') stage = 'trained';
        }
      }
    }

    // Low training at bakery hurts reputation
    if (emp.assignment === 'bakery' && trainingLevel < 20) repDelta -= 1;

    // Employee earnings for player — realistic revenue per assignment minus wage
    // Stand: ~$30 revenue/day (8 customers × avg $2.50 price × ~1.5 weather avg) minus wage
    // Bakery: employee runs 1 batch ~ $24 revenue minus $35 ingredients/rent/maintenance = net negative
    //   but they free up player energy — net earning tracks revenue side only, costs tracked separately
    // Dog walking: 2 dogs = $14 revenue, minus $15 wage = -$1 but frees energy
    // We track a simplified "revenue generated" not net profit to avoid double-counting with wages
    let earnedToday = 0;
    if (emp.assignment === 'stand1')      earnedToday = 30; // revenue generated, wage already deducted
    if (emp.assignment === 'stand2')      earnedToday = 25;
    if (emp.assignment === 'bakery')      earnedToday = 45; // bakery revenue > wage, player still profitable
    if (emp.assignment === 'dog_walking') earnedToday = 14;
    totalEarnedFromEmployees += earnedToday;

    return { ...emp, trainingDaysRemaining, trainingLevel, stage, totalEarnedForPlayer: emp.totalEarnedForPlayer + Math.max(0, earnedToday - wage) };
  });

  const newRep = save.reputation
    ? { ...save.reputation, score: Math.max(0, Math.min(100, save.reputation.score + repDelta)) }
    : undefined;

  return {
    ...save,
    coins: Math.max(0, save.coins - coinsSpent + totalEarnedFromEmployees),
    totalSpent: save.totalSpent + coinsSpent,
    totalEarned: save.totalEarned + totalEarnedFromEmployees,
    employees: updated,
    reputation: newRep,
  };
}

// ============================================================
// DOG WALKING
// ============================================================

export const DOG_WALK_EARNINGS = [
  { dogs: 1, energyCost: 1, earnings: 8, label: 'Walk 1 dog' },
  { dogs: 2, energyCost: 1, earnings: 14, label: 'Walk 2 dogs' },
];
export const DOG_WALKER_WAGE = 8;
export const DOG_WALK_MISHAP_INTERVAL = 17; // every ~17 walks

export function initDogWalking(dayNumber: number): DogWalking {
  return { unlockedOnDay: dayNumber, walksToday: 0, totalWalks: 0, walkerEmployeeId: null, reputationFromWalking: 0, mishapCount: 0 };
}

export interface DogWalkResult {
  save: PlayerSave;
  isMishap: boolean;
  dogs: number;
  earnings: number;
}

export function goWalkDogs(save: PlayerSave, dogs: 1 | 2): DogWalkResult | { error: string } {
  if (!save.dogWalking) return { error: 'Dog walking not unlocked!' };
  const option = DOG_WALK_EARNINGS.find(o => o.dogs === dogs)!;
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < option.energyCost) return { error: 'Not enough energy to walk dogs.' };
  if (save.dogWalking.walksToday >= 3) return { error: "That's enough dog walking for today!" };

  const totalWalks = save.dogWalking.totalWalks + 1;
  // Mishap check — every DOG_WALK_MISHAP_INTERVAL walks
  const isMishap = totalWalks % DOG_WALK_MISHAP_INTERVAL === 0;
  const repDelta = isMishap ? -7 : (dogs === 2 ? 1 : 0);
  const earnings = isMishap ? 0 : option.earnings;

  const newRep = save.reputation
    ? { ...save.reputation, score: Math.max(0, Math.min(100, save.reputation.score + repDelta)), history: [...save.reputation.history.slice(-20), { day: save.dayNumber, delta: repDelta, reason: isMishap ? 'Dog got off leash!' : `Walked ${dogs} dog${dogs > 1 ? 's' : ''}` }] }
    : undefined;

  const nextSave: PlayerSave = {
    ...save,
    coins: save.coins + earnings,
    totalEarned: save.totalEarned + earnings,
    tokens: { ...save.tokens, spent: save.tokens.spent + option.energyCost },
    dogWalking: { ...save.dogWalking, walksToday: save.dogWalking.walksToday + 1, totalWalks, mishapCount: save.dogWalking.mishapCount + (isMishap ? 1 : 0) },
    reputation: newRep,
    lifeMeters: { ...save.lifeMeters, happiness: Math.min(100, save.lifeMeters.happiness + (isMishap ? -5 : 3)) },
  };

  return { save: nextSave, isMishap, dogs, earnings };
}

export function advanceDogWalkingDay(save: PlayerSave): PlayerSave {
  if (!save.dogWalking) return save;
  // If a walker employee is assigned, they walk 2 dogs automatically
  const walkerEmp = (save.employees ?? []).find(e => e.assignment === 'dog_walking');
  if (walkerEmp) {
    const earnings = Math.max(0, 14 - DOG_WALKER_WAGE);
    const repDelta = earnings > 0 ? 1 : 0;
    return {
      ...save,
      coins: save.coins + earnings,
      totalEarned: save.totalEarned + earnings,
      dogWalking: { ...save.dogWalking, walksToday: 0, totalWalks: save.dogWalking.totalWalks + 1 },
      reputation: save.reputation ? { ...save.reputation, score: Math.min(100, save.reputation.score + repDelta) } : undefined,
    };
  }
  return { ...save, dogWalking: { ...save.dogWalking, walksToday: 0 } };
}

// ============================================================
// TOWN BANK
// ============================================================

export const BANK_INTEREST_RATE = 0.003; // 0.3%/day (slightly better than piggy bank)
export const LOAN_INTEREST_RATE = 0.13;  // 13% total interest on loan

export function initTownBank(piggyBankBalance: number): TownBank {
  return { balance: piggyBankBalance, interestEarnedToday: 0, totalInterestEarned: 0 };
}

export function depositToBank(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (!save.townBank) return { error: 'Town Bank not unlocked yet!' };
  if (save.coins < amount) return { error: `You only have $${save.coins}.` };
  if (amount <= 0) return { error: 'Enter a valid amount.' };
  return { ...save, coins: save.coins - amount, townBank: { ...save.townBank, balance: save.townBank.balance + amount } };
}

export function withdrawFromBank(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (!save.townBank) return { error: 'Town Bank not unlocked yet!' };
  if (save.townBank.balance < amount) return { error: `Your bank balance is $${save.townBank.balance.toFixed(2)}.` };
  return { ...save, coins: save.coins + amount, townBank: { ...save.townBank, balance: save.townBank.balance - amount } };
}

export function takeLoan(save: PlayerSave, principal: number): PlayerSave | { error: string } {
  if (!save.townBank) return { error: 'Town Bank not unlocked!' };
  if (save.townBank.loan && save.townBank.loan.remainingDays > 0) return { error: "You already have an active loan. Pay it off first!" };
  if (principal < 100) return { error: 'Minimum loan is $100.' };
  if (principal > 2000) return { error: 'Maximum loan is $2,000.' };

  const totalRepayable = Math.ceil(principal * (1 + LOAN_INTEREST_RATE));
  const dailyPayment = Math.ceil(totalRepayable / 34);
  const remainingDays = Math.ceil(totalRepayable / dailyPayment);

  const loan: BankLoan = { principal, totalRepayable, dailyPayment, remainingDays, amountRepaid: 0, takenOnDay: save.dayNumber, missedPayments: 0 };

  return { ...save, coins: save.coins + principal, totalEarned: save.totalEarned + principal, townBank: { ...save.townBank, loan } };
}

export function advanceBankDay(save: PlayerSave): PlayerSave {
  if (!save.townBank) return save;

  // Interest
  const interest = Math.round(save.townBank.balance * BANK_INTEREST_RATE * 100) / 100;
  let bank = { ...save.townBank, balance: save.townBank.balance + interest, interestEarnedToday: interest, totalInterestEarned: save.townBank.totalInterestEarned + interest };

  // Loan repayment
  let coins = save.coins;
  if (bank.loan && bank.loan.remainingDays > 0) {
    const payment = Math.min(bank.loan.dailyPayment, bank.loan.totalRepayable - bank.loan.amountRepaid);
    if (coins >= payment) {
      coins -= payment;
      bank = { ...bank, loan: { ...bank.loan, amountRepaid: bank.loan.amountRepaid + payment, remainingDays: bank.loan.remainingDays - 1 } };
    } else {
      // Missed payment — flag it but don't penalise heavily
      bank = { ...bank, loan: { ...bank.loan, missedPayments: bank.loan.missedPayments + 1 } };
    }
  }

  return { ...save, coins, townBank: bank };
}

// ============================================================
// TOWN PARK (Stage 2 Dream Project)
// ============================================================

export const TOWN_PARK_GOAL = 1200;
export const PARK_ADDITIONS = [
  { id: 'basketball_court', name: 'Basketball Court', emoji: '🏀', cost: 200, desc: '+10 relationships, unlocks community events' },
  { id: 'flowers',          name: 'Flower Garden',    emoji: '🌸', cost: 50,  desc: '+5 happiness every day' },
];

export function initTownPark(): TownPark {
  return { fundsSaved: 0, buildProgress: 0, built: false, additions: [], unlockedOpportunities: [] };
}

export function contributeToTownPark(save: PlayerSave, amount: number): PlayerSave | { error: string } {
  if (!save.townPark) return { error: 'Town Park not started!' };
  if (save.coins < amount) return { error: `You only have $${save.coins}.` };
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < 1) return { error: 'Not enough energy to work on the park today.' };
  const newSaved = save.townPark.fundsSaved + amount;
  const newProgress = Math.min(100, save.townPark.buildProgress + 5);
  const built = newSaved >= TOWN_PARK_GOAL && newProgress >= 100;

  const repBoost = built ? 15 : 1;
  const newRep = save.reputation
    ? { ...save.reputation, score: Math.min(100, save.reputation.score + repBoost) }
    : undefined;

  return {
    ...save,
    coins: save.coins - amount,
    totalSpent: save.totalSpent + amount,
    tokens: { ...save.tokens, spent: save.tokens.spent + 1 },
    townPark: { ...save.townPark, fundsSaved: newSaved, buildProgress: newProgress, built },
    reputation: newRep,
    lifeMeters: {
      ...save.lifeMeters,
      happiness: Math.min(100, save.lifeMeters.happiness + (built ? 20 : 3)),
      relationships: Math.min(100, save.lifeMeters.relationships + (built ? 15 : 1)),
    },
  };
}

export function addParkAddition(save: PlayerSave, additionId: string): PlayerSave | { error: string } {
  if (!save.townPark?.built) return { error: 'Build the park first!' };
  const addition = PARK_ADDITIONS.find(a => a.id === additionId);
  if (!addition) return { error: 'Unknown addition.' };
  if (save.townPark.additions.includes(additionId)) return { error: 'Already added!' };
  if (save.coins < addition.cost) return { error: `This costs $${addition.cost}. You have $${save.coins}.` };
  return {
    ...save,
    coins: save.coins - addition.cost,
    totalSpent: save.totalSpent + addition.cost,
    townPark: { ...save.townPark, additions: [...save.townPark.additions, additionId] },
    lifeMeters: {
      ...save.lifeMeters,
      happiness: Math.min(100, save.lifeMeters.happiness + 5),
      relationships: Math.min(100, save.lifeMeters.relationships + 10),
    },
  };
}

// ============================================================
// REPUTATION
// ============================================================

export function initReputation(): Reputation {
  return { score: 50, history: [] };
}

export function changeReputation(save: PlayerSave, delta: number, reason: string): PlayerSave {
  const current = save.reputation ?? initReputation();
  const newScore = Math.max(0, Math.min(100, current.score + delta));
  return {
    ...save,
    reputation: {
      score: newScore,
      history: [...current.history.slice(-20), { day: save.dayNumber, delta, reason }],
    },
  };
}

// ============================================================
// STAGE 2 TRANSITION CHECK
// ============================================================

export function checkStage2Eligible(save: PlayerSave): boolean {
  if (save.stage !== 'grow') return false;             // already in stage 2+
  if ((save.skill ?? 0) < 25) return false;            // skill gate
  if (!save.secondStand) return false;                 // need stand #2
  if (!save.worldUnlocks.bicycle) return false;        // need bike/pond
  if (!save.pond || save.pond.collectibles.length < 5) return false; // need all collectibles
  // Need at least 2 dreams completed (worldUnlocks has 2+ true)
  const dreamsCompleted = Object.values(save.worldUnlocks).filter(Boolean).length;
  if (dreamsCompleted < 2) return false;
  return true;
}

export function activateStage2(save: PlayerSave): PlayerSave {
  return {
    ...save,
    stage: 'build',
    worldUnlocks: { ...save.worldUnlocks, stage2: true },
    reputation: initReputation(),
    townBank: initTownBank(save.piggyBank?.balance ?? 0),
    // Piggy bank transfers to town bank
    piggyBank: { balance: 0, interestEarnedToday: 0, totalInterestEarned: save.piggyBank?.totalInterestEarned ?? 0 },
    dogWalking: save.pet ? initDogWalking(save.dayNumber) : undefined,
    employees: [],
    townPark: initTownPark(),
    stage2FinaleShown: true,
  };
}

// ============================================================
// STAGE 2 ADVANCE DAY (called in handleNextDay after all Stage 1 advances)
// ============================================================

export function advanceStage2Day(save: PlayerSave): PlayerSave {
  if (!save.worldUnlocks.stage2) return save;
  let updated = advanceBankDay(save);
  updated = advanceBakeryDay(updated);
  updated = advanceEmployeeDay(updated);
  updated = advanceDogWalkingDay(updated);
  // Park flower bonus
  if (updated.townPark?.built && updated.townPark.additions.includes('flowers')) {
    updated = { ...updated, lifeMeters: { ...updated.lifeMeters, happiness: Math.min(100, updated.lifeMeters.happiness + 1) } };
  }
  return updated;
}
