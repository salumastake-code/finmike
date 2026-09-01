'use client';
import type { PlayerSave } from '@/types/game';
import { COSTS, getMood } from '@/lib/economy';

type GameLocation = 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox';

interface Props {
  location: GameLocation;
  save: PlayerSave;
  onBuySupplies: () => void;
  onRunStand: () => void;
  onHireHelper: () => void;
  onSetPrice: (p: number) => void;
  onBuyStandUpgrade: () => void;
  onPlantTree: () => void;
  onHarvestTree: (treeId?: string) => void;
  onContribute: (amt: number) => void;
  onWithdraw: (amt: number) => void;
  onDepositPiggyBank: (amt: number) => void;
  onWithdrawPiggyBank: (amt: number) => void;
  onNextDay: () => void;
}

export default function LocationPanel({
  location, save,
  onBuySupplies, onRunStand, onHireHelper, onSetPrice, onBuyStandUpgrade,
  onPlantTree, onHarvestTree, onContribute, onWithdraw,
  onDepositPiggyBank, onWithdrawPiggyBank, onNextDay,
}: Props) {
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const trees = save.lemonTrees ?? [];
  // Legacy compat
  const treeReady = save.lemonTree.planted && save.lemonTree.daysOld >= save.lemonTree.matureAt;
  const daysToGrow = save.lemonTree.planted ? Math.max(0, save.lemonTree.matureAt - save.lemonTree.daysOld) : null;

  if (location === 'stand') return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🏪</span>
        <div>
          <div className="font-bold text-gray-800">Lemonade Stand</div>
          <div className="text-xs text-gray-400">{save.lemonadeStand.supplyCount} lemons in stock · earning {save.lemonadeStand.pricePerCup}💵/cup</div>
        </div>
      </div>

      <button onClick={onBuySupplies}
        disabled={save.coins < COSTS.SUPPLY_COST || tokensLeft < COSTS.TOKEN_COST_BUY_SUPPLIES}
        className="w-full flex items-center gap-3 p-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🍋</span>
        <div className="flex-1 text-left text-sm">Buy Supplies<div className="text-xs opacity-80 font-normal">{COSTS.SUPPLY_COST} dollars → {COSTS.LEMONS_PER_BATCH} lemons</div></div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
      </button>

      <button onClick={onRunStand}
        disabled={save.lemonadeStand.supplyCount === 0 || tokensLeft < COSTS.TOKEN_COST_RUN_STAND}
        className="w-full flex items-center gap-3 p-3 bg-orange-400 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🥤</span>
        <div className="flex-1 text-left text-sm">
          Work a Shift
          <div className="text-xs opacity-80 font-normal">
            {save.weather === 'stormy'
              ? '⛈️ Storm warning — expect 0 customers!'
              : save.weather === 'rainy'
              ? '🌧️ Rainy — fewer customers today'
              : `Sell at ${save.lemonadeStand.pricePerCup}💵/cup`}
          </div>
        </div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
      </button>

      {/* Price */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <div className="text-xs font-bold text-gray-500 mb-2">🏷️ Set Your Price</div>
        <div className="flex items-center gap-3">
          <button onClick={() => onSetPrice(Math.max(1, save.lemonadeStand.pricePerCup - 1))} disabled={save.lemonadeStand.pricePerCup <= 1}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg">−</button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-yellow-600">{save.lemonadeStand.pricePerCup}</span>
            <span className="text-sm text-gray-400"> 💵/cup</span>
          </div>
          <button onClick={() => onSetPrice(Math.min(save.lemonadeStand.hasUpgrade ? 4 : 3, save.lemonadeStand.pricePerCup + 1))}
            disabled={save.lemonadeStand.pricePerCup >= (save.lemonadeStand.hasUpgrade ? 4 : 3)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 font-bold text-lg">+</button>
        </div>
        <div className="text-xs text-center text-gray-400 mt-1">
          {save.lemonadeStand.pricePerCup <= 1
            ? 'Low price → more customers'
            : save.lemonadeStand.pricePerCup >= (save.lemonadeStand.hasUpgrade ? 4 : 3)
            ? 'Max price — upgrade your stand to charge more!'
            : 'Good balance'}
        </div>
        {!save.lemonadeStand.hasUpgrade && (
          <div className="text-xs text-center text-amber-500 mt-0.5">💡 Upgrade your stand to unlock $4/cup</div>
        )}
      </div>

      {/* Hire for a shift */}
      <button onClick={onHireHelper}
        disabled={save.coins < COSTS.HELPER_SHIFT_COST || save.lemonadeStand.supplyCount === 0}
        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <span className="text-xl">👦</span>
        <div className="flex-1 text-left text-sm font-bold text-purple-700">
          Hire for a Shift
          <div className="text-xs font-normal text-purple-400">They sell for you — you keep your energy</div>
        </div>
        <div className="text-xs bg-purple-100 text-purple-600 rounded-lg px-2 py-1 font-bold">$5</div>
      </button>
      {save.lemonadeStand.helperShiftsToday > 0 && (
        <div className="text-xs text-center text-purple-400">
          👦 {save.lemonadeStand.helperShiftsToday} hired shift{save.lemonadeStand.helperShiftsToday > 1 ? 's' : ''} today
        </div>
      )}

      {/* Stand Upgrade */}
      {save.lemonadeStand.hasUpgrade ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium">
          <span>✅</span>
          <span>Stand upgraded — more customers, better margins!</span>
        </div>
      ) : save.dayNumber >= 5 ? (
        <button onClick={onBuyStandUpgrade}
          disabled={save.coins < COSTS.STAND_UPGRADE_COST}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <span className="text-xl">🔨</span>
          <div className="flex-1 text-left text-sm font-bold text-amber-700">
            Upgrade Your Stand
            <div className="text-xs font-normal text-amber-500">Better sign + setup → more customers, charge up to $4 without losing as many</div>
          </div>
          <div className="text-xs bg-amber-100 text-amber-600 rounded-lg px-2 py-1 font-bold">${COSTS.STAND_UPGRADE_COST}</div>
        </button>
      ) : null}
    </div>
  );

  if (location === 'tree') return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <div>
            <div className="font-bold text-gray-800">Lemon Trees</div>
            <div className="text-xs text-gray-400">{trees.length === 0 ? 'No trees yet — plant one!' : `${trees.length} tree${trees.length > 1 ? 's' : ''} growing`}</div>
          </div>
        </div>
        <span className="text-xs text-gray-400">10 lemons every 3 days</span>
      </div>

      {/* Each tree */}
      {trees.map((tree, i) => {
        const daysSince = tree.lastHarvestedDay === 0 ? tree.daysOld : save.dayNumber - tree.lastHarvestedDay;
        const isReady = tree.daysOld >= tree.matureAt && daysSince >= tree.harvestEveryDays;
        const isGrowing = tree.daysOld < tree.matureAt;
        const daysUntilReady = isGrowing
          ? tree.matureAt - tree.daysOld
          : Math.max(0, tree.harvestEveryDays - daysSince);
        const progress = isGrowing
          ? tree.daysOld / tree.matureAt
          : daysSince / tree.harvestEveryDays;

        return (
          <div key={tree.id} className={`p-3 rounded-xl border-2 ${isReady ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{isGrowing ? '🌱' : isReady ? '🌳' : '🌿'}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-700">Tree #{i + 1}
                  <span className="ml-2 text-xs font-normal text-gray-400">planted day {tree.plantedOnDay}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {isGrowing ? `Growing… ${daysUntilReady} day${daysUntilReady !== 1 ? 's' : ''} until first harvest` :
                   isReady ? '🍋 Ready to harvest!' :
                   `Next harvest in ${daysUntilReady} day${daysUntilReady !== 1 ? 's' : ''}`}
                </div>
              </div>
              {isReady && (
                <button onClick={() => onHarvestTree(tree.id)} disabled={tokensLeft < COSTS.TOKEN_COST_TEND_TREE}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                  Harvest ⚡
                </button>
              )}
            </div>
            <div className="bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${isReady ? 'bg-green-400' : 'bg-green-300'}`}
                style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
          </div>
        );
      })}

      {/* Plant new tree — always available */}
      <button onClick={onPlantTree} disabled={save.coins < 15 || tokensLeft < COSTS.TOKEN_COST_TEND_TREE}
        className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🌱</span>
        <div className="flex-1 text-left text-sm">
          Plant {trees.length > 0 ? 'Another' : 'a'} Lemon Tree
          <div className="text-xs opacity-80 font-normal">$15 · grows 3 days · 10 lemons every 3 days</div>
        </div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
      </button>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        💡 <strong>Wise Fox says:</strong> "Plant trees on different days — then you'll always have one ready to harvest!"
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
            <div className="text-xs text-amber-600">{save.dreamGoal.saved} / {save.dreamGoal.cost} 💵 saved</div>
          </div>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 mb-1">
          <div className="bg-amber-400 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(100,(save.dreamGoal.saved/save.dreamGoal.cost)*100)}%` }} />
        </div>
        <div className="text-xs text-amber-500 mb-2">⭐ Earns 0.25% interest every night</div>
        {!save.dreamGoal.unlocked && (
          <>
            <div className="flex gap-2">
              {[5, 10, 25].map(amt => (
                <button key={amt} onClick={() => onContribute(amt)} disabled={save.coins < amt || tokensLeft < 1}
                  className="flex-1 text-xs bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-1.5 rounded-xl">
                  Save {amt} 💵
                </button>
              ))}
            </div>
            <div className="text-xs text-center text-amber-400 mt-0.5">1⚡ to visit the bank</div>
            {save.dreamGoal.saved > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1 text-center">Need cash? Take from savings:</div>
                <div className="flex gap-2">
                  {[5, 10].map(amt => (
                    <button key={amt} onClick={() => onWithdraw(amt)} disabled={save.dreamGoal.saved < amt}
                      className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-700 font-bold py-1.5 rounded-xl">
                      Withdraw {amt} 💵
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {save.dreamGoal.unlocked && <div className="text-center text-green-700 font-bold">🎉 Dream Reached!</div>}
      </div>

      {/* Piggy Bank */}
      <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🐷</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-pink-900">Piggy Bank</div>
            <div className="text-xs text-pink-500">
              ${(save.piggyBank?.balance ?? 0).toFixed(2)} saved · +0.25% daily interest
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          {[5, 10, 20].map(amt => (
            <button key={amt} onClick={() => onDepositPiggyBank(amt)} disabled={save.coins < amt}
              className="flex-1 text-xs bg-pink-400 hover:bg-pink-500 disabled:opacity-40 text-white font-bold py-1.5 rounded-xl">
              +{amt}💵
            </button>
          ))}
        </div>
        {(save.piggyBank?.balance ?? 0) > 0 && (
          <div className="flex gap-2">
            {[5, 10].map(amt => (
              <button key={amt} onClick={() => onWithdrawPiggyBank(amt)} disabled={(save.piggyBank?.balance ?? 0) < amt}
                className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-600 font-bold py-1.5 rounded-xl">
                Take {amt}💵
              </button>
            ))}
          </div>
        )}
        {(save.piggyBank?.totalInterestEarned ?? 0) > 0 && (
          <div className="text-xs text-pink-400 text-center mt-1">
            💰 Total interest earned: ${(save.piggyBank.totalInterestEarned).toFixed(2)}
          </div>
        )}
      </div>

      {/* Happiness meter */}
      {(() => {
        const mood = getMood(save.lifeMeters.happiness);
        const h = save.lifeMeters.happiness;
        const barColor = h >= 70 ? 'bg-green-400' : h >= 45 ? 'bg-yellow-400' : h >= 25 ? 'bg-orange-400' : 'bg-red-400';
        const tips: string[] = [];
        if (h < 70) {
          if (save.worldUnlocks?.treehouse) tips.push('hang out in your treehouse');
          if (save.worldUnlocks?.pet && save.pet) tips.push(`play with ${save.pet.name}`);
          if (!save.worldUnlocks?.pet) tips.push('save for a puppy');
          tips.push('chat with Grandpa');
        }
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{mood.emoji}</span>
                <span className="text-sm font-bold text-gray-700">Mood: {mood.label}</span>
              </div>
              <span className="text-xs text-gray-400">{h}/100</span>
            </div>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${h}%` }} />
            </div>
            {tips.length > 0 && h < 70 && (
              <div className="text-xs text-gray-400 mt-1.5">
                💡 To feel better: {tips.slice(0, 2).join(' or ')}
              </div>
            )}
            {h >= 70 && (
              <div className="text-xs text-green-500 mt-1.5">✨ Feeling great! Keep it up.</div>
            )}
          </div>
        );
      })()}

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
        "Every dollar you save is a dollar working for you.",
        "I never spend money I don't have. That's kept me comfortable for years.",
        "Rainy days happen. That's why I always keep some dollars back.",
      ],
    },
    buzzybee: {
      name: 'Buzzy Bee 🐝', emoji: '🐝',
      lines: save.worldUnlocks?.bicycle ? [
        "Love the bike! On rainy days, the bakery needs lemon deliveries — check your Bike tab for runs!",
        "Speed matters in business. That bicycle is already paying for itself, I bet!",
        "I used to do everything myself too. Then I hired help. Best decision ever.",
      ] : [
        "The busier the better! I run three stands and I love every minute.",
        "If customers are slow, try lowering your price. More cups, more dollars!",
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

  // Seeded by day so the same quote shows all day, but changes tomorrow
  const line = neighbor.lines[save.dayNumber % neighbor.lines.length];

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
