'use client';
import { useState } from 'react';
import type { PlayerSave, GrandpaLesson as GrandpaLessonType } from '@/types/game';

interface LessonContent {
  intro: string;
  story: string[];
  question: string;
  options: { text: string; correct: boolean; response: string }[];
  closing: string;
}

const LESSON_CONTENT: Record<string, LessonContent> = {
  profit: {
    intro: "Let me ask you something, {name}. Imagine you sell $10 of lemonade today. How much do you actually keep?",
    story: [
      "You'd think $10, right? But wait — you had to buy lemons first. Those lemons cost you $4.",
      "So you put $4 in... and $10 came out. But the $4 was already yours before! So you only really gained...",
      "💡 $10 Sales − $4 Costs = $6 Profit. That's what's actually new in your pocket.",
      "The $10 you collected is called Revenue. What you keep after paying costs is called Profit. They're not the same thing!",
    ],
    question: "If you sell $15 of lemonade and spent $6 on lemons, what's your profit?",
    options: [
      { text: "$15", correct: false, response: "That's the revenue — the total you collected. But you spent $6 on lemons first!" },
      { text: "$9", correct: true,  response: "Exactly! $15 − $6 = $9. That's your profit — what you actually keep. 🎉" },
      { text: "$6", correct: false, response: "That's what you spent on lemons, not what you kept. Try again!" },
    ],
    closing: "Remember: revenue is what comes in. Profit is what stays. Always know the difference!",
  },
  saving: {
    intro: "Here's a question, {name}: if I gave you $10 right now, would you spend it or save it?",
    story: [
      "Both are okay! But let's see what happens if you save it...",
      "You put $10 in your piggy bank. Tomorrow it's still $10. But your piggy bank earns a little bit every day — a tiny amount called interest.",
      "After a few weeks, your $10 might become $10.25. Not huge, but here's the magic: that 25 cents ALSO starts earning interest.",
      "💡 Money earning money — that's called compounding. The longer you save, the faster it grows!",
      "And your savings is always there if you need it. It's not gone — it's just working for you.",
    ],
    question: "You save $20. A few days later it grows to $20.05 from interest. What happens next?",
    options: [
      { text: "The $0.05 disappears", correct: false, response: "Nope! Interest you earn stays in your bank — it's yours!" },
      { text: "The $0.05 also earns interest now", correct: true, response: "Yes! Now your $20.05 all earns interest. That's compounding — money making more money! 🎉" },
      { text: "Nothing changes", correct: false, response: "Something does change — your total grows a tiny bit every day!" },
    ],
    closing: "Saving doesn't mean you can never spend it. It means your money is safe AND growing while you decide.",
  },
  opportunity_cost: {
    intro: "You've got 5 Suns today, {name}. Let's look at everything you could do with them...",
    story: [
      "You could: work the lemonade stand 🥤, tend the garden 🌱, play with your puppy 🐶, hang out with a friend 👋, or learn something new with me 📚",
      "But here's the thing — you can't do all five. If you spend a Sun on lemonade, that's a Sun you can't use for your puppy.",
      "💡 Every choice you make means giving up something else. That something else is called the Opportunity Cost.",
      "There's no wrong answer here! Sometimes lemonade is the right call. Sometimes your puppy needs you more.",
      "The skill is knowing what matters most TODAY — not just what makes the most money.",
    ],
    question: "You use your last Sun to work the stand and earn $8. What's the opportunity cost?",
    options: [
      { text: "The $8 you earned", correct: false, response: "That's what you gained. The opportunity cost is what you gave up!" },
      { text: "Whatever else you could have done with that Sun", correct: true, response: "Exactly! It could have been puppy time, or a lesson, or garden time. That's the real cost. 🎉" },
      { text: "Nothing — money is always worth it", correct: false, response: "Not always! Time with your puppy or friends has value too, even if it doesn't make money." },
    ],
    closing: "Time is your most limited resource. Money comes and goes — but a Sun you've spent is gone forever.",
  },
  hiring: {
    intro: "Tell me something, {name} — would you rather make $20 and use a Sun, or make $13 and keep your Sun free?",
    story: [
      "Most people say $20 — more money! But let's think about what you'd do with that free Sun...",
      "If you hire someone to run the stand for $5, and they bring in $18, you keep $13. You used no Energy.",
      "With that free Sun, you could tend the garden 🌱 and earn another $8. Or learn a skill. Or play with your puppy.",
      "💡 You made $13 from the stand + $8 from the garden = $21 total. More than the $20 you'd make alone!",
      "Hiring doesn't always make less money. Sometimes it unlocks more — because your time is valuable too.",
    ],
    question: "You hire someone for $5. They earn $18. You use your free time to grow crops worth $10. What did you actually earn?",
    options: [
      { text: "$13 (the stand profit only)", correct: false, response: "Don't forget your garden! You earned from both." },
      { text: "$23 ($13 stand + $10 garden)", correct: true, response: "Yes! $18 − $5 = $13 from the stand, plus $10 from the garden. Hiring paid off! 🎉" },
      { text: "$18 (just the revenue)", correct: false, response: "Remember to subtract the $5 you paid your helper — that's a real cost." },
    ],
    closing: "The goal isn't to do everything yourself. The goal is to build a life you love — and sometimes that means letting others help.",
  },
  diversification: {
    intro: "What happens to your lemonade stand on a rainy day, {name}?",
    story: [
      "Rain means fewer customers. Your best day might bring $15 of lemonade revenue — on a rainy day, maybe $4.",
      "But what if, on rainy days, you could deliver lemons to the bakery? 5 lemons for $10. The rain doesn't stop that!",
      "Or your garden — the rain actually helps your crops grow faster. 🌱",
      "💡 When you have different ways to earn, one bad thing doesn't ruin everything. That's called diversification.",
      "In Stage 1 we have: lemonade stand, garden, lemon tree, and bakery deliveries. Four different income sources — four different reactions to rain.",
    ],
    question: "It's a stormy day. Your lemonade only earns $3. But your tomato crop is ready to sell for $8. How do you feel?",
    options: [
      { text: "Terrible — the storm ruined the day", correct: false, response: "Look again! Your garden still worked. The storm only hurt one thing." },
      { text: "Okay — the garden made up for the slow stand", correct: true, response: "Exactly! Different activities respond differently to weather. That's why having more than one matters. 🎉" },
      { text: "I don't know", correct: false, response: "Think about it: $3 from lemonade + $8 from tomatoes = $11. Not bad for a stormy day!" },
    ],
    closing: "Later, we'll see this same idea applied to businesses, then investments. For now — plant more than just lemons!",
  },
};

