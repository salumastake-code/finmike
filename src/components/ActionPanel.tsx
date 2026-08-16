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
}

export default function ActionPanel({ save, onBuySupplies, onRunStand, onPlantTree, onHarvestTree, onNextDay }: Props) {
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
      desc: `${COSTS.SUPPLY_COST} coins → ${COSTS.LEMONS_PER_BATCH} lemons`,
      cost: `${COSTS.TOKEN_COST_BUY_SUPPLIES}⚡`,
      disabled: save.coins < COSTS.SUPPLY_COST || tokensLeft < COSTS.TOKEN_COST_BUY_SUPPLIES,
      onClick: onBuySupplies,
      color: 'bg-yellow-400 hover:bg-yellow-500',
    },
    {
      id: 'stand',
      label: 'Run the Stand',
      emoji: '🥤',
      desc: save.lemonadeStand.hasHelper
        ? 'Helper runs it for free!'
        : `Sell at ${save.lemonadeStand.pricePerCup}🪙/cup`,
      cost: save.lemonadeStand.hasHelper ? 'FREE' : `${COSTS.TOKEN_COST_RUN_STAND}⚡`,
      disabled: save.lemonadeStand.supplyCount === 0 || (!save.lemonadeStand.hasHelper && tokensLeft < COSTS.TOKEN_COST_RUN_STAND),
      onClick: onRunStand,
      color: 'bg-orange-400 hover:bg-orange-500',
    },
    {
      id: 'tree',
      label: save.lemonTree.planted ? (treeReady ? 'Harvest Tree 🍋' : `Growing… ${daysToGrow}d`) : 'Plant Lemon Tree',
      emoji: '🌳',
      desc: save.lemonTree.planted
        ? treeReady ? `Get ${save.lemonTree.lemonYield} lemons!` : 'Almost ready…'
        : '15 coins → free lemons forever',
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

      <button
        onClick={onNextDay}
        className="w-full mt-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
      >
        🌙 End Day → Next Morning
      </button>
    </div>
  );
}
