'use client';
import { useState } from 'react';

export interface QuickChat {
  id: string;
  title: string;
  text: string;
  // Optional interactive question
  question?: string;
  options?: string[];          // answer choices
  correctIndex?: number;       // index of correct answer
  explanation?: string;        // shown after answering
  isStatement?: boolean;       // pure wisdom, no question
}

export const QUICK_CHATS: QuickChat[] = [
  {
    id: 'qc_mistakes',
    title: 'Learning From Mistakes',
    text: "When something goes wrong, don't just ask, 'Why did this happen?' Ask, 'What can I learn from this?'",
    isStatement: true,
  },
  {
    id: 'qc_interest',
    title: 'Interest While You Sleep',
    text: "Does money in your Savings keep earning interest even while you're sleeping?",
    question: "Does saving money earn interest while you sleep?",
    options: ['Yes', 'No'],
    correctIndex: 0,
    explanation: "Yes! Saved money can keep working even when you aren't.",
  },
  {
    id: 'qc_profit',
    title: 'Sales vs. Profit',
    text: "You sell lemonade for $3, but it costs $1 to make. Did you make $3 in profit?",
    question: "Did you make $3 in profit?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No. You still have to subtract what it cost you. $3 - $1 = $2 profit.",
  },
  {
    id: 'qc_time_value',
    title: 'Time Has Value',
    text: "Which is more valuable: $5 or one ⚡ Energy?",
    question: "Which is more valuable?",
    options: ['$5', '1 Energy', 'It depends'],
    correctIndex: 2,
    explanation: "It depends! Money and time can both be valuable. Sometimes saving energy is worth more than the extra dollars.",
  },
  {
    id: 'qc_change_plan',
    title: 'Change Your Plan',
    text: "If nobody is buying your lemonade, should you always keep doing the exact same thing?",
    question: "Should you keep doing the same thing?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No. Sometimes a good plan needs to change. Look around for what else you could try.",
  },
  {
    id: 'qc_saving',
    title: "Saving Isn't Never Spending",
    text: "Saving doesn't mean never buying anything. It means deciding what's worth spending your money on.",
    isStatement: true,
  },
  {
    id: 'qc_invest_later',
    title: 'Investing for Later',
    text: "If you spend money planting a lemon tree today so it gives you lemons later, are you only losing money?",
    question: "Are you only losing money?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No! Sometimes you give something up today to get something useful later. That's investing.",
  },
  {
    id: 'qc_buy_time',
    title: 'Buying Back Your Time',
    text: "If you hire someone to run your lemonade stand, you might make less money. What do you get back?",
    question: "What do you get back?",
    options: ['More lemons', 'Time', 'Nothing'],
    correctIndex: 1,
    explanation: "Time! And time lets you do something else — like fish, garden, or learn.",
  },
  {
    id: 'qc_cheap',
    title: "Cheapest Isn't Always Best",
    text: "Is the cheapest choice always the best choice?",
    question: "Is cheapest always best?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No. Sometimes spending a little more now can help you later — like a bike upgrade that wins races.",
  },
  {
    id: 'qc_rainy_opp',
    title: 'Rainy-Day Opportunity',
    text: "It's raining and nobody wants lemonade. Does that mean there's no way to earn money today?",
    question: "No way to earn on a rainy day?",
    options: ['Correct', 'No — look for another way'],
    correctIndex: 1,
    explanation: "When things change, look for a different opportunity. Bakery deliveries work great on rainy days!",
  },
  {
    id: 'qc_invest_yourself',
    title: 'Invest in Yourself',
    text: "Want to know one thing you can grow without planting a seed? Your Skill. Every time you learn something, you're investing in yourself.",
    isStatement: true,
  },
  {
    id: 'qc_money_energy',
    title: 'Money vs. Energy',
    text: "Would you rather earn $10 using three ⚡ or $8 using one ⚡?",
    question: "Which would you choose?",
    options: ['$10 (3 Energy)', '$8 (1 Energy)'],
    correctIndex: 1,
    explanation: "Either can be a good choice! Think about what you could do with the two extra Energy you save.",
  },
  {
    id: 'qc_mistakes2',
    title: 'Money Mistakes',
    text: "If you make a mistake with money, did you fail?",
    question: "Is a money mistake a failure?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No. A mistake can teach you how to make a better choice next time.",
  },
  {
    id: 'qc_not_everything',
    title: "Money Isn't Everything",
    text: "Can having more money make some things easier?",
    question: "Can more money make things easier?",
    options: ['Yes', 'No'],
    correctIndex: 0,
    explanation: "Yes! But friends, family, fun, and your time matter too. Money is a tool, not the goal.",
  },
  {
    id: 'qc_more_ways',
    title: 'More Than One Way to Earn',
    text: "If one way of earning money isn't working today, what could you do?",
    question: "What should you do?",
    options: ['Give up', 'Try another way'],
    correctIndex: 1,
    explanation: "Exactly. Having more than one way to earn can help when things change.",
  },
  {
    id: 'qc_needs_wants',
    title: 'Needs vs. Wants',
    text: "You need lemons for tomorrow's stand, but you want a new Treehouse decoration. Which should you think about first?",
    question: "Which comes first?",
    options: ['Lemons (need)', 'Decoration (want)'],
    correctIndex: 0,
    explanation: "Usually what you need comes first. Then you can decide what you want.",
  },
  {
    id: 'qc_patience',
    title: 'Patience',
    text: "A seed doesn't become a strawberry the day you plant it. Some good things are worth waiting for.",
    isStatement: true,
  },
  {
    id: 'qc_goal',
    title: 'Saving for a Goal',
    text: "If your Bike costs $80 and you only have $20, does that mean you can never get it?",
    question: "Can you never get it?",
    options: ['Yes, never', 'No — save a little at a time'],
    correctIndex: 1,
    explanation: "No! You can save a little at a time until you reach your goal. That's exactly what dream savings is for.",
  },
  {
    id: 'qc_price',
    title: 'Higher Price, Fewer Customers',
    text: "If you make your lemonade much more expensive, will everyone still want to buy it?",
    question: "Will everyone still buy?",
    options: ['Yes', 'Probably not'],
    correctIndex: 1,
    explanation: "Probably not. Price can change how many customers want something. There's a sweet spot!",
  },
  {
    id: 'qc_profit2',
    title: "More Customers Isn't Always More Profit",
    text: "Would selling lots of lemonade always mean you made lots of profit?",
    question: "Does more sales = more profit?",
    options: ['Always', 'Not always'],
    correctIndex: 1,
    explanation: "Not always. You have to know what it cost you too. That's the difference between revenue and profit.",
  },
  {
    id: 'qc_prepare',
    title: 'Prepare Before Trouble',
    text: "If you know rain might come tomorrow, is it better to think about it today or wait until you're already soaked?",
    question: "Plan ahead or wait?",
    options: ['Prepare today', 'Wait and see'],
    correctIndex: 0,
    explanation: "Planning ahead can give you more choices. That's why smart business owners think about tomorrow.",
  },
  {
    id: 'qc_spend_save',
    title: 'Spend or Save?',
    text: "You have $10 left after buying everything you need. Do you have to spend it?",
    question: "Do you have to spend it?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No. Keeping money for later is a choice too. That's what saving is.",
  },
  {
    id: 'qc_happiness',
    title: 'The Value of Happiness',
    text: "If playing with your puppy doesn't earn any money, is it a waste of Energy?",
    question: "Is it a waste?",
    options: ['Yes', 'No'],
    correctIndex: 1,
    explanation: "No. Not everything valuable makes money. Happiness matters too.",
  },
  {
    id: 'qc_helping',
    title: 'Helping Other People',
    text: "Sometimes helping a friend costs you time and gives you no money. Can it still be worth doing?",
    question: "Is it still worth it?",
    options: ['Yes', 'No'],
    correctIndex: 0,
    explanation: "Of course. Relationships are something worth building too.",
  },
  {
    id: 'qc_bigger_biz',
    title: "Grandpa's Bigger-Business Teaser",
    text: "What do you think happens when a business gets too big for one person to do everything?",
    question: "What do you do?",
    options: ['Work all day yourself', 'Ask people to help'],
    correctIndex: 1,
    explanation: "That's right. Learning how to work with other people is part of growing a business. That's what Stage 2 is all about...",
  },
];