interface Props {
  lesson: GrandpaLessonType;
  playerName: string;
  onComplete: (lessonId: string, skillGained: number) => void;
  onClose: () => void;
}

type Step = 'intro' | 'story' | 'question' | 'closing';

export default function GrandpaLesson({ lesson, playerName, onComplete, onClose }: Props) {
  const content = LESSON_CONTENT[lesson.concept];
  const [step, setStep] = useState<Step>('intro');
  const [storyIndex, setStoryIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);

  if (!content) return null;

  const intro = content.intro.replace('{name}', playerName);

  function handleAnswer(idx: number) {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
  }

  function handleNext() {
    if (step === 'intro') {
      setStep('story');
      setStoryIndex(0);
    } else if (step === 'story') {
      if (storyIndex < content.story.length - 1) {
        setStoryIndex(i => i + 1);
      } else {
        setStep('question');
      }
    } else if (step === 'question' && answered) {
      setStep('closing');
    } else if (step === 'closing') {
      setDone(true);
      onComplete(lesson.id, lesson.skillReward);
    }
  }

  const correctIdx = content.options.findIndex(o => o.correct);
  const isCorrect = selectedOption === correctIdx;

  if (done) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">👴</span>
            <div>
              <div className="font-black text-gray-800 text-base">Grandpa's Lesson</div>
              <div className="text-xs text-amber-600 font-medium">{lesson.title}</div>
            </div>
            <div className="ml-auto text-xs bg-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-full">
              +{lesson.skillReward} Skill ⭐
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-3">
            {(['intro', 'story', 'question', 'closing'] as Step[]).map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full flex-1 transition-all ${
                s === step ? 'bg-amber-400' :
                (['intro', 'story', 'question', 'closing'] as Step[]).indexOf(step) > i ? 'bg-amber-300' : 'bg-amber-100'
              }`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 min-h-48">
          {step === 'intro' && (
            <p className="text-gray-700 text-base leading-relaxed">{intro}</p>
          )}

          {step === 'story' && (
            <p className="text-gray-700 text-base leading-relaxed">{content.story[storyIndex]}</p>
          )}

          {step === 'question' && (
            <div className="space-y-3">
              <p className="text-gray-800 font-bold text-base">{content.question}</p>
              {content.options.map((opt, idx) => {
                let cls = 'w-full text-left p-3.5 rounded-2xl border-2 text-sm font-medium transition-all ';
                if (!answered) {
                  cls += 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50 cursor-pointer';
                } else if (idx === correctIdx) {
                  cls += 'border-green-400 bg-green-50 text-green-800';
                } else if (idx === selectedOption && !isCorrect) {
                  cls += 'border-red-300 bg-red-50 text-red-700';
                } else {
                  cls += 'border-gray-100 bg-gray-50 text-gray-400';
                }
                return (
                  <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={answered}>
                    {opt.text}
                    {answered && idx === correctIdx && <span className="ml-2">✅</span>}
                    {answered && idx === selectedOption && !isCorrect && <span className="ml-2">❌</span>}
                  </button>
                );
              })}
              {answered && (
                <div className={`p-3 rounded-2xl text-sm ${isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  {content.options[isCorrect ? correctIdx : selectedOption!]?.response}
                  {!isCorrect && (
                    <div className="mt-1 font-medium">
                      ✅ The right answer: {content.options[correctIdx].text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'closing' && (
            <div className="space-y-3">
              <p className="text-gray-700 text-base leading-relaxed">{content.closing}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">⭐</span>
                <div>
                  <div className="font-bold text-amber-800">+{lesson.skillReward} Skill earned!</div>
                  <div className="text-xs text-amber-600">Grandpa is proud of you.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          {!done && step !== 'closing' && (
            <button onClick={onClose} className="px-4 py-3 rounded-2xl text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Later
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={step === 'question' && !answered}
            className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-colors text-base"
          >
            {step === 'closing' ? '🎉 Done!' : step === 'question' && !answered ? 'Choose an answer' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
