import type { PlayerSave, Pond, CollectibleId } from '@/types/game';
import { spendToken } from './economy';

// ============================================================
// Pond & Fishing Economy
// ============================================================

export const COLLECTIBLES: Record<CollectibleId, { name: string; emoji: string; desc: string }> = {
  blue_feather: { name: 'Blue Feather',   emoji: '🪶', desc: 'From a rare blue jay. Grandpa loves birds.' },
  smooth_stone:  { name: 'Smooth Stone',   emoji: '🪨', desc: 'Perfectly round. Took years to get this smooth.' },
  old_coin:      { name: 'Old Coin',       emoji: '🪙', desc: 'Weathered and worn. From a long time ago.' },
  rare_fish:     { name: 'Rare Fish Scale', emoji: '🐟', desc: 'From the biggest fish in the pond. Hard to find.' },
  wildflower:    { name: 'Wildflower',     emoji: '🌸', desc: 'Grows only at the water\'s edge in spring.' },
};

export const ALL_COLLECTIBLES: CollectibleId[] = ['blue_feather', 'smooth_stone', 'old_coin', 'rare_fish', 'wildflower'];

// Fish types and their dollar values (sold at market or kept)
export const FISH = [
  { id: 'minnow',   name: 'Minnow',        emoji: '🐟', value: 2,  weight: 50 },
  { id: 'bass',     name: 'Bass',           emoji: '🐠', value: 5,  weight: 30 },
  { id: 'catfish',  name: 'Catfish',        emoji: '🐡', value: 8,  weight: 15 },
  { id: 'golden',   name: 'Golden Fish',    emoji: '✨', value: 20, weight: 5  },
];

const FISHING_ENERGY_COST = 1;
const COLLECTIBLE_CHANCE = 0.18; // 18% chance per trip to find a collectible

export function initPond(): Pond {
  return {
    fishingTripsToday: 0,
    totalFishCaught: 0,
    collectibles: [],
    lastFishingDay: 0,
  };
}

export interface FishingResult {
  save: PlayerSave;
  caught: boolean;
  fishName: string;
  fishEmoji: string;
  fishValue: number;
  collectibleFound: CollectibleId | null;
}

// ---- Go fishing (mini-game result is determined here; UI handles the tap timing) ----
// successRate: 0–1 passed in from the mini-game (1 = perfect tap, 0 = missed)
export function goFishing(save: PlayerSave, successRate: number): FishingResult | { error: string } {
  if (!save.pond) return { error: 'No pond access yet!' };
  if (!save.worldUnlocks.bicycle) return { error: 'You need a bike to reach the pond!' };

  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < FISHING_ENERGY_COST) return { error: 'Not enough energy to fish today.' };

  // Base catch chance boosted by mini-game success
  const catchChance = 0.4 + successRate * 0.5; // 40%–90%
  const caught = Math.random() < catchChance;

  let fishName = '';
  let fishEmoji = '🐟';
  let fishValue = 0;
  let earnedCoins = 0;

  if (caught) {
    // Weighted random fish
    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedFish = FISH[0];
    for (const fish of FISH) {
      cumulative += fish.weight;
      if (roll < cumulative) { selectedFish = fish; break; }
    }
    fishName = selectedFish.name;
    fishEmoji = selectedFish.emoji;
    fishValue = selectedFish.value;
    earnedCoins = fishValue;
  }

  // Collectible chance (only if not already found all)
  const pond = save.pond;
  const unfound = ALL_COLLECTIBLES.filter(c => !pond.collectibles.includes(c));
  let collectibleFound: CollectibleId | null = null;
  if (unfound.length > 0 && Math.random() < COLLECTIBLE_CHANCE) {
    collectibleFound = unfound[Math.floor(Math.random() * unfound.length)];
  }

  const newCollectibles = collectibleFound
    ? [...pond.collectibles, collectibleFound]
    : pond.collectibles;

  const nextSave: PlayerSave = {
    ...save,
    coins: save.coins + earnedCoins,
    totalEarned: save.totalEarned + earnedCoins,
    tokens: spendToken(save.tokens, 'fishing') ?? save.tokens,
    pond: {
      ...pond,
      fishingTripsToday: pond.fishingTripsToday + 1,
      totalFishCaught: pond.totalFishCaught + (caught ? 1 : 0),
      collectibles: newCollectibles,
      lastFishingDay: save.dayNumber,
    },
    // Happiness boost from fishing
    lifeMeters: {
      ...save.lifeMeters,
      happiness: Math.min(100, save.lifeMeters.happiness + (caught ? 5 : 2)),
    },
  };

  return { save: nextSave, caught, fishName, fishEmoji, fishValue, collectibleFound };
}

export function advancePondDay(save: PlayerSave): PlayerSave {
  if (!save.pond) return save;
  return { ...save, pond: { ...save.pond, fishingTripsToday: 0 } };
}
