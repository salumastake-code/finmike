'use client';
import type { PlayerSave, CropId } from '@/types/game';
import { CROPS } from '@/lib/garden';

interface Props {
  save: PlayerSave;
  onPlant: (cropId: CropId) => void;
  onHarvest: (plotId: string) => void;
  onSell: (cropId: CropId) => void;
}

export default function GardenPanel({ save, onPlant, onHarvest, onSell }: Props) {
  const garden = save.garden;
  const tokensLeft = save.tokens.total - save.tokens.spent;

  if (!garden) return (
    <div className="text-center py-6 text-gray-400 text-sm">Garden not unlocked yet.</div>
  );

  const readyPlots = garden.plots.filter(p => !p.harvested && !p.damaged && (save.dayNumber - p.plantedDay) >= p.matureAt);
  const growingPlots = garden.plots.filter(p => !p.harvested && !p.damaged && (save.dayNumber - p.plantedDay) < p.matureAt);
  const damagedPlots = garden.plots.filter(p => p.damaged && !p.harvested);
  const hasInventory = Object.values(garden.marketInventory).some(v => v > 0);
  const plotsUsed = garden.plots.filter(p => !p.harvested).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌱</span>
        <div>
          <div className="font-bold text-gray-800">Your Garden</div>
          <div className="text-xs text-gray-400">{plotsUsed}/4 plots used · {garden.totalHarvested} total harvested</div>
        </div>
      </div>

      {/* Growing plots */}
      {growingPlots.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Growing</div>
          {growingPlots.map(plot => {
            const crop = CROPS[plot.cropId];
            const daysLeft = plot.matureAt - (save.dayNumber - plot.plantedDay);
            const pct = Math.round(((save.dayNumber - plot.plantedDay) / plot.matureAt) * 100);
            return (
              <div key={plot.id} className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{crop.emoji}</span>
                  <span className="text-sm font-medium text-green-800">{crop.name}</span>
                  <span className="ml-auto text-xs text-green-500">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                </div>
                <div className="bg-green-100 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ready to harvest */}
      {readyPlots.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ready to Harvest! 🎉</div>
          {readyPlots.map(plot => {
            const crop = CROPS[plot.cropId];
            return (
              <button key={plot.id} onClick={() => onHarvest(plot.id)}
                disabled={tokensLeft < 1}
                className="w-full flex items-center gap-3 p-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl font-bold transition-colors animate-pulse">
                <span className="text-xl">{crop.emoji}</span>
                <div className="flex-1 text-left text-sm">Harvest {crop.name}
                  <div className="text-xs opacity-80 font-normal">Sells for ${crop.sellPrice} each</div>
                </div>
                <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Damaged plots */}
      {damagedPlots.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-red-400 uppercase tracking-wide">Storm Damaged</div>
          {damagedPlots.map(plot => (
            <div key={plot.id} className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">💀</span>
              <span className="text-sm text-red-600">{CROPS[plot.cropId].name} lost to the storm</span>
            </div>
          ))}
        </div>
      )}

      {/* Market inventory */}
      {hasInventory && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sell at Market</div>
          {(Object.keys(garden.marketInventory) as CropId[]).map(cropId => {
            const qty = garden.marketInventory[cropId];
            if (qty === 0) return null;
            const crop = CROPS[cropId];
            return (
              <button key={cropId} onClick={() => onSell(cropId)}
                disabled={tokensLeft < 1}
                className="w-full flex items-center gap-3 p-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl font-bold transition-colors">
                <span className="text-xl">{crop.emoji}</span>
                <div className="flex-1 text-left text-sm">Sell {qty}x {crop.name}
                  <div className="text-xs opacity-80 font-normal">Earn ${qty * crop.sellPrice} total</div>
                </div>
                <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Plant new crops */}
      {plotsUsed < 4 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plant Something</div>
          {(Object.keys(CROPS) as CropId[]).map(cropId => {
            const crop = CROPS[cropId];
            return (
              <button key={cropId} onClick={() => onPlant(cropId)}
                disabled={save.coins < crop.cost || tokensLeft < 1}
                className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
                <span className="text-xl">{crop.emoji}</span>
                <div className="flex-1 text-left text-sm">{crop.name}
                  <div className="text-xs opacity-80 font-normal">${crop.cost} to plant · grows in {crop.growDays} day{crop.growDays !== 1 ? 's' : ''} · sells for ${crop.sellPrice}</div>
                </div>
                <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
              </button>
            );
          })}
        </div>
      )}

      {plotsUsed >= 4 && !hasInventory && readyPlots.length === 0 && growingPlots.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2">All plots are growing — come back tomorrow!</div>
      )}
    </div>
  );
}
