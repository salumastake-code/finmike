'use client';
import React, { useState } from 'react';

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
    text: "See the map up top? Tap on Your Stand to get started. That's where you'll buy lemons and sell lemonade!",
    highlight: 'map',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "See that sky up top? That's your day — 5 shifts from 7am to 11pm. Each thing you do moves the sun. When it sets, it's bedtime!",
    highlight: 'tokens',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "When you're ready to sleep and start a new day, tap Home on the map. That's also where you save toward your Dream Goal!",
    highlight: 'home',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Keep an eye on the weather too. Sunny days bring lots of customers. Rainy days... not so much.",
    highlight: 'weather',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Oh — one more secret. Every night while you sleep, your piggy bank grows all on its own. The more you save, the more it grows. Like magic! 🐷",
    highlight: 'home',
  },
  {
    speaker: 'Grandpa',
    emoji: '👴',
    text: "Alright, that's all you need! Go on now — tap Your Stand and make your first sale. I'll be right next door. 😄",
    highlight: 'map',
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

  // Inline highlight callouts — shown inside the dialogue box, reliable on all screen sizes
  const highlightContent: Record<string, React.ReactNode> = {
    map: (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-800">
        <span className="text-xl" style={{ display: 'inline-block', animation: 'bounceUp 0.7s ease-in-out infinite' }}>👆</span>
        <span>Look at the map above and tap <strong>Your Stand</strong></span>
      </div>
    ),
    tokens: (
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-800">
        <span className="text-xl" style={{ display: 'inline-block', animation: 'bounceUp 0.7s ease-in-out infinite' }}>👆</span>
        <span>The <strong>day clock</strong> is right below the map — watch the sun move!</span>
      </div>
    ),
    home: (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-800">
        <span className="text-xl" style={{ display: 'inline-block', animation: 'bounceUp 0.7s ease-in-out infinite' }}>👆</span>
        <span>Tap <strong>Home</strong> on the map or in the tab bar below</span>
      </div>
    ),
    weather: (
      <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-sm text-sky-800">
        <span className="text-xl" style={{ display: 'inline-block', animation: 'bounceUp 0.7s ease-in-out infinite' }}>👆</span>
        <span>The <strong>weather</strong> shows next to your activity tokens</span>
      </div>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-6 px-4"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.4))' }}>


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
        <div className="px-5 py-4 space-y-3">
          <p className="text-gray-800 leading-relaxed text-base">
            {step === 0 ? `Well, hello there, ${playerName}! ` : ''}{current.text}
          </p>
          {/* Inline contextual highlight — no broken absolute positioning */}
          {current.highlight && highlightContent[current.highlight] && (
            <div>{highlightContent[current.highlight]}</div>
          )}
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
