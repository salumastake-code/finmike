'use client';
import type { DreamGoal } from '@/types/game';

interface Props {
  goal: DreamGoal;
  onContribute: (amount: number) => void;
  coins: number;
}

export default function DreamGoalBar({ goal, onContribute, coins }: Props) {
  const pct = Math.min(100, Math.round((goal.saved / goal.cost) * 100));

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">{goal.emoji}</span>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-amber-900 text-sm">Dream Goal: {goal.name}</span>
            <span className="text-amber-700 text-xs font-mono">{goal.saved}/{goal.cost} 🪙</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-4 border border-amber-200">
            <div
              className="bg-gradient-to-r from-yellow-400 to-amber-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-right text-xs text-amber-600 mt-0.5">{pct}%</div>
        </div>
      </div>
      {goal.unlocked ? (
        <div className="text-center text-green-700 font-bold text-lg animate-bounce">🎉 Dream Reached!</div>
      ) : (
        <div className="flex gap-2 mt-2">
          {[5, 10, 25].map(amt => (
            <button
              key={amt}
              disabled={coins < amt}
              onClick={() => onContribute(amt)}
              className="flex-1 text-xs bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-1.5 rounded-xl transition-colors"
            >
              Save {amt} 🪙
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
