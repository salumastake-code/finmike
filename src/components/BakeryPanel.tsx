'use client';
import { useState } from 'react';
import type { PlayerSave, BakeryProductId, BakeryPriceLevel } from '@/types/game';
import { BAKERY_PRODUCTS, BAKERY_DAILY_RENT, BAKERY_DAILY_MAINTENANCE, BAKERY_PURCHASE_COST, LOAN_INTEREST_RATE } from '@/lib/stage2';

interface Props {
  save: PlayerSave;
  onRunShift: (productId: BakeryProductId) => void;
  onSetPrice: (level: BakeryPriceLevel) => void;
  onRespondToCompetitor: (response: string) => void;
  onOpenBakery: () => void;
  onPurchaseBakery?: () => void;
  onTakeLoanAndBuy?: (amount: number, mode: 'auto' | 'manual') => void;
}

const PRICE_LABELS: Record<BakeryPriceLevel, { label: string; color: string; desc: string }> = {
  low:    { label: 'Low',    color: 'bg-blue-100 border-blue-300 text-blue-700',   desc: 'More customers, less per sale' },
  medium: { label: 'Medium', color: 'bg-green-100 border-green-300 text-green-700', desc: 'Balanced — good starting point' },
  high:   { label: 'High',   color: 'bg-red-100 border-red-300 text-red-700',       desc: 'Fewer customers, reputation risk' },
};

const COMPETITOR_RESPONSES = [
  { id: 'lower_price', label: 'Lower Prices',      emoji: '🏷️', cost: 0,  desc: 'Win back customers with a deal' },
  { id: 'advertise',   label: 'Advertise',          emoji: '📢', cost: 30, desc: 'Spread the word around town' },
  { id: 'train',       label: 'Train Your Team',    emoji: '📚', cost: 20, desc: 'Better service wins loyalty' },
  { id: 'improve',     label: 'Improve Recipes',    emoji: '👨‍🍳', cost: 50, desc: 'Better product, bigger rep boost' },
  { id: 'nothing',     label: 'Do Nothing',         emoji: '🤷', cost: 0,  desc: 'Hope they go away on their own...' },
];

