'use client';
import type { PlayerSave } from '@/types/game';

const BUTTERFLIES = [
  { id: 'blue',    name: 'Blue Morpho',    emoji: '🦋', rarity: 'common'   },
  { id: 'yellow',  name: 'Yellow Swallowtail', emoji: '🌼', rarity: 'common' },
  { id: 'purple',  name: 'Purple Emperor', emoji: '💜', rarity: 'rare'     },
  { id: 'golden',  name: 'Golden Wing',    emoji: '✨', rarity: 'legendary' },
];

interface Props {
  save: PlayerSave;
  onVisit: () => void;
  onCatch: () => void;
}

export default function TreehousePanel({ save, onVisit, onCatch }: Props) {
  const treehouse = save.treehouse;
  const tokensLeft = save.tokens.total - save.tokens.spent;

  if (!treehouse || !treehouse.visited) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-6xl mb-2">🌳</div>
          <h3 className="font-bold text-gray-800 text-lg">Your Treehouse!</h3>
          <p className="text-sm text-gray-500 mb-4">You built it! Time to explore what's up there.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">👴</span>
            <p className="text-sm text-amber-800 italic">
              "A treehouse! I had one when I was your age. You never know what you'll find up there — 
              rare butterflies, secret spots... Go explore!"
            </p>
          </div>
        </div>
        <button onClick={onVisit} disabled={tokensLeft < 1}
          className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-black rounded-2xl text-lg transition-colors">
          🌳 Climb Up! (1⚡)
        </button>
      </div>
    );
  }

  const collected = treehouse.butterflies;
  const uncollected = BUTTERFLIES.filter(b => !collected.includes(b.id));
  const canCatch = uncollected.length > 0 && tokensLeft >= 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌳</span>
        <div>
          <div className="font-bold text-gray-800">Treehouse</div>
          <div className="text-xs text-gray-400">Your secret spot in the sky</div>
        </div>
      </div>

      {/* Butterfly collection */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
        <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">
          🦋 Butterfly Collection ({collected.length}/{BUTTERFLIES.length})
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BUTTERFLIES.map(b => {
            const found = collected.includes(b.id);
            return (
              <div key={b.id}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 text-center p-1 ${
                  found
                    ? 'bg-white border-purple-200'
                    : 'bg-gray-100 border-gray-200 opacity-40'
                }`}>
                <div className="text-2xl">{found ? b.emoji : '❓'}</div>
                <div className="text-xs text-gray-500 leading-tight mt-0.5">{found ? b.name.split(' ')[0] : '???'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catch a butterfly */}
      {uncollected.length > 0 && (
        <button onClick={onCatch} disabled={!canCatch}
          className="w-full flex items-center gap-3 p-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl font-bold transition-colors">
          <span className="text-xl">🦋</span>
          <div className="flex-1 text-left text-sm">Look for Butterflies
            <div className="text-xs opacity-80 font-normal">{uncollected.length} left to find · chance to catch one</div>
          </div>
          <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
        </button>
      )}

      {uncollected.length === 0 && (
        <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-yellow-700 text-sm">Collection Complete!</div>
          <div className="text-xs text-yellow-500">You found all 4 butterflies!</div>
        </div>
      )}

      {/* Decorations */}
      {treehouse.decorations.length > 0 && (
        <div className="text-xs text-gray-400 text-center">
          Decorations: {treehouse.decorations.join(' ')}
        </div>
      )}

      <div className="text-xs text-center text-gray-400">
        💡 Come back each day — different butterflies appear in different weather!
      </div>
    </div>
  );
}
