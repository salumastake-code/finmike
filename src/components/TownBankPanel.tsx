'use client';
import { useState } from 'react';
import type { PlayerSave } from '@/types/game';
import { BANK_INTEREST_RATE, LOAN_INTEREST_RATE } from '@/lib/stage2';

interface Props {
  save: PlayerSave;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onTakeLoan: (amount: number, mode: 'auto' | 'manual') => void;
  onManualPayment?: () => void;
}

export default function TownBankPanel({ save, onDeposit, onWithdraw, onTakeLoan, onManualPayment }: Props) {
  const bank = save.townBank;
  const [loanInput, setLoanInput] = useState('');
  const [showLoan, setShowLoan] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'auto' | 'manual'>('auto');

  if (!bank) return <div className="text-center py-8 text-gray-400">Town Bank not yet unlocked.</div>;

  const loan = bank.loan;
  const hasActiveLoan = loan && loan.remainingDays > 0;
  const depositOptions = [10, 25, 50, 100];
  const withdrawOptions = [10, 25, 50];

  const hasPastDue = (bank?.loan?.pastDue ?? 0) > 0;
  const isManualLoan = bank?.loan?.paymentMode === 'manual';

  return (
    <div className="space-y-3">
      {/* Past Due Banner */}
      {hasPastDue && bank?.loan && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-3">
          <div className="font-bold text-red-700 text-sm">
            ⚠️ Payment Past Due: ${bank.loan.pastDue} — No new loans until resolved
          </div>
          {bank.loan.lateFees > 0 && (
            <div className="text-xs text-red-500 mt-1">Cumulative late fees: ${bank.loan.lateFees}</div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-3xl">🏦</span>
        <div>
          <div className="font-bold text-gray-800">Town Bank</div>
          <div className="text-xs text-gray-400">Your savings earn {(BANK_INTEREST_RATE * 100).toFixed(1)}% interest every night</div>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Your Balance</div>
        <div className="text-3xl font-black text-indigo-700">${bank.balance.toFixed(2)}</div>
        <div className="text-xs text-indigo-400 mt-1">+${bank.totalInterestEarned.toFixed(2)} interest earned total</div>

        {/* Deposit */}
        <div className="mt-3">
          <div className="text-xs font-bold text-indigo-500 mb-1">Deposit:</div>
          <div className="flex gap-1.5 flex-wrap">
            {depositOptions.map(amt => (
              <button key={amt} onClick={() => onDeposit(amt)}
                disabled={save.coins < amt}
                className="text-xs bg-indigo-400 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-xl">
                +${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Withdraw */}
        {bank.balance > 0 && (
          <div className="mt-2">
            <div className="text-xs font-bold text-indigo-400 mb-1">Withdraw:</div>
            <div className="flex gap-1.5 flex-wrap">
              {withdrawOptions.map(amt => (
                <button key={amt} onClick={() => onWithdraw(amt)}
                  disabled={bank.balance < amt}
                  className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-600 font-bold px-3 py-1.5 rounded-xl">
                  -${amt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grandpa loan explainer (first visit feel) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <span className="text-2xl">👴</span>
        <p className="text-xs text-amber-800 italic leading-relaxed">
          "A loan lets you get something sooner — like opening the bakery before you have all the money.
          But remember: some of everything you earn will already be spoken for until it's paid back."
        </p>
      </div>

      {/* Active loan */}
      {hasActiveLoan && loan && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📋</span>
            <div>
              <div className="font-bold text-orange-800">Active Loan</div>
              <div className="text-xs text-orange-500">
                {isManualLoan ? '✋ Manual Pay — you choose when to pay' : `$${loan.dailyPayment}/day auto-deducted`}
              </div>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Borrowed</span>
              <span className="font-bold">${loan.principal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total to repay</span>
              <span className="font-bold">${loan.totalRepayable}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid so far</span>
              <span className="font-bold text-green-600">${loan.amountRepaid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Days remaining</span>
              <span className="font-bold text-orange-600">{loan.remainingDays} days</span>
            </div>
          </div>
          {loan.missedPayments > 0 && (
            <div className="mt-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-2">
              ⚠️ {loan.missedPayments} missed payment{loan.missedPayments > 1 ? 's' : ''} — keep more cash on hand!
            </div>
          )}
          {/* Manual payment button */}
          {isManualLoan && onManualPayment && (
            <button
              onClick={onManualPayment}
              disabled={save.coins < loan.dailyPayment}
              className="w-full mt-3 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
            >
              💳 Make Payment (${loan.dailyPayment})
            </button>
          )}
          <div className="w-full bg-orange-100 rounded-full h-2 mt-3">
            <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${(loan.amountRepaid / loan.totalRepayable) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Take a loan */}
      {!hasActiveLoan && (
        <div>
          {!showLoan ? (
            <button onClick={() => setShowLoan(true)}
              className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 rounded-2xl transition-all">
              <span className="text-2xl">💳</span>
              <div className="flex-1 text-left text-sm font-bold text-orange-700">
                Apply for a Loan
                <div className="text-xs font-normal text-orange-400">{(LOAN_INTEREST_RATE * 100).toFixed(0)}% interest · auto-repaid daily · min $100</div>
              </div>
            </button>
          ) : (
            <div className="border-2 border-orange-200 rounded-2xl p-4 space-y-3">
              <div className="font-bold text-gray-700 text-sm">How much do you want to borrow?</div>
              <input type="number" min={100} max={2000} value={loanInput} onChange={e => setLoanInput(e.target.value)}
                placeholder="$100 – $2,000"
                className="w-full border-2 border-orange-200 rounded-xl px-4 py-2.5 text-center text-lg focus:outline-none focus:border-orange-400" />
              {loanInput && Number(loanInput) >= 100 && (
                <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between"><span>Borrow</span><span className="font-bold">${loanInput}</span></div>
                  <div className="flex justify-between"><span>Total repayable</span><span className="font-bold">${Math.ceil(Number(loanInput) * (1 + LOAN_INTEREST_RATE))}</span></div>
                  <div className="flex justify-between"><span>Daily payment (~34 days)</span><span className="font-bold">${Math.ceil(Math.ceil(Number(loanInput) * (1 + LOAN_INTEREST_RATE)) / 34)}</span></div>
                </div>
              )}
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
                  {paymentMode === 'auto' ? 'Payments auto-deducted overnight' : 'You pay manually — watch for late fees!'}
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowLoan(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm">Cancel</button>
                <button onClick={() => { onTakeLoan(Number(loanInput), paymentMode); setShowLoan(false); setLoanInput(''); setPaymentMode('auto'); }}
                  disabled={!loanInput || Number(loanInput) < 100 || Number(loanInput) > 2000}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm">
                  Borrow it!
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