export default function BakeryPanel({ save, onRunShift, onSetPrice, onRespondToCompetitor, onOpenBakery, onPurchaseBakery, onTakeLoanAndBuy }: Props) {
  const bakery = save.bakery;
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const [showPnL, setShowPnL] = useState(false);
  const [animatingPnL, setAnimatingPnL] = useState(false);
  const [loanAmount, setLoanAmount] = useState('2500');
  const [paymentMode, setPaymentMode] = useState<'auto' | 'manual'>('auto');
  const [showLoanSection, setShowLoanSection] = useState(false);

  // Stage 2 unlocked but bakery not purchased — show purchase screen
  if (!bakery && !save.townBank?.bakeryPurchased) {
    const bankBalance = save.townBank?.balance ?? 0;
    const canBuyOutright = save.coins >= BAKERY_PURCHASE_COST;
    const loanAmt = Number(loanAmount);
    const loanTotal = loanAmt >= 100 ? Math.ceil(loanAmt * (1 + LOAN_INTEREST_RATE)) : 0;
    const loanDaily = loanTotal ? Math.ceil(loanTotal / 34) : 0;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center py-2">
          <div className="text-5xl mb-2">🥖</div>
          <div className="font-black text-gray-800 text-xl">Buy the Bakery</div>
          <div className="text-sm text-gray-500 mt-1">A real investment in your future</div>
        </div>

        {/* Cost summary */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-amber-800">Bakery Cost</span>
            <span className="text-2xl font-black text-amber-700">${BAKERY_PURCHASE_COST.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-amber-600">
            <span>Your cash</span>
            <span className="font-bold">${save.coins}</span>
          </div>
          <div className="flex justify-between text-xs text-amber-600">
            <span>Bank balance</span>
            <span className="font-bold">${bankBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Grandpa quote */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-xl">👴</span>
          <p className="text-xs text-amber-800 italic leading-relaxed">
            "This is a real investment. It'll cost more than your lemonade stand ever did — but it can earn more too."
          </p>
        </div>

        {/* Buy outright */}
        <button
          onClick={onPurchaseBakery}
          disabled={!canBuyOutright || !onPurchaseBakery}
          className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-colors shadow-lg"
        >
          Buy Outright 💵 ${BAKERY_PURCHASE_COST.toLocaleString()}
        </button>
        {!canBuyOutright && (
          <p className="text-center text-xs text-gray-400">Need ${BAKERY_PURCHASE_COST - save.coins} more to buy outright</p>
        )}

        {/* Loan section */}
        {!showLoanSection ? (
          <button
            onClick={() => setShowLoanSection(true)}
            className="w-full py-3 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 text-orange-700 font-bold text-sm rounded-2xl transition-all"
          >
            💳 Take a Loan to Buy
          </button>
        ) : (
          <div className="border-2 border-orange-200 rounded-2xl p-4 space-y-3">
            <div className="font-bold text-gray-700 text-sm">Borrow to buy the bakery</div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Loan amount ($100 – $3,000)</label>
              <input
                type="number"
                min={100}
                max={3000}
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                className="w-full border-2 border-orange-200 rounded-xl px-4 py-2.5 text-center text-lg focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* Payment mode toggle */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Payment mode</div>
              <div className="flex gap-2">
                {(['auto', 'manual'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                      paymentMode === mode
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    {mode === 'auto' ? '🤖 Auto Pay' : '✋ Manual Pay'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {paymentMode === 'auto' ? 'Daily payments auto-deducted at midnight' : 'You control when to pay — watch for late fees!'}
              </p>
            </div>

            {loanAmt >= 100 && (
              <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between"><span>Borrow</span><span className="font-bold">${loanAmt}</span></div>
                <div className="flex justify-between"><span>Total repayable</span><span className="font-bold">${loanTotal}</span></div>
                <div className="flex justify-between"><span>Daily payment (~34 days)</span><span className="font-bold">${loanDaily}</span></div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowLoanSection(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (onTakeLoanAndBuy) onTakeLoanAndBuy(loanAmt, paymentMode); }}
                disabled={loanAmt < 100 || loanAmt > 3000 || !onTakeLoanAndBuy}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
              >
                Borrow & Buy 🥖
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: stage 2 unlocked but bakery not yet opened via old system
  if (!bakery) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="text-5xl">🥖</div>
        <div className="font-black text-gray-800 text-lg">Open Your Bakery!</div>
        <p className="text-sm text-gray-500 leading-relaxed px-2">
          There's an empty bakery across the bridge just waiting for you.
          Start with Lemon Muffins and build your reputation!
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left flex items-start gap-2">
          <span className="text-xl">👴</span>
          <p className="text-xs text-amber-800 italic leading-relaxed">
            "A bakery has real costs — ingredients, rent, maintenance.
            But if you price it right and keep customers happy, the profits will follow."
          </p>
        </div>
        <button onClick={onOpenBakery}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg rounded-2xl transition-colors shadow-lg">
          Open the Bakery! 🥖
        </button>
        {save.skill < 25 && (
          <p className="text-xs text-red-400">⚠️ You need Skill 25 to bake — chat with Grandpa to level up first!</p>
        )}
      </div>
    );
  }

  const availableProducts = (Object.values(BAKERY_PRODUCTS) as typeof BAKERY_PRODUCTS[BakeryProductId][]).filter(p => save.skill >= p.skillRequired);
  const hasAssignedEmployee = (save.employees ?? []).some(e => e.assignment === 'bakery');
  const repColor = bakery.reputation >= 70 ? 'bg-green-400' : bakery.reputation >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  function triggerPnL() {
    setShowPnL(true);
    setAnimatingPnL(true);
    setTimeout(() => setAnimatingPnL(false), 1200);
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">🥖</span>
        <div className="flex-1">
          <div className="font-bold text-gray-800">Your Bakery</div>
          <div className="text-xs text-gray-400">{bakery.batchesToday} batch{bakery.batchesToday !== 1 ? 'es' : ''} today · ${bakery.totalEarned} earned all time</div>
        </div>
        <button onClick={triggerPnL} className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded-xl">📊 P&L</button>
      </div>

      {/* Reputation */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-500">⭐ Reputation</span>
          <span className="text-xs text-gray-400">{bakery.reputation}/100</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div className={`${repColor} h-2 rounded-full transition-all`} style={{ width: `${bakery.reputation}%` }} />
        </div>
        {bakery.reputation < 40 && (
          <div className="text-xs text-red-500 mt-1">⚠️ Low reputation — train employees and watch your pricing!</div>
        )}
      </div>

      {/* Competitor event */}
      {bakery.competitorActive && !bakery.competitorResponseChosen && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏪</span>
            <div>
              <div className="font-bold text-red-800">A rival bakery just opened!</div>
              <div className="text-xs text-red-500">Your sales are down 15–25%. How will you respond?</div>
            </div>
          </div>
          <div className="space-y-2">
            {COMPETITOR_RESPONSES.map(r => (
              <button key={r.id} onClick={() => onRespondToCompetitor(r.id)}
                disabled={save.coins < r.cost}
                className="w-full flex items-center gap-2 p-2.5 bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 disabled:opacity-40 rounded-xl text-sm transition-all text-left">
                <span className="text-xl">{r.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.desc}{r.cost > 0 ? ` · costs $${r.cost}` : ''}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">There's no single right answer — choose what feels right.</div>
        </div>
      )}
      {bakery.competitorActive && bakery.competitorResponseChosen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          🏪 Rival bakery still active · Your response is in effect · Resolves in {bakery.competitorResolvesDay - save.dayNumber} day{bakery.competitorResolvesDay - save.dayNumber !== 1 ? 's' : ''}
        </div>
      )}

      {/* Price level */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <div className="text-xs font-bold text-gray-500 mb-2">🏷️ Pricing Strategy</div>
        <div className="flex gap-2">
          {(Object.entries(PRICE_LABELS) as [BakeryPriceLevel, typeof PRICE_LABELS[BakeryPriceLevel]][]).map(([level, info]) => (
            <button key={level} onClick={() => onSetPrice(level)}
              className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${bakery.priceLevel === level ? info.color + ' border-2' : 'bg-white border-gray-200 text-gray-400'}`}>
              {info.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">{PRICE_LABELS[bakery.priceLevel].desc}</div>
      </div>

      {/* Bake a batch */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bake a Batch</div>
        {availableProducts.length === 0 && (
          <div className="text-center py-3 text-gray-400 text-sm">Reach Skill 25 to start baking!</div>
        )}
        {availableProducts.map(product => {
          const pricePerUnit = product.baseSellPrice[bakery.priceLevel];
          // Mirror the demand calculation from runBakeryShift so the estimate is accurate
          const repMod = (bakery.reputation ?? 50) / 100;
          const competitorPenalty = bakery.competitorActive ? 0.8 : 1;
          const priceDemandMod = bakery.priceLevel === 'low' ? 1.2 : bakery.priceLevel === 'medium' ? 1.0 : 0.6;
          const estimatedUnitsSold = Math.min(product.batchSize, Math.floor(product.batchSize * repMod * competitorPenalty * priceDemandMod));
          const estimatedRevenue = estimatedUnitsSold * pricePerUnit;
          const fixedCosts = BAKERY_DAILY_RENT + BAKERY_DAILY_MAINTENANCE;
          const totalExpenses = product.ingredientCost + fixedCosts;
          const estimatedProfit = estimatedRevenue - totalExpenses;
          return (
            <button key={product.id} onClick={() => onRunShift(product.id as BakeryProductId)}
              disabled={tokensLeft < 1 || save.coins < product.ingredientCost}
              className="w-full flex items-center gap-3 p-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
              <span className="text-2xl">{product.emoji}</span>
              <div className="flex-1 text-left text-sm">
                Bake {product.name}
                <div className="text-xs opacity-80 font-normal">
                  ~{estimatedUnitsSold}/{product.batchSize} sold · ${product.ingredientCost} ingredients + ${fixedCosts} overhead
                </div>
                <div className={`text-xs font-bold ${estimatedProfit >= 0 ? 'text-white' : 'text-red-200'}`}>
                  Est. {estimatedProfit >= 0 ? `+$${estimatedProfit}` : `-$${Math.abs(estimatedProfit)}`} profit
                  {bakery.competitorActive && <span className="ml-1 opacity-75">(rival −20%)</span>}
                </div>
              </div>
              <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
            </button>
          );
        })}
        {save.skill < 30 && (
          <div className="text-xs text-indigo-400 text-center">🍞 Bread unlocks at Skill 30 · 🎂 Cake at Skill 35</div>
        )}
      </div>

      {/* Employee shortcut info */}
      {hasAssignedEmployee && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700">
          👩 Your bakery employee is working today — the bakery earns without your energy!
        </div>
      )}
      {!hasAssignedEmployee && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 text-xs text-gray-400 text-center">
          💡 Hire an employee from the Employees tab to run the bakery without using your energy
        </div>
      )}

      {/* P&L modal */}
      {showPnL && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowPnL(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl mb-2" onClick={e => e.stopPropagation()}>
            <div className="text-center font-bold text-gray-800 mb-4">📊 Today's Bakery Results</div>
            {bakery.todayRevenue === 0 ? (
              <div className="text-center text-gray-400 py-4">No baking done yet today.</div>
            ) : (
              <div className="space-y-2">
                <div className={`flex justify-between items-center py-2 border-b border-gray-100 transition-all ${animatingPnL ? 'opacity-0' : 'opacity-100'}`} style={{ transitionDelay: '0ms' }}>
                  <span className="text-sm text-gray-600">💰 Sales</span>
                  <span className="font-bold text-green-600">+${bakery.todayRevenue}</span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b border-gray-100 transition-all ${animatingPnL ? 'opacity-0' : 'opacity-100'}`} style={{ transitionDelay: '150ms' }}>
                  <span className="text-sm text-gray-600">🧪 Ingredients</span>
                  <span className="font-bold text-red-400">-${Math.max(0, bakery.todayExpenses - BAKERY_DAILY_RENT - BAKERY_DAILY_MAINTENANCE)}</span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b border-gray-100 transition-all ${animatingPnL ? 'opacity-0' : 'opacity-100'}`} style={{ transitionDelay: '300ms' }}>
                  <span className="text-sm text-gray-600">🏠 Rent</span>
                  <span className="font-bold text-red-400">-${BAKERY_DAILY_RENT}</span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b border-gray-100 transition-all ${animatingPnL ? 'opacity-0' : 'opacity-100'}`} style={{ transitionDelay: '450ms' }}>
                  <span className="text-sm text-gray-600">🔧 Maintenance</span>
                  <span className="font-bold text-red-400">-${BAKERY_DAILY_MAINTENANCE}</span>
                </div>
                <div className={`flex justify-between items-center py-2 mt-1 transition-all ${animatingPnL ? 'opacity-0' : 'opacity-100'}`} style={{ transitionDelay: '600ms' }}>
                  <span className="text-base font-bold text-gray-800">Profit</span>
                  <span className={`text-lg font-black ${bakery.todayRevenue - bakery.todayExpenses >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ${bakery.todayRevenue - bakery.todayExpenses}
                  </span>
                </div>
              </div>
            )}
            <button onClick={() => setShowPnL(false)} className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
