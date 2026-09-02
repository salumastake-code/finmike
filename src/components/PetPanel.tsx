'use client';
import { useState } from 'react';
import type { PlayerSave } from '@/types/game';

export const READOPT_COST = 40; // cost to adopt a new puppy after previous one ran away

interface Props {
  save: PlayerSave;
  onFeed: () => void;
  onPlay: () => void;
  onNamePet: (name: string) => void;
  onReadopt: (name: string) => void;
}

export default function PetPanel({ save, onFeed, onPlay, onNamePet, onReadopt }: Props) {
  const [nameInput, setNameInput] = useState('');
  const pet = save.pet;
  const tokensLeft = save.tokens.total - save.tokens.spent;

  // Pet tab is visible (worldUnlocks.pet = true) but no pet object — two cases:
  // 1. First time visiting (name your pet)
  // 2. Pet ran away — offer re-adoption
  if (!pet) {
    // Check if this is a re-adoption (pet unlock exists but pet is gone)
    // We detect this by whether the player has previously had a pet — we use
    // a simple heuristic: if coins > 0 and dayNumber > 1 it's likely a runaway
    // since on day 1 you wouldn't have unlocked pet yet.
    // The safe signal is: worldUnlocks.pet is true but pet is undefined and dayNumber > 3
    const isRunaway = save.dayNumber > 3;

    if (isRunaway) {
      // Re-adoption screen
      const canAfford = save.coins >= READOPT_COST;
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-2">😢</div>
            <h3 className="font-bold text-gray-800 text-lg">Your puppy ran away...</h3>
            <p className="text-sm text-gray-500 mt-1">They needed more care than they got. It happens — what matters is what you do next.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">👴</span>
              <p className="text-sm text-amber-800 italic leading-relaxed">
                "Don't be too hard on yourself. Taking care of another living thing is a big responsibility.
                If you want to try again, I know someone with puppies looking for a good home. It'll cost ${READOPT_COST} — and this time, you'll know what they need."
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500">Name your new puppy:</div>
            <input
              type="text"
              maxLength={12}
              placeholder="Enter a name…"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={() => { if (nameInput.trim()) onReadopt(nameInput.trim()); }}
            disabled={!nameInput.trim() || !canAfford}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-base transition-colors"
          >
            {canAfford ? `Adopt a new puppy — $${READOPT_COST} 🐾` : `Need $${READOPT_COST} to adopt (you have $${save.coins})`}
          </button>
        </div>
      );
    }

    // First-time naming
    return (
      <div className="space-y-4 text-center">
        <div className="text-6xl">🐶</div>
        <h3 className="font-bold text-gray-800 text-lg">Your Puppy is here!</h3>
        <p className="text-sm text-gray-500">Give your new friend a name.</p>
        <input
          type="text"
          maxLength={12}
          placeholder="Enter a name…"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:border-amber-400"
          onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) onNamePet(nameInput.trim()); }}
        />
        <button
          onClick={() => { if (nameInput.trim()) onNamePet(nameInput.trim()); }}
          disabled={!nameInput.trim()}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-base transition-colors"
        >
          That's my dog! 🐾
        </button>
      </div>
    );
  }

  const happinessColor = pet.happiness >= 70 ? 'bg-green-400' : pet.happiness >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  const moodEmoji = pet.happiness >= 70 ? '😄' : pet.happiness >= 40 ? '😐' : '😢';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-6xl mb-1">🐶</div>
        <div className="font-bold text-gray-800 text-lg">{pet.name}</div>
        <div className="text-xs text-gray-400">Your loyal friend</div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-gray-500">Happiness {moodEmoji}</span>
          <span className="text-xs text-gray-400">{pet.happiness}/100</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div className={`${happinessColor} h-3 rounded-full transition-all`} style={{ width: `${pet.happiness}%` }} />
        </div>
        {pet.daysNeglected >= 2 && (
          <div className="text-xs text-red-500 mt-1">😢 {pet.name} misses you! Feed and play today or they might run away.</div>
        )}
      </div>

      <div className="flex gap-2">
        <div className={`flex-1 rounded-xl p-2 text-center text-xs font-bold border-2 ${pet.fed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
          {pet.fed ? '✅ Fed' : '🍖 Hungry'}
        </div>
        <div className={`flex-1 rounded-xl p-2 text-center text-xs font-bold border-2 ${pet.played ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
          {pet.played ? '✅ Played' : '🎾 Bored'}
        </div>
      </div>

      <button onClick={onFeed} disabled={pet.fed || tokensLeft < 1 || save.coins < 2}
        className="w-full flex items-center gap-3 p-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🍖</span>
        <div className="flex-1 text-left text-sm">Feed {pet.name}
          <div className="text-xs opacity-80 font-normal">{pet.fed ? 'Already fed today!' : 'Costs $2 · +20 happiness'}</div>
        </div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
      </button>

      <button onClick={onPlay} disabled={pet.played || tokensLeft < 1}
        className="w-full flex items-center gap-3 p-3 bg-pink-400 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
        <span className="text-xl">🎾</span>
        <div className="flex-1 text-left text-sm">Play with {pet.name}
          <div className="text-xs opacity-80 font-normal">{pet.played ? 'Already played today!' : 'Free · +25 happiness'}</div>
        </div>
        <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
      </button>

      <div className="text-xs text-center text-gray-400">
        💡 Feed and play every day to keep {pet.name} happy!
      </div>
    </div>
  );
}
