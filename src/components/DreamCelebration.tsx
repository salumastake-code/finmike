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
  worldPreview: string; // what actually appears in the world
}

export const NEXT_GOALS: NextGoal[] = [
  {
    id: 'garden',
    name: 'Garden Plot',
    emoji: '🌱',
    cost: 60,
    unlocks: 'garden',
    unlocksDesc: 'Grow strawberries, tomatoes & herbs. Sell them at the market!',
    worldPreview: 'A new Garden location appears on your map 🗺️',
  },
  {
    id: 'puppy',
    name: 'Puppy',
    emoji: '🐶',
    cost: 100,
    unlocks: 'pet',
    unlocksDesc: 'A loyal friend who lives at your home and keeps you company.',
    worldPreview: 'Your puppy moves into your house 🏡',
  },
  {
    id: 'treehouse',
    name: 'Treehouse',
    emoji: '🌳',
    cost: 160,
    unlocks: 'treehouse',
    unlocksDesc: 'A secret hangout spot with new quests and hidden butterflies.',
    worldPreview: 'The Treehouse appears on your map with new questlines 🦋',
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    emoji: '🚲',
    cost: 80,
    unlocks: 'bicycle',
    unlocksDesc: 'Get around town faster — unlocks delivery quests and new areas.',
    worldPreview: 'New delivery quest from Buzzy Bee appears on your map 📦',
  },
];

const GRANDPA_QUOTES: Record<string, string> = {
  garden:    "A garden! You saved every dollar with patience, just like tending a seed. Now watch what grows.",
  puppy:     "A puppy! You stayed focused and kept saving even when it was tough. That little pup is lucky to have you.",
  treehouse: "A treehouse! You set a big goal and you reached it. That's something most grown-ups struggle with.",
  default:   "I knew you could do it. You worked hard, you saved smart, and your piggy bank helped too. I'm proud of you.",
};

interface ConfettiPiece {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  shape: 'square' | 'circle' | 'rect';
}

interface Props {
  completedGoal: DreamGoal;
  unlockedGoals?: string[]; // already-unlocked goal ids to exclude
  onPickNext: (goalId: string) => void;
}