interface Props {
  chat: QuickChat;
  onComplete: () => void; // called when player finishes the chat
}

export default function GrandpaChat({ chat, onComplete }: Props) {
  const [answered, setAnswered] = useState<number | null>(null);

  if (chat.isStatement || !chat.question || !chat.options) {
    // Pure wisdom statement — just show and close
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-4xl">👴</span>
          <div className="flex-1">
            <div className="font-bold text-amber-900 mb-1">{chat.title}</div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-none p-3">
              <p className="text-sm text-amber-800 italic leading-relaxed">"{chat.text}"</p>
            </div>
          </div>
        </div>
        <div className="text-xs text-center text-indigo-500 font-medium">+1 Skill earned ⭐</div>
        <button onClick={onComplete}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors">
          Thanks, Grandpa! 👴
        </button>
      </div>
    );
  }

  const isCorrect = answered === chat.correctIndex;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-4xl">👴</span>
        <div className="flex-1">
          <div className="font-bold text-amber-900 mb-1">{chat.title}</div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-none p-3">
            <p className="text-sm text-amber-800 italic leading-relaxed">"{chat.text}"</p>
          </div>
        </div>
      </div>

      {answered === null ? (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 text-center">{chat.question}</div>
          {chat.options.map((opt, i) => (
            <button key={i} onClick={() => setAnswered(i)}
              className="w-full py-2.5 px-4 bg-white border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl text-sm font-medium text-gray-700 transition-all text-left">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-2xl p-3 text-center ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
            <div className="text-xl mb-1">{isCorrect ? '🎉' : '💡'}</div>
            <div className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
              {isCorrect ? 'That\'s right!' : 'Good try!'}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{chat.explanation}</p>
          </div>
          <div className="text-xs text-center text-indigo-500 font-medium">+1 Skill earned ⭐</div>
          <button onClick={onComplete}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors">
            Got it, Grandpa! 👴
          </button>
        </div>
      )}
    </div>
  );
}
