'use client';
import type { DaySummary } from '@/types/game';

interface Props {
  summary: DaySummary;
  onReview: () => void;
}

export default function DaySummaryModal({ summary, onReview }: Props) {
  const hasPastDue = (summary.totalPastDue ?? 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl my-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-5 py-4">
          <div className="text-white font-black text-xl">🌙 Day {summary.day} Summary</div>
          <div className="text-gray-400 text-sm mt-0.5">Here's how your day went</div>
        </div>

        <div className="p-5 space-y-4">
          {/* Past Due Banner */}
          {hasPastDue && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-3">
              <div className="font-bold text-red-700 text-sm">
                ⚠️ Payment Past Due: ${summary.totalPastDue} — No new loans until resolved
              </div>
            </div>
          )}

          {/* Businesses table */}
          {summary.businesses.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Businesses</div>
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-bold">Business</th>
                      <th className="text-right px-2 py-2 text-gray-500 font-bold">Rev</th>
                      <th className="text-right px-2 py-2 text-gray-500 font-bold">Exp</th>
                      <th className="text-right px-2 py-2 text-gray-500 font-bold">Profit</th>
                      <th className="text-right px-2 py-2 text-gray-500 font-bold">Rep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.businesses.map((biz, i) => (
                      <>
                        <tr key={biz.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 font-medium text-gray-800">
                            {biz.emoji} {biz.name}
                          </td>
                          <td className="px-2 py-2 text-right text-green-600 font-bold">${biz.revenue}</td>
                          <td className="px-2 py-2 text-right text-red-400 font-bold">${biz.expenses}</td>
                          <td className={`px-2 py-2 text-right font-bold ${biz.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {biz.profit >= 0 ? '+' : ''}${biz.profit}
                          </td>
                          <td className={`px-2 py-2 text-right font-bold ${biz.repDelta > 0 ? 'text-green-600' : biz.repDelta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {biz.repDelta > 0 ? `+${biz.repDelta}` : biz.repDelta === 0 ? '—' : biz.repDelta}
                          </td>
                        </tr>
                        {biz.notes.length > 0 && (
                          <tr key={`${biz.name}-notes`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td colSpan={5} className="px-3 pb-2">
                              <div className="flex flex-wrap gap-1">
                                {biz.notes.map(note => (
                                  <span key={note} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                    {note}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cash & Savings */}
          <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">💵 Your cash</span>
              <span className={`font-bold text-sm ${summary.cashChange >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {summary.cashChange >= 0 ? '+' : ''}${summary.cashChange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">🏦 Savings balance</span>
              <span className="font-bold text-sm text-indigo-700">${summary.savingsBalance.toFixed(2)}</span>
            </div>
            {summary.savingsInterest > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">  Interest earned</span>
                <span className="text-xs text-green-600 font-bold">+${summary.savingsInterest.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Loan row */}
          {(summary.loanPayment !== undefined || summary.loanMissed) && (
            <div className={`rounded-2xl p-3 ${summary.loanMissed ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">📋 Loan Payment</span>
                {summary.loanMissed ? (
                  <span className="text-sm font-black text-red-600">MISSED</span>
                ) : (
                  <span className="text-sm font-bold text-orange-700">-${summary.loanPayment}</span>
                )}
              </div>
              {summary.loanMissed && summary.lateFee && (
                <div className="text-xs text-red-500 mt-1">Late fee: +${summary.lateFee}</div>
              )}
            </div>
          )}

          {/* Start next day button */}
          <button
            onClick={onReview}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base rounded-2xl transition-colors shadow-lg"
          >
            Start Day {summary.day + 1}! 🌅
          </button>
        </div>
      </div>
    </div>
  );
}