export default function DreamCelebration({ completedGoal, unlockedGoals = [], onPickNext }: Props) {
  const [step, setStep] = useState<'celebrate' | 'pick'>('celebrate');
  const [picked, setPicked] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showGoal, setShowGoal] = useState(false);

  // Filter out completed goal AND any already-unlocked goals
  const alreadyDone = new Set([completedGoal.id, ...unlockedGoals]);
  const availableGoals = NEXT_GOALS.filter(g => !alreadyDone.has(g.id));

  useEffect(() => {
    const colors = ['#FCD34D', '#34D399', '#60A5FA', '#F87171', '#A78BFA', '#FB923C', '#FFFFFF', '#FDE68A'];
    setConfetti(Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      size: 6 + Math.random() * 8,
      color: colors[i % colors.length],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      shape: (['square', 'circle', 'rect'] as const)[i % 3],
    })));
    // Pop the goal emoji in after a short delay
    setTimeout(() => setShowGoal(true), 200);
  }, []);

  const grandpaQuote = GRANDPA_QUOTES[completedGoal.id] || GRANDPA_QUOTES.default;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/70 px-4 pb-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden">

        {step === 'celebrate' && (
          <>
            {/* Hero area with falling confetti */}
            <div className="relative bg-gradient-to-b from-amber-300 via-yellow-300 to-amber-400 h-52 overflow-hidden flex flex-col items-center justify-center">
              {/* Falling confetti */}
              {confetti.map((c, i) => (
                <div
                  key={i}
                  className="absolute top-0"
                  style={{
                    left: `${c.x}%`,
                    width: c.shape === 'rect' ? c.size * 0.5 : c.size,
                    height: c.shape === 'rect' ? c.size * 1.8 : c.size,
                    backgroundColor: c.color,
                    borderRadius: c.shape === 'circle' ? '50%' : c.shape === 'rect' ? '2px' : '2px',
                    animation: `confettiFall ${c.duration}s ${c.delay}s ease-in infinite`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0.9,
                  }}
                />
              ))}

              {/* Big goal emoji — pops in */}
              <div
                className="z-10 text-center transition-all duration-500"
                style={{
                  transform: showGoal ? 'scale(1)' : 'scale(0)',
                  opacity: showGoal ? 1 : 0,
                }}
              >
                <div className="text-8xl mb-2 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                  {completedGoal.emoji}
                </div>
                <div className="text-white font-black text-2xl drop-shadow-lg tracking-wide">
                  {completedGoal.name}!
                </div>
              </div>

              {/* Sparkle corners */}
              <div className="absolute top-3 left-4 text-2xl animate-spin" style={{ animationDuration: '3s' }}>✨</div>
              <div className="absolute top-3 right-4 text-2xl animate-spin" style={{ animationDuration: '2s' }}>⭐</div>
              <div className="absolute bottom-4 left-8 text-xl animate-bounce">🎊</div>
              <div className="absolute bottom-4 right-8 text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</div>
            </div>

            {/* Message */}
            <div className="p-5 text-center">
              <h2 className="text-2xl font-black text-gray-800 mb-1">You did it! 🙌</h2>
              <p className="text-gray-500 text-sm mb-4">
                You set a goal, saved up, and made it happen. That's a real life skill.
              </p>

              {/* Grandpa quote */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 text-left">
                <span className="text-3xl flex-shrink-0">👴</span>
                <p className="text-sm text-amber-800 italic leading-relaxed">
                  "{grandpaQuote}"
                </p>
              </div>

              <button
                onClick={() => setStep('pick')}
                className="w-full py-4 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black rounded-2xl text-lg transition-all shadow-lg shadow-green-200"
              >
                What's my next dream? →
              </button>
            </div>
          </>
        )}

        {step === 'pick' && availableGoals.length === 0 && (
          <div className="p-6 text-center">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-xl font-black text-gray-800 mb-2">You've done it all!</h2>
            <p className="text-sm text-gray-500 mb-2">You unlocked every dream in your world.</p>
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 text-left">
              <span className="text-3xl flex-shrink-0">👴</span>
              <p className="text-sm text-amber-800 italic leading-relaxed">
                "You saved for everything you dreamed of. That's not luck — that's character. I couldn't be prouder."
              </p>
            </div>
            <button
              onClick={() => onPickNext('__done__')}
              className="w-full py-4 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black rounded-2xl text-lg transition-all"
            >
              Back to my world 🌍
            </button>
          </div>
        )}

        {step === 'pick' && availableGoals.length > 0 && (
          <div className="p-5">
            <div className="text-center mb-5">
              <div className="text-4xl mb-1">✨</div>
              <h2 className="text-xl font-black text-gray-800">Pick your next dream</h2>
              <p className="text-sm text-gray-400 mt-1">Each one unlocks something new in your world.</p>
            </div>

            <div className="space-y-3 mb-5">
              {availableGoals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setPicked(goal.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left active:scale-95 ${
                    picked === goal.id
                      ? 'border-green-400 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-200 bg-white'
                  }`}
                >
                  <span className="text-4xl flex-shrink-0">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-black text-gray-800">{goal.name}</div>
                      <div className="text-sm font-bold text-amber-600 flex-shrink-0">${goal.cost}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">{goal.unlocksDesc}</div>
                    <div className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                      <span>🗺️</span> {goal.worldPreview}
                    </div>
                  </div>
                  {picked === goal.id && (
                    <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              disabled={!picked}
              onClick={() => picked && onPickNext(picked)}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-black rounded-2xl text-lg transition-all shadow-lg shadow-amber-200"
            >
              Let's go! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
