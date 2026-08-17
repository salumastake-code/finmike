import type { PlayerSave, CropId, CropPlot, Garden } from '@/types/game';

// ============================================================
// Garden Economy
// ============================================================

export const CROPS: Record<CropId, {
  name: string; emoji: string; cost: number;
  growDays: number; sellPrice: number; rainBonus: number;
}> = {
  strawberry: { name: 'Strawberries', emoji: '🍓', cost: 3,  growDays: 1, sellPrice: 6,  rainBonus: 1 },
  tomato:     { name: 'Tomatoes',     emoji: '🍅', cost: 4,  growDays: 2, sellPrice: 10, rainBonus: 2 },
  herb:       { name: 'Herbs',        emoji: '🌿', cost: 2,  growDays: 1, sellPrice: 4,  rainBonus: 0 },
};

const MAX_PLOTS = 4;
const TOKEN_COST_GARDEN = 1;

export function initGarden(): Garden {
  return {
    plots: [],
    totalHarvested: 0,
    marketInventory: { strawberry: 0, tomato: 0, herb: 0 },
  };
}

export function plantCrop(
  save: PlayerSave, cropId: CropId
): PlayerSave | { error: string } {
  if (!save.garden) return { error: 'You don\'t have a garden yet!' };
  const crop = CROPS[cropId];
  if (save.coins < crop.cost) return { error: `You need $${crop.cost} to plant ${crop.name}.` };
  if (save.garden.plots.length >= MAX_PLOTS) return { error: 'All 4 garden plots are full! Harvest first.' };
  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < TOKEN_COST_GARDEN) return { error: 'Not enough activity tokens to garden today.' };

  const plot: CropPlot = {
    id: `${cropId}-${Date.now()}`,
    cropId,
    plantedDay: save.dayNumber,
    matureAt: crop.growDays,
    harvested: false,
    damaged: false,
  };

  return {
    ...save,
    coins: save.coins - crop.cost,
    totalSpent: save.totalSpent + crop.cost,
    tokens: { ...save.tokens, spent: save.tokens.spent + TOKEN_COST_GARDEN },
    garden: {
      ...save.garden,
      plots: [...save.garden.plots, plot],
    },
  };
}

export function harvestPlot(
  save: PlayerSave, plotId: string
): PlayerSave | { error: string } {
  if (!save.garden) return { error: 'No garden!' };
  const plot = save.garden.plots.find(p => p.id === plotId);
  if (!plot) return { error: 'Plot not found.' };
  const daysGrown = save.dayNumber - plot.plantedDay;
  if (daysGrown < plot.matureAt) {
    return { error: `Needs ${plot.matureAt - daysGrown} more day(s) to grow.` };
  }
  if (plot.harvested) return { error: 'Already harvested!' };
  if (plot.damaged) return { error: 'This crop was damaged by a storm.' };

  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < TOKEN_COST_GARDEN) return { error: 'Not enough tokens to harvest today.' };

  const crop = CROPS[plot.cropId];
  const rainBonus = save.weather === 'rainy' ? crop.rainBonus : 0;
  const qty = 1 + rainBonus;

  return {
    ...save,
    tokens: { ...save.tokens, spent: save.tokens.spent + TOKEN_COST_GARDEN },
    garden: {
      ...save.garden,
      plots: save.garden.plots.map(p => p.id === plotId ? { ...p, harvested: true } : p),
      totalHarvested: save.garden.totalHarvested + qty,
      marketInventory: {
        ...save.garden.marketInventory,
        [plot.cropId]: save.garden.marketInventory[plot.cropId] + qty,
      },
    },
  };
}

export function sellAtMarket(
  save: PlayerSave, cropId: CropId
): PlayerSave | { error: string } {
  if (!save.garden) return { error: 'No garden!' };
  const qty = save.garden.marketInventory[cropId];
  if (qty === 0) return { error: `You don't have any ${CROPS[cropId].name} to sell.` };

  const tokensLeft = save.tokens.total - save.tokens.spent;
  if (tokensLeft < TOKEN_COST_GARDEN) return { error: 'Not enough tokens to go to the market.' };

  const revenue = qty * CROPS[cropId].sellPrice;

  return {
    ...save,
    coins: save.coins + revenue,
    totalEarned: save.totalEarned + revenue,
    tokens: { ...save.tokens, spent: save.tokens.spent + TOKEN_COST_GARDEN },
    garden: {
      ...save.garden,
      // Clear sold plots (harvested ones)
      plots: save.garden.plots.filter(p => !p.harvested),
      marketInventory: {
        ...save.garden.marketInventory,
        [cropId]: 0,
      },
    },
  };
}

// Called on advanceDay — apply storm damage, grow crops
export function advanceGardenDay(save: PlayerSave): PlayerSave {
  if (!save.garden) return save;
  const isStormy = save.weather === 'stormy';

  return {
    ...save,
    garden: {
      ...save.garden,
      plots: save.garden.plots.map(p => ({
        ...p,
        damaged: p.damaged || (isStormy && !p.harvested),
      })),
    },
  };
}
