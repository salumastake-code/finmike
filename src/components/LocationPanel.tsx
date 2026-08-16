'use client';
import type { PlayerSave } from '@/types/game';
import { COSTS } from '@/lib/economy';

type Location = 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox';

interface Props {
  location: Location;
  save: PlayerSave;
  onBuySupplies: () => void;
  onRunStand: () => void;
  onHireHelper: () => void;
  onSetPrice: (p: number) => void;
  onPlantTree: () => void;
  onHarvestTree: () => void;
  onContribute: (amt: number) => void;
  onNextDay: () => void;
}

export default function LocationPanel({
  location, save,
  onBuySupplies, onRunStand, onHireHelper, onSetPrice,
  onPlantTree, onHarvestTree, onContribute, onNextDay,
}: Props) {
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const treeReady = save.lemonTree.planted && save.lemonTree.daysOld >= save.lemonTree.matureAt;
  const daysToGrow = save.lemonTree.planted ? Math.max(0, save.lemonTree.matureAt - save.lemonTree.daysOld) : null;

  if (location === 'stand') return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🏪</span>
        <div>
          <div className="font-bold text-gray-800">Lemonade Stand</div>
          <div className="text-xs text-gray-400">{save.lemonadeStand.supplyCount} lemons in stock · earning {save.lemonadeStand.pricePerCup}🪙/cup</div>
        </div>
      </div>

      <button onClick={onBuySupplies}
        disabled={save.coins < COSTS.SUPPLY_COST || tokensLeft < COSTS.TOKEN_COST_BUY_SUPPLIES}
        className="w-full flex items-center gap-3 p-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🍋</span>
        <div className="flex-1 text-left text-sm">Buy Supplies<div className="text-xs opacity-80 font-normal">{COSTS.SUPPLY_COST} coins → {COSTS.LEMONS_PER_BATCH} lemons</div></div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">{COSTS.TOKEN_COST_BUY_SUPPLIES}⚡</span>
      </button>

      <button onClick={onRunStand}
        disabled={save.lemonadeStand.supplyCount === 0 || (!save.lemonadeStand.hasHelper && tokensLeft < COSTS.TOKEN_COST_RUN_STAND)}
        className="w-full flex items-center gap-3 p-3 bg-orange-400 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🥤</span>
        <div className="flex-1 text-left text-sm">Open the Stand<div className="text-xs opacity-80 font-normal">{save.lemonadeStand.hasHelper ? 'Helper runs it!' : `Sell at ${save.lemonadeStand.pricePerCup}🪙/cup`}</div></div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">{save.lemonadeStand.hasHelper ? 'FREE' : `${COSTS.TOKEN_COST_RUN_STAND}⚡`}</span>
      </button>

      {/* Price */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <div className="text-xs font-bold text-gray-500 mb-2">🏷️ Set Your Price</div>
        <div className="flex items-center gap-3">
          <button onClick={() => onSetPrice(Math.max(1, save.lemonadeStand.pricePerCup - 1))} disabled={save.lemonadeStand.pricePerCup <= 1}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg">−</button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-yellow-600">{save.lemonadeStand.pricePerCup}</span>
            <span className="text-sm text-gray-400"> 🪙/cup</span>
          </div>
          <button onClick={() => onSetPrice(Math.min(5, save.lemonadeStand.pricePerCup + 1))} disabled={save.lemonadeStand.pricePerCup >= 5}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg">+</button>
        </div>
        <div className="text-xs text-center text-gray-400 mt-1">
          {save.lemonadeStand.pricePerCup <= 1 ? 'Low price → more customers' : save.lemonadeStand.pricePerCup >= 4 ? 'High price → fewer customers' : 'Good balance'}
        </div>
      </div>

      {/* Helper */}
      {!save.lemonadeStand.hasHelper ? (
        <button onClick={onHireHelper} disabled={save.coins < 10}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <span className="text-xl">👦</span>
          <div className="flex-1 text-left text-sm font-bold text-purple-700">Hire a Helper<div className="text-xs font-normal text-purple-400">They run the stand, you save tokens</div></div>
          <div className="text-xs bg-purple-100 text-purple-600 rounded-lg px-2 py-1 font-bold">10 🪙</div>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
          <span className="text-xl">👦</span>
          <div className="flex-1 text-sm font-bold text-purple-700">Helper is working! <div className="text-xs font-normal text-purple-400">Stand runs for free</div></div>
          <span className="text-green-500">✅</span>
        </div>
      )}
    </div>
  );

  if (location === 'tree') return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{save.lemonTree.planted ? (treeReady ? '🌳' : '🌱') : '🟫'}</span>
        <div>
          <div className="font-bold text-gray-800">Lemon Tree</div>
          <div className="text-xs text-gray-400">
            {!save.lemonTree.planted ? 'Empty plot — plant a tree!' :
             treeReady ? 'Ready to harvest!' :
             `Growing… ${daysToGrow} more day${daysToGrow === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      {!save.lemonTree.planted && (
        <button onClick={onPlantTree} disabled={save.coins < 15 || tokensLeft < COSTS.TOKEN_COST_TEND_TREE}
          className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
          <span className="text-xl">🌱</span>
          <div className="flex-1 text-left text-sm">Plant a Lemon Tree<div className="text-xs opacity-80 font-normal">15 coins · grows in 3 days · free lemons forever</div></div>
          <span className="text-xs bg-black/20 rounded-lg px-2 py-1">{COSTS.TOKEN_COST_TEND_TREE}⚡</span>
        </button>
      )}

      {save.lemonTree.planted && !treeReady && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <div className="text-4xl mb-2">🌱</div>
          <div className="text-sm text-green-700 font-medium">Growing…</div>
          <div className="text-xs text-green-500">{daysToGrow} more day{daysToGrow === 1 ? '' : 's'} until harvest</div>
          <div className="mt-2 bg-green-100 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full transition-all"
              style={{ width: `${(save.lemonTree.daysOld / save.lemonTree.matureAt) * 100}%` }} />
          </div>
        </div>
      )}

      {treeReady && (
        <button onClick={onHarvestTree} disabled={tokensLeft < COSTS.TOKEN_COST_TEND_TREE}
          className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl font-bold transition-colors animate-pulse">
          <span className="text-xl">🍋</span>
          <div className="flex-1 text-left text-sm">Harvest Lemons!<div className="text-xs opacity-80 font-normal">Get {save.lemonTree.lemonYield} free lemons</div></div>
          <span className="text-xs bg-black/20 rounded-lg px-2 py-1">{COSTS.TOKEN_COST_TEND_TREE}⚡</span>
        </button>
      )}

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        💡 <strong>Wise Fox says:</strong> "Spend time once, earn forever. A tree pays for itself in just a few harvests."
      </div>
    </div>
  );

  if (location === 'home') return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🏡</span>
        <div>
          <div className="font-bold text-gray-800">Your Home</div>
          <div className="text-xs text-gray-400">Rest, save toward your dream, and end the day</div>
        </div>
      </div>

      {/* Dream goal */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{save.dreamGoal.emoji}</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-amber-900">{save.dreamGoal.name}</div>
            <div className="text-xs text-amber-600">{save.dreamGoal.saved} / {save.dreamGoal.cost} 🪙 saved</div>
          </div>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 mb-2">
          <div className="bg-amber-400 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(100,(save.dreamGoal.saved/save.dreamGoal.cost)*100)}%` }} />
        </div>
        {!save.dreamGoal.unlocked && (
          <div className="flex gap-2">
            {[5, 10, 25].map(amt => (
              <button key={amt} onClick={() => onContribute(amt)} disabled={save.coins < amt}
                className="flex-1 text-xs bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-1.5 rounded-xl">
                Save {amt} 🪙
              </button>
            ))}
          </div>
        )}
        {save.dreamGoal.unlocked && <div className="text-center text-green-700 font-bold">🎉 Dream Reached!</div>}
      </div>

      <button onClick={onNextDay}
        className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-colors">
        🌙 Sleep · Start a New Day
      </button>
    </div>
  );

  // Neighbor panels
  const neighbors: Record<string, { name: string; emoji: string; lines: string[] }> = {
    tortoise: {
      name: 'Old Tortoise 🐢', emoji: '🐢',
      lines: [
        "Every coin you save is a coin working for you.",
        "I never spend money I don't have. That's kept me comfortable for years.",
        "Rainy days happen. That's why I always keep some coins back.",
      ],
    },
    buzzybee: {
      name: 'Buzzy Bee 🐝', emoji: '🐝',
      lines: [
        "The busier the better! I run three stands and I love every minute.",
        "If customers are slow, try lowering your price. More cups, more coins!",
        "Hiring a helper was the best thing I ever did. Freed up so much time!",
      ],
    },
    wisefox: {
      name: 'Wise Fox 🦊', emoji: '🦊',
      lines: [
        "See that lemon tree? I planted mine years ago. Barely think about lemons anymore.",
        "The best investments are the ones that keep paying you while you sleep.",
        "Spend money once on something that keeps giving — that's the secret.",
      ],
    },
  };

  const neighbor = neighbors[location];
  if (!neighbor) return null;

  const line = neighbor.lines[Math.floor(Math.random() * neighbor.lines.length)];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{neighbor.emoji}</span>
        <div>
          <div className="font-bold text-gray-800">{neighbor.name}</div>
          <div className="text-xs text-gray-400">Your neighbor</div>
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 text-sm italic leading-relaxed">
        "{line}"
      </div>
      <div className="text-xs text-center text-gray-400">Come back tomorrow for more advice.</div>
    </div>
  );
}
