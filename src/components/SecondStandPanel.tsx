'use client';
import type { PlayerSave, CollectibleId } from '@/types/game';
import { COSTS } from '@/lib/economy';
import type { SecondStandResult } from '@/lib/economy';

interface Props {
  save: PlayerSave;
  onStock: (lemons: number) => void;
  onHireHelper: () => SecondStandResult | { error: string };
  onSetPrice: (price: number) => void;
  onClaimReward: () => void; // Grandpa gives the stand after all collectibles found
}

export default function SecondStandPanel({ save, onStock, onHireHelper, onSetPrice, onClaimReward }: Props) {
  const stand = save.secondStand;
  const pond = save.pond;
  const allCollectibles: CollectibleId[] = ['blue_feather', 'smooth_stone', 'old_coin', 'rare_fish', 'wildflower'];
  const collectiblesFound = pond?.collectibles ?? [];
  const hasAllCollectibles = allCollectibles.every(c => collectiblesFound.includes(c));

  // Not yet unlocked — show quest progress
  if (!stand) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏪</span>
          <div>
            <div className="font-bold text-gray-800">Second Lemonade Stand</div>
            <div className="text-xs text-gray-400">Complete Grandpa's quest to unlock it</div>
          </div>
        </div>

        {/* Grandpa quest status */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">👴</span>
            <div>
              <div className="text-sm font-bold text-amber-900">Grandpa's Collection Quest</div>
              <div className="text-xs text-amber-600">{collectiblesFound.length}/5 items found</div>
            </div>
          </div>

          <div className="w-full bg-amber-100 rounded-full h-2 mb-3">
            <div className="bg-amber-400 h-2 rounded-full transition-all"
              style={{ width: `${(collectiblesFound.length / 5) * 100}%` }} />
          </div>

          <div className="text-xs text-amber-700 mb-3">
            "Find me 5 special things from the pond and I'll help you open a second stand!"
          </div>

          {/* Collectible checklist */}
          <div className="space-y-1.5">
            {([
              { id: 'blue_feather' as CollectibleId, name: 'Blue Feather',    emoji: '🪶' },
              { id: 'smooth_stone' as CollectibleId, name: 'Smooth Stone',    emoji: '🪨' },
              { id: 'old_coin'     as CollectibleId, name: 'Old Coin',        emoji: '🪙' },
              { id: 'rare_fish'    as CollectibleId, name: 'Rare Fish Scale', emoji: '🐟' },
              { id: 'wildflower'   as CollectibleId, name: 'Wildflower',      emoji: '🌸' },
            ]).map(item => {
              const found = collectiblesFound.includes(item.id);
              return (
                <div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl text-xs ${found ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                  <span className="text-base">{item.emoji}</span>
                  <span className={found ? 'font-bold' : ''}>{item.name}</span>
                  {found && <span className="ml-auto">✅</span>}
                </div>
              );
            })}
          </div>

          {hasAllCollectibles && (
            <button onClick={onClaimReward}
              className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-colors">
              🎉 Claim Your Reward from Grandpa!
            </button>
          )}
        </div>

        {!hasAllCollectibles && (
          <div className="text-center text-xs text-gray-400">
            🎣 Head to the Pond tab to fish and find collectibles
          </div>
        )}
      </div>
    );
  }

  // Stand is unlocked — show management UI
  const hiredToday = stand.helperHiredToday;
  const hasSupplies = stand.supplyCount > 0;
  const mainSupplies = save.lemonadeStand.supplyCount;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏪</span>
        <div>
          <div className="font-bold text-gray-800">Stand #2</div>
          <div className="text-xs text-gray-400">
            {stand.supplyCount} lemons stocked · {stand.totalDaysRun} days run · ${stand.totalEarned} earned total
          </div>
        </div>
        <div className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${hiredToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          {hiredToday ? '✅ Running' : '😴 Closed'}
        </div>
      </div>

      {/* Key lesson callout */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-start gap-2">
        <span className="text-xl">💡</span>
        <p className="text-xs text-indigo-700 leading-relaxed">
          <strong>You can't be in two places at once!</strong> Hire a helper each day to run Stand #2.
          If you don't hire, the stand earns nothing that day.
        </p>
      </div>

      {/* Stock lemons */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-yellow-900">🍋 Stock This Stand</div>
          <div className="text-xs text-yellow-600">{stand.supplyCount} here · {mainSupplies} at main stand</div>
        </div>
        <div className="flex gap-2">
          {[5, 10, 20].map(amt => (
            <button key={amt} onClick={() => onStock(amt)}
              disabled={mainSupplies < amt}
              className="flex-1 text-xs bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl">
              Move {amt}🍋
            </button>
          ))}
        </div>
        {mainSupplies === 0 && (
          <div className="text-xs text-center text-red-400 mt-1">No lemons at main stand — buy supplies first!</div>
        )}
      </div>

      {/* Set price */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <div className="text-xs font-bold text-gray-500 mb-2">🏷️ Stand #2 Price</div>
        <div className="flex items-center gap-3">
          <button onClick={() => onSetPrice(stand.pricePerCup - 1)} disabled={stand.pricePerCup <= 1}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg">−</button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-yellow-600">{stand.pricePerCup}</span>
            <span className="text-sm text-gray-400"> 💵/cup</span>
          </div>
          <button onClick={() => onSetPrice(stand.pricePerCup + 1)} disabled={stand.pricePerCup >= 5}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg">+</button>
        </div>
        <div className="text-xs text-center text-gray-400 mt-1">
          {stand.pricePerCup <= 1 ? 'Low price → more customers' : stand.pricePerCup >= 4 ? 'High price → fewer customers' : 'Good balance'}
        </div>
      </div>

      {/* Hire helper */}
      {hiredToday ? (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">👦</div>
          <div className="font-bold text-green-800">Helper is on the job!</div>
          <div className="text-xs text-green-600 mt-1">Stand #2 is running today. Check back tomorrow.</div>
        </div>
      ) : (
        <button onClick={onHireHelper as () => void}
          disabled={save.coins < COSTS.HELPER_SHIFT_COST || !hasSupplies}
          className="w-full flex items-center gap-3 p-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-colors">
          <span className="text-2xl">👦</span>
          <div className="flex-1 text-left">
            Hire Helper for Today
            <div className="text-xs opacity-80 font-normal">
              {!hasSupplies ? 'Stock lemons first!' : `$${COSTS.HELPER_SHIFT_COST} · no energy cost · keeps stand open`}
            </div>
          </div>
          {hasSupplies && <div className="text-sm bg-black/20 rounded-xl px-3 py-1">$5</div>}
        </button>
      )}

      {!hiredToday && !hasSupplies && (
        <div className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2">
          ⚠️ Stock the stand with lemons before hiring a helper!
        </div>
      )}

      {/* Earnings summary */}
      {stand.totalDaysRun > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📊 Stand #2 Summary</div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Days operated</span>
            <span className="font-bold">{stand.totalDaysRun}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Total earned</span>
            <span className="font-bold text-green-600">${stand.totalEarned}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Avg per day</span>
            <span className="font-bold">${(stand.totalEarned / stand.totalDaysRun).toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
