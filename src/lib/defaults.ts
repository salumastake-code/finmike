import type { PlayerSave } from '@/types/game';

// ============================================================
// Default save state for a brand-new Stage 1 player
// ============================================================

export const DREAM_GOALS = [
  { id: 'garden',    name: 'Garden Plot', emoji: '🌱', cost: 60,  unlocks: 'garden',    unlocksDesc: 'Grow crops and sell them at the market!' },
  { id: 'puppy',     name: 'Puppy',       emoji: '🐶', cost: 100, unlocks: 'pet',       unlocksDesc: 'A loyal friend who lives at your home.' },
  { id: 'treehouse', name: 'Treehouse',   emoji: '🌳', cost: 160, unlocks: 'treehouse', unlocksDesc: 'A secret hangout spot with new quests.' },
];

export const NEIGHBORS = [
  {
    id: 'oldtortoise',
    name: 'Old Tortoise',
    emoji: '🐢',
    archetype: 'saver' as const,
    questActive: false,
    dialogue: [
      { id: 'd1', trigger: 'greeting' as const, text: "Slow and steady, little one. Every dollar saved is a dollar working for you." },
      { id: 'd2', trigger: 'tip' as const,      text: "Keep some dollars back. You'll need them when it rains." },
      { id: 'd3', trigger: 'weather' as const,  text: "Rain coming. Glad I saved up for that umbrella last season." },
    ],
  },
  {
    id: 'buzzybee',
    name: 'Buzzy Bee',
    emoji: '🐝',
    archetype: 'entrepreneur' as const,
    questActive: false,
    dialogue: [
      { id: 'd4', trigger: 'greeting' as const,      text: "I just opened my third honey stand this morning! The busier the better!" },
      { id: 'd5', trigger: 'quest_offer' as const,   text: "My bakery needs strawberries by tomorrow. Grow or buy them — your call, but there's a reward in it!" },
      { id: 'd6', trigger: 'quest_complete' as const, text: "You came through! That's what I like — reliability. Here's your dollars." },
    ],
  },
  {
    id: 'wisefox',
    name: 'Wise Fox',
    emoji: '🦊',
    archetype: 'investor' as const,
    questActive: false,
    dialogue: [
      { id: 'd7', trigger: 'greeting' as const, text: "See that lemon tree? I planted mine three seasons ago. Barely think about lemons anymore." },
      { id: 'd8', trigger: 'tip' as const,      text: "Spend time once, earn forever. That's the trick." },
      { id: 'd9', trigger: 'weather' as const,  text: "Storms don't bother me much. My trees keep growing whether I tend them or not." },
    ],
  },
];

export const INITIAL_QUESTS = [
  {
    id: 'q1',
    title: 'First Sale',
    description: 'Sell your first cup of lemonade.',
    givenBy: 'buzzybee',
    reward: { coins: 5, dreamProgress: 5 },
    completed: false,
    active: true,
    condition: { type: 'sell_cups' as const, target: 1, current: 0 },
  },
  {
    id: 'q2',
    title: "Tortoise's Advice",
    description: 'Save up 50 dollars without spending any.',
    givenBy: 'oldtortoise',
    reward: { coins: 10, badges: ['first_saver'] },
    completed: false,
    active: false,
    condition: { type: 'save_coins' as const, target: 50, current: 0 },
  },
  {
    id: 'q3',
    title: "Plant Wise Fox's Secret",
    description: 'Plant a lemon tree.',
    givenBy: 'wisefox',
    reward: { coins: 15, dreamProgress: 10 },
    completed: false,
    active: false,
    condition: { type: 'plant_tree' as const, target: 1, current: 0 },
  },
];

export function createNewSave(playerName: string, age: number, dreamGoalId: string): PlayerSave {
  const goal = DREAM_GOALS.find(g => g.id === dreamGoalId) || DREAM_GOALS[0];

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),

    playerName,
    avatarId: 'default',
    age,
    stage: 'grow',

    coins: 20,        // starting dollars — enough to buy first supply batch
    totalEarned: 0,
    totalSpent: 0,

    dayNumber: 1,
    season: 'spring',
    weather: 'sunny',

    tokens: { total: 6, spent: 0 },

    lifeMeters: {
      financialSecurity: 30,
      health: 80,
      happiness: 70,
      relationships: 60,
      futureSecurity: 20,
    },

    dreamGoal: {
      id: goal.id,
      name: goal.name,
      emoji: goal.emoji,
      cost: goal.cost,
      unlocks: goal.unlocks,
      saved: 0,
      unlocked: false,
    },

    worldUnlocks: {
      garden: false,
      pet: false,
      treehouse: false,
    },

    lemonadeStand: {
      owned: true,
      supplyCount: 0,
      pricePerCup: 1,
      hasHelper: false,
      hasUmbrella: false,
      totalEarned: 0,
    },

    lemonTree: {
      planted: false,
      daysOld: 0,
      matureAt: 3,
      lemonYield: 5,
    },

    neighbors: NEIGHBORS,
    quests: INITIAL_QUESTS,
    seedCollection: [],
    badges: [],
  };
}
