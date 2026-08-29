'use client';
import { useState } from 'react';
import type { PlayerSave, GrandpaLesson } from '@/types/game';
import GrandpaLessonModal from './GrandpaLesson';
import { getMood } from '@/lib/economy';

interface Props {
  save: PlayerSave;
  onLearnLesson: (lessonId: string, skillGained: number) => void;
  onSimpleLearn: () => void; // costs 1 energy, gives +1 skill
  onClose: () => void;
}

export default function GrandpaPanel({ save, onLearnLesson, onSimpleLearn, onClose }: Props) {
  const [activeLesson, setActiveLesson] = useState<GrandpaLesson | null>(null);
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const availableLessons = (save.grandpaLessons ?? []).filter(l => !l.completed);
  const completedLessons = (save.grandpaLessons ?? []).filter(l => l.completed);
  const mood = getMood(save.lifeMeters.happiness);

  const greetings = [
    `Ah, ${save.playerName}! Come sit with me a while.`,
    `There you are! I was just thinking about you.`,
    `Pull up a chair, ${save.playerName}. I've got something to share.`,
    `Good to see you. What shall we talk about today?`,
  ];
  const greeting = greetings[save.dayNumber % greetings.length];

  if (activeLesson) {
    return (
      <GrandpaLessonModal
        lesson={activeLesson}
        playerName={save.playerName}
        onComplete={(id, skill) => {
          setActiveLesson(null);
          onLearnLesson(id, skill);
        }}
        onClose={() => setActiveLesson(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Grandpa greeting */}
      <div className="flex items-start gap-3">
        <span className="text-5xl">👴</span>
        <div className="flex-1">
          <div className="font-bold text-gray-800">Grandpa</div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-none p-3 mt-1">
            <p className="text-sm text-amber-900 italic leading-relaxed">"{greeting}"</p>
          </div>
        </div>
      </div>

      {/* Skill meter */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">⭐ Your Skill</div>
          <div className="text-sm font-black text-indigo-700">{save.skill ?? 0} / 100</div>
        </div>
        <div className="w-full bg-indigo-100 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(100, save.skill ?? 0)}%` }}
          />
        </div>
        {(save.skill ?? 0) < 25 && (
          <div className="text-xs text-indigo-400 mt-1.5">25 Skill unlocks Baking in the next stage</div>
        )}
        {(save.skill ?? 0) >= 25 && (
          <div className="text-xs text-green-600 font-bold mt-1.5">✅ Baking unlocked for Stage 2!</div>
        )}
      </div>

      {/* Named lessons */}
      {availableLessons.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">📚 Lessons</div>
          {availableLessons.map(lesson => (
            <button
              key={lesson.id}
              onClick={() => {
                if (tokensLeft < 1) return;
                setActiveLesson(lesson);
              }}
              disabled={tokensLeft < 1}
              className="w-full flex items-center gap-3 p-3.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-amber-200 hover:border-amber-300 rounded-2xl transition-all text-left"
            >
              <span className="text-2xl">📖</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-900">{lesson.title}</div>
                <div className="text-xs text-amber-600">2–3 min · earn +{lesson.skillReward} Skill</div>
              </div>
              <span className="text-xs bg-amber-200 text-amber-700 rounded-xl px-2 py-1 font-bold">1⚡</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick learn (+1 skill) */}
      <button
        onClick={onSimpleLearn}
        disabled={tokensLeft < 1}
        className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-gray-200 rounded-2xl transition-all"
      >
        <span className="text-2xl">💬</span>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold text-gray-700">Chat with Grandpa</div>
          <div className="text-xs text-gray-400">Quick advice · earn +1 Skill</div>
        </div>
        <span className="text-xs bg-gray-200 text-gray-600 rounded-xl px-2 py-1 font-bold">1⚡</span>
      </button>

      {/* Completed lessons */}
      {completedLessons.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">✅ Completed</div>
          {completedLessons.map(lesson => (
            <div key={lesson.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <span className="text-sm">📖</span>
              <span className="text-xs text-gray-400 line-through">{lesson.title}</span>
              <span className="ml-auto text-xs text-green-500 font-bold">+{lesson.skillReward} ⭐</span>
            </div>
          ))}
        </div>
      )}

      {availableLessons.length === 0 && (
        <div className="text-center py-3 bg-green-50 border border-green-200 rounded-2xl">
          <div className="text-2xl mb-1">🎓</div>
          <div className="text-sm font-bold text-green-700">All lessons complete!</div>
          <div className="text-xs text-green-500">You can still chat with Grandpa for +1 Skill</div>
        </div>
      )}

      {/* Second stand quest nudge */}
      {!save.secondStand && save.pond && save.pond.collectibles.length === 5 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="text-sm font-bold text-green-800">You found everything!</div>
            <p className="text-xs text-green-700 mt-0.5">
              "I can't believe you found all five! Head to the Stand #2 tab to claim your reward — I'll help you open that second stand!"
            </p>
          </div>
        </div>
      )}

      {/* Current mood note */}
      {save.lifeMeters.happiness < 45 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">{mood.emoji}</span>
          <p className="text-xs text-amber-800 italic leading-relaxed">
            "You seem a little {mood.label.toLowerCase()} today, {save.playerName}. Make sure you're making time for things you enjoy — not just work."
          </p>
        </div>
      )}
    </div>
  );
}
