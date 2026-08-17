'use client';
import { useState, useEffect } from 'react';
import type { DreamGoal } from '@/types/game';

interface NextGoal {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  unlocks: string;
  unlocksDesc: string;
}

export const NEXT_GOALS: NextGoal[] = [
  {
    id: 'garden',
    name: 'Garden Plot',
    emoji: '🌱',
    cost: 60,
    unlocks: 'garden',
    unlocksDesc: 'Grow strawberries, tomatoes & herbs. Sell them at the market!',
  },
  {
    id: 'puppy',
    name: 'Puppy',
    emoji: '🐶',
    cost: 100,
    unlocks: 'pet',
    unlocksDesc: 'A loyal friend who lives at your home and keeps you company.',
  },
  {
    id: 'treehouse',
    name: 'Treehouse',
    emoji: '🌳',
    cost: 160,
    unlocks: 'treehouse',
    unlocksDesc: 'A secret hangout spot. Unlocks new quests and characters.',
  },
];

interface Props {
  completedGoal: DreamGoal;
  onPickNext: (goalId: string) => void;
}

export default function DreamCelebration({ completedGoal, onPickNext }: Props) {
  const [step, setStep] = useState<'celebrate' | 'pick'>('celebrate');
  const [picked, setPicked] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<Array<{ x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    // Generate confetti pieces
    const colors = ['#FCD34D', '#34D399', '#60A5FA', '#F87171', '#A78BFA', '#FB923C'];
    setConfetti(Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 60,
      color: colors[i % colors.length],
      delay: Math.random() * 1.5,
    })));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/60 px-4 pb-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden">

        {step === 'celebrate' && (
          <>
            {/* Confetti area */}
            <div className="relative bg-gradient-to-b from-yellow-300 to-amber-400 h-48 overflow-hidden flex items-center justify-center">
              {confetti.map((c, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-sm animate-bounce"
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    backgroundColor: c.color,
                    animationDelay: `${c.delay}s`,
                    transform: `rotate(${Math.random() * 45}deg)`,
                  }}
                />
              ))}
              <div className="text-center z-10">
                <div className="text-7xl mb-2 drop-shadow-lg">{completedGoal.emoji}</div>
                <div className="text-white font-black text-2xl drop-shadow">{completedGoal.name}</div>
              </div>
            </div>

            {/* Message */}
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-xl font-black text-gray-800 mb-1">You did it!</h2>
              <p className="text-gray-500 text-sm mb-2">
                You saved up and reached your dream. That's real money skills right there.
              </p>

              {/* Grandpa */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 text-left">
                <span className="text-3xl">👴</span>
                <p className="text-sm text-amber-800 italic">
                  "I knew you could do it. You worked hard, you saved smart, and your piggy bank helped too. I'm proud of you."
                </p>
              </div>

              <button
                onClick={() => setStep('pick')}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-lg transition-colors"
              >
                Pick Your Next Dream →
              </button>
            </div>
          </>
        )}

        {step === 'pick' && (
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">✨</div>
              <h2 className="text-lg font-black text-gray-800">What's next?</h2>
              <p className="text-sm text-gray-400">Each dream unlocks something new in your world.</p>
            </div>

            <div className="space-y-3 mb-5">
              {NEXT_GOALS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setPicked(goal.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    picked === goal.id
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <span className="text-4xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{goal.name}</div>
                    <div className="text-xs text-green-600 font-medium mb-0.5">🔓 Unlocks: {goal.unlocksDesc}</div>
                    <div className="text-xs text-gray-400">Save ${goal.cost}</div>
                  </div>
                  {picked === goal.id && <span className="text-green-500 text-xl">✓</span>}
                </button>
              ))}
            </div>

            <button
              disabled={!picked}
              onClick={() => picked && onPickNext(picked)}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black rounded-2xl text-lg transition-colors"
            >
              Let's go! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
