import type { PlayerSave, Pet } from '@/types/game';
import { spendToken } from './economy';

// ============================================================
// Pet Economy
// ============================================================

const TOKEN_COST_PET = 1;
const HAPPINESS_DECAY = 10;   // per day neglected
const HAPPINESS_FEED = 20;
const HAPPINESS_PLAY = 25;

export function initPet(name: string): Pet {
  return {
    name,
    emoji: '🐶',
    fed: false,
    played: false,
    happiness: 80,
    daysNeglected: 0,
  };
}

export function feedPet(save: PlayerSave): PlayerSave | { error: string } {
  if (!save.pet) return { error: 'No pet yet!' };
  if (save.pet.fed) return { error: `${save.pet.name} already ate today!` };
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < TOKEN_COST_PET) return { error: 'Not enough energy to care for your pet.' };
  if (save.coins < 2) return { error: 'Pet food costs $2. You don\'t have enough.' };

  return {
    ...save,
    coins: save.coins - 2,
    totalSpent: save.totalSpent + 2,
    tokens: spendToken(save.tokens, 'feed_pet') ?? save.tokens,
    pet: {
      ...save.pet,
      fed: true,
      happiness: Math.min(100, save.pet.happiness + HAPPINESS_FEED),
      daysNeglected: 0,
    },
  };
}

export function playWithPet(save: PlayerSave): PlayerSave | { error: string } {
  if (!save.pet) return { error: 'No pet yet!' };
  if (save.pet.played) return { error: `${save.pet.name} is tired from playing already!` };
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < TOKEN_COST_PET) return { error: 'Not enough energy to play today.' };

  return {
    ...save,
    tokens: spendToken(save.tokens, 'play_pet') ?? save.tokens,
    pet: {
      ...save.pet,
      played: true,
      happiness: Math.min(100, save.pet.happiness + HAPPINESS_PLAY),
      daysNeglected: 0,
    },
  };
}

// Called on advanceDay
export function advancePetDay(save: PlayerSave): PlayerSave {
  if (!save.pet) return save;
  const wasNeglected = !save.pet.fed && !save.pet.played;
  const newHappiness = Math.max(0, save.pet.happiness - (wasNeglected ? HAPPINESS_DECAY : 2));
  const newDaysNeglected = wasNeglected ? save.pet.daysNeglected + 1 : 0;

  // Pet runs away if happiness hits 0 and neglected for 3+ days
  if (newHappiness === 0 && newDaysNeglected >= 3) {
    return {
      ...save,
      pet: undefined,
      worldUnlocks: { ...save.worldUnlocks, pet: false }, // unlock resets so they can re-earn
    };
  }

  return {
    ...save,
    pet: {
      ...save.pet,
      fed: false,
      played: false,
      happiness: newHappiness,
      daysNeglected: newDaysNeglected,
    },
  };
}
