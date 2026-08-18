'use client';
import { useState } from 'react';
import type { PlayerSave } from '@/types/game';

const ADDONS = [
  { id: 'telescope', name: 'Telescope',    emoji: '🔭', cost: 15, desc: 'Spot rare butterflies from above. Unlocks butterfly catching!' },
  { id: 'rope_swing', name: 'Rope Swing',  emoji: '🪢', cost: 20, desc: 'Best thing ever. Adds +5 happiness every day you visit.' },
  { id: 'hammock',   name: 'Hammock',      emoji: '🌙', desc: 'Perfect for an afternoon nap. Sleep here to regain 1 energy.', cost: 25 },
  { id: 'flag',      name: 'Flag',         emoji: '🚩', cost: 10, desc: 'Mark your territory. Shows your name on the world map.' },
  { id: 'lantern',   name: 'Lantern',      emoji: '🏮', cost: 10, desc: 'Now you can visit even on rainy evenings.' },
];

const BUTTERFLIES = [
  { id: 'blue',   name: 'Blue Morpho',       emoji: '🦋', weight: 60 },
  { id: 'yellow', name: 'Yellow Swallowtail', emoji: '🌼', weight: 55 },
  { id: 'purple', name: 'Purple Emperor',     emoji: '💜', weight: 25 },
  { id: 'golden', name: 'Golden Wing',        emoji: '✨', weight: 8  },
];

interface Props {
  save: PlayerSave;
  onVisit: () => void;
  onCatch: () => void;
  onBuyAddon?: (addonId: string, cost: number) => void;
}

export default function TreehousePanel({ save, onVisit, onCatch, onBuyAddon }: Props) {
  const treehouse = save.treehouse;
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const [tab, setTab] = useState<'addons' | 'butterflies'>('addons');

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
              "A treehouse! I had one when I was your age. You can add all sorts of things up there — a telescope, a rope swing... Go explore!"
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

  const ownedAddons = treehouse.decorations ?? [];
  const hasTelesope = ownedAddons.includes('telescope');
  const collected = treehouse.butterflies ?? [];
  const uncaught = BUTTERFLIES.filter(b => !collected.includes(b.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌳</span>
        <div>
          <div className="font-bold text-gray-800">Your Treehouse</div>
          <div className="text-xs text-gray-400">
            {ownedAddons.length === 0 ? 'Empty up here — add something!' : `${ownedAddons.length} add-on${ownedAddons.length > 1 ? 's' : ''} installed`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['addons', 'butterflies'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${tab === t ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {t === 'addons' ? '🪴 Add-Ons' : '🦋 Butterflies'}
          </button>
        ))}
      </div>

      {tab === 'addons' && (
        <div className="space-y-2">
          {ADDONS.map(addon => {
            const owned = ownedAddons.includes(addon.id);
            return (
              <div key={addon.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 ${owned ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="text-2xl">{addon.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-700">{addon.name}</div>
                  <div className="text-xs text-gray-500 leading-snug">{addon.desc}</div>
                </div>
                {owned ? (
                  <span className="text-green-500 text-lg flex-shrink-0">✅</span>
                ) : (
                  <button
                    onClick={() => onBuyAddon?.(addon.id, addon.cost)}
                    disabled={save.coins < addon.cost}
                    className="flex-shrink-0 text-xs bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white font-bold px-2 py-1.5 rounded-xl"
                  >
                    ${addon.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'butterflies' && (
        <div className="space-y-3">
          {!hasTelesope && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-xs text-amber-700">
              🔭 Buy the <strong>Telescope</strong> add-on to start catching butterflies!
            </div>
          )}

          {/* Collection grid */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">
              🦋 Collection ({collected.length}/{BUTTERFLIES.length})
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BUTTERFLIES.map(b => {
                const found = collected.includes(b.id);
                return (
                  <div key={b.id}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 text-center p-1 ${
                      found ? 'bg-white border-purple-200' : 'bg-gray-100 border-gray-200 opacity-40'
                    }`}>
                    <div className="text-2xl">{found ? b.emoji : '❓'}</div>
                    <div className="text-xs text-gray-500 leading-tight mt-0.5">{found ? b.name.split(' ')[0] : '???'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasTelesope && uncaught.length > 0 && (
            <button onClick={onCatch} disabled={tokensLeft < 1}
              className="w-full flex items-center gap-3 p-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl font-bold transition-colors">
              <span className="text-xl">🔭</span>
              <div className="flex-1 text-left text-sm">Look for Butterflies
                <div className="text-xs opacity-80 font-normal">{uncaught.length} left to find · chance to catch one</div>
              </div>
              <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
            </button>
          )}

          {collected.length === BUTTERFLIES.length && (
            <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold text-yellow-700 text-sm">Collection Complete!</div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-center text-gray-400">
        💡 Visit your treehouse every day for surprises!
      </div>
    </div>
  );
}
