'use client';
import type { PlayerSave } from '@/types/game';
import { COSTS } from '@/lib/economy';

interface Props {
  save: PlayerSave;
  onBuySupplies: () => void;
  onRunStand: () => void;
  onPlantTree: () => void;
  onHarvestTree: () => void;
  onNextDay: () => void;
  onSetPrice: (price: number) => void;
  onHireHelper: () => void;
}

export default function ActionPanel({ save, onBuySupplies, onRunStand, onPlantTree, onHarvestTree, onNextDay, onSetPrice, onHireHelper }: Props) {
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const treeReady = save.lemonTree.planted && save.lemonTree.daysOld >= save.lemonTree.matureAt;
  const daysToGrow = save.lemonTree.planted
    ? Math.max(0, save.lemonTree.matureAt - save.lemonTree.daysOld)
    : null;

  const actions = [
    {
      id: 'buy',
      label: 'Buy Supplies',
      emoji: '🍋',
      desc: `${COSTS.SUPPLY_COST} dollars → ${COSTS.LEMONS_PER_BATCH} lemons`,
      cost: `${COSTS.TOKEN_COST_BUY_SUPPLIES}⚡`,
      disabled: save.coins < COSTS.SUPPLY_COST || tokensLeft < COSTS.TOKEN_COST_BUY_SUPPLIES,
      onClick: onBuySupplies,
      color: 'bg-yellow-400 hover:bg-yellow-500',
    },
    {
      id: 'stand',
      label: 'Run the Stand',
      emoji: '🥤',
      desc: false
        ? 'Helper runs it for free!'
        : `Sell at ${save.lemonadeStand.pricePerCup}💵/cup`,
      cost: false ? 'FREE' : `${COSTS.TOKEN_COST_RUN_STAND}⚡`,
      disabled: save.lemonadeStand.supplyCount === 0 || (true && tokensLeft < COSTS.TOKEN_COST_RUN_STAND),
      onClick: onRunStand,
      color: 'bg-orange-400 hover:bg-orange-500',
    },
    {
      id: 'tree',
      label: save.lemonTree.planted ? (treeReady ? 'Harvest Tree 🍋' : `Growing… ${daysToGrow}d`) : 'Plant Lemon Tree',
      emoji: '🌳',
      desc: save.lemonTree.planted
        ? treeReady ? `Get ${save.lemonTree.lemonYield} lemons!` : 'Almost ready…'
        : '15 dollars → free lemons forever',
      cost: `${COSTS.TOKEN_COST_TEND_TREE}⚡`,
      disabled: save.lemonTree.planted
        ? (!treeReady || tokensLeft < COSTS.TOKEN_COST_TEND_TREE)
        : (save.coins < 15 || tokensLeft < COSTS.TOKEN_COST_TEND_TREE),
      onClick: save.lemonTree.planted ? onHarvestTree : onPlantTree,
      color: 'bg-green-400 hover:bg-green-500',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</div>
      <div className="grid grid-cols-1 gap-2">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex items-center gap-3 p-3 rounded-xl text-white font-semibold transition-all shadow-sm
              ${action.disabled ? 'opacity-40 cursor-not-allowed bg-gray-300' : action.color}`}
          >
            <span className="text-2xl">{action.emoji}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-bold">{action.label}</div>
              <div className="text-xs opacity-80">{action.desc}</div>
            </div>
            <div className="text-xs bg-black/20 rounded-lg px-2 py-1">{action.cost}</div>
          </button>
        ))}
      </div>

      {/* Hire helper */}
      {true && (
        <button
          onClick={onHireHelper}
          disabled={save.coins < 10}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-2xl">👦</span>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-purple-700">Hire a Helper</div>
            <div className="text-xs text-purple-400">10 dollars — they run the stand, you save tokens</div>
          </div>
          <div className="text-xs bg-purple-100 text-purple-600 rounded-lg px-2 py-1 font-bold">10 💵</div>
        </button>
      )}
      {false && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
          <span className="text-2xl">👦</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700">Helper is working!</div>
            <div className="text-xs text-purple-400">Stand runs for free (pays {5} 💵/session from revenue)</div>
          </div>
          <span className="text-green-500 text-lg">✅</span>
        </div>
      )}

      {/* Price control */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="text-xs font-bold text-gray-500 mb-2">🏷️ Lemonade Price</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSetPrice(Math.max(1, save.lemonadeStand.pricePerCup - 1))}
            disabled={save.lemonadeStand.pricePerCup <= 1}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg"
          >−</button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-yellow-600">{save.lemonadeStand.pricePerCup}</span>
            <span className="text-sm text-gray-400"> 💵/cup</span>
          </div>
          <button
            onClick={() => onSetPrice(Math.min(5, save.lemonadeStand.pricePerCup + 1))}
            disabled={save.lemonadeStand.pricePerCup >= 5}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg"
          >+</button>
        </div>
        <div className="text-xs text-center text-gray-400 mt-1">
          {save.lemonadeStand.pricePerCup <= 1 ? 'Low price → more customers' :
           save.lemonadeStand.pricePerCup >= 4 ? 'High price → fewer customers' :
           'Good balance'}
        </div>
      </div>

      <button
        onClick={onNextDay}
        className="w-full mt-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
      >
        🌙 End Day → Next Morning
      </button>
    </div>
  );
}
