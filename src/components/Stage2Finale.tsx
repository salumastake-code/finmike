'use client';
import { useState } from 'react';

interface Props {
  playerName: string;
  characterEmoji: string;
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '👴',
    title: 'Grandpa has something to say...',
    text: `"Come sit with me. I've been watching you — and I want to tell you something important."`,
  },
  {
    emoji: '🏪',
    title: 'You built something real.',
    text: `"You started with a few dollars and a lemon stand. Now you have two stands, a bike, a pond you fish from, and a whole neighborhood that knows your name."`,
  },
  {
    emoji: '⭐',
    title: 'Your skill earned this.',
    text: `"You didn't just work harder — you learned. Revenue vs profit. Saving vs spending. When to hire, when to do it yourself. That's not luck. That's skill."`,
  },
  {
    emoji: '🌉',
    title: "There's a bigger town across the bridge.",
    text: `"I've been there. There's a bakery that needs a good owner. People who need help walking their dogs. Even a Town Bank. And a park that this community deserves to have built."`,
  },
  {
    emoji: '🚀',
    title: 'Ready to cross?',
    text: `"Your Stage 1 businesses will keep running while you're over there. You can always come back. But the bridge is open now — and I think you're ready."`,
  },
];

export default function Stage2Finale({ playerName, characterEmoji, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-indigo-600 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-7 shadow-2xl text-center">

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {SLIDES.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-indigo-500' : 'w-2 h-2 bg-gray-200'}`} />
          ))}
        </div>

        <div className="text-5xl mb-3">{slide.emoji}</div>
        <div className="font-black text-gray-800 text-lg mb-3">{slide.title}</div>
        <p className="text-gray-600 text-sm leading-relaxed italic mb-6">
          {slide.text.replace('{playerName}', playerName)}
        </p>

        {isLast ? (
          <div className="space-y-2">
            <div className="text-4xl mb-2">{characterEmoji}</div>
            <button onClick={onComplete}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg rounded-2xl transition-colors shadow-lg">
              Cross the Bridge! 🌉
            </button>
          </div>
        ) : (
          <button onClick={() => setStep(s => s + 1)}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-colors">
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
