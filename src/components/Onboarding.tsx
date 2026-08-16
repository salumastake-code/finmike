'use client';
import { useState } from 'react';
import { DREAM_GOALS } from '@/lib/defaults';

interface Props {
  onComplete: (name: string, age: number, dreamGoalId: string) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(8);
  const [goalId, setGoalId] = useState(DREAM_GOALS[0].id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-green-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">

        {step === 0 && (
          <>
            <div className="text-6xl mb-4">🌍</div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">Grow Your World</h1>
            <p className="text-gray-600 mb-6 text-sm">Build a life, earn coins, reach your dreams.<br/>Your world, your choices.</p>
            <p className="text-gray-700 mb-3 font-medium">What's your name?</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name…"
              className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-lg text-center focus:outline-none focus:border-green-400 mb-4"
              maxLength={20}
            />
            <button
              disabled={!name.trim()}
              onClick={() => setStep(1)}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-lg transition-colors"
            >
              That's me! →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="text-6xl mb-4">🎂</div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Hi, {name}!</h2>
            <p className="text-gray-600 mb-4 text-sm">How old are you? Your world starts at the right size for you.</p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button onClick={() => setAge(a => Math.max(5, a - 1))} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full text-xl font-bold">−</button>
              <span className="text-4xl font-bold text-green-600">{age}</span>
              <button onClick={() => setAge(a => Math.min(16, a + 1))} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full text-xl font-bold">+</button>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-lg transition-colors"
            >
              That's right! →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Pick your Dream Goal</h2>
            <p className="text-gray-500 text-sm mb-4">You'll earn coins and save toward this. Pick what excites you most!</p>
            <div className="space-y-3 mb-6">
              {DREAM_GOALS.map((g: typeof DREAM_GOALS[0]) => (
                <button
                  key={g.id}
                  onClick={() => setGoalId(g.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-colors ${
                    goalId === g.id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-200'
                  }`}
                >
                  <span className="text-4xl">{g.emoji}</span>
                  <div className="text-left">
                    <div className="font-bold text-gray-800">{g.name}</div>
                    <div className="text-xs text-gray-500">Costs {g.cost} 🪙</div>
                  </div>
                  {goalId === g.id && <span className="ml-auto text-amber-500 text-xl">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => onComplete(name.trim(), age, goalId)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-lg transition-colors"
            >
              Let's go! 🚀
            </button>
          </>
        )}

      </div>
    </div>
  );
}
