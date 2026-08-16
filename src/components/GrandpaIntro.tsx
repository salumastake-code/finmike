'use client';
import { useState } from 'react';

interface Step {
  speaker: string;
  emoji: string;
  text: string;
  highlight?: string; // element to point at
}

const STEPS: Step[] = [
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Well, hello there! Welcome to our little town. I'm so glad you're here.",
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "I've been running this lemonade stand for years. And now... I think it's time to pass it on to you.",
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Here's how it works: you buy lemons, squeeze them into cups, and sell them to folks walking by. You keep the coins!",
    highlight: 'stand',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Every day you get Activity Tokens — think of them like your energy. Spend them wisely. You can't do everything at once!",
    highlight: 'tokens',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Now, is there something special you've been saving up for? A dream goal gives you something to work toward. That's what makes it fun!",
    highlight: 'dream',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "One more thing — keep an eye on the weather. Sunny days bring lots of customers. Rainy days... not so much.",
    highlight: 'weather',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "That's all you need to get started. Go on now — the stand is yours. I'll be right next door if you need me. 😄",
  },
];

interface Props {
  playerName: string;
  onDone: () => void;
}

export default function GrandpaIntro({ playerName, onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-6 px-4"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.4))' }}>

      {/* Scene hint arrows — contextual highlights */}
      {current.highlight === 'stand' && (
        <div className="absolute top-32 left-1/2 -translate-x-4 text-4xl animate-bounce">👆</div>
      )}
      {current.highlight === 'tokens' && (
        <div className="absolute top-56 right-8 text-3xl animate-bounce">👈</div>
      )}
      {current.highlight === 'dream' && (
        <div className="absolute top-64 left-1/2 -translate-x-12 text-3xl animate-bounce">👇</div>
      )}

      {/* Dialogue box */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Character header */}
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-3">
          <div className="text-5xl">{current.emoji}</div>
          <div>
            <div className="font-bold text-amber-900">{current.speaker}</div>
            <div className="text-xs text-amber-500">Your neighbor & mentor</div>
          </div>
          <div className="ml-auto text-xs text-amber-300">{step + 1}/{STEPS.length}</div>
        </div>

        {/* Dialogue text */}
        <div className="px-5 py-4 min-h-[90px]">
          <p className="text-gray-800 leading-relaxed text-base">
            {step === 0 ? `Well, hello there, ${playerName}! ` : ''}{current.text}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-amber-400' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Button */}
        <div className="px-5 pb-5">
          <button
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-base transition-colors"
          >
            {isLast ? "Let's go! 🍋" : 'Next →'}
          </button>
          {!isLast && (
            <button onClick={onDone} className="w-full mt-2 text-xs text-gray-300 hover:text-gray-400 transition-colors">
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
