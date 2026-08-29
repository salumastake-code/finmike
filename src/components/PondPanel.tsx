'use client';
import { useState, useEffect, useRef } from 'react';
import type { PlayerSave } from '@/types/game';
import { COLLECTIBLES, ALL_COLLECTIBLES, FISH } from '@/lib/pond';
import type { FishingResult } from '@/lib/pond';

interface Props {
  save: PlayerSave;
  onFish: (successRate: number) => FishingResult | { error: string };
}

// ---- Fishing Mini-Game ----
function FishingMiniGame({ onResult }: { onResult: (successRate: number) => void }) {
  const [phase, setPhase] = useState<'cast' | 'wait' | 'bite' | 'done'>('cast');
  const [waitMs, setWaitMs] = useState(0);
  const [biteTime, setBiteTime] = useState(0); // ms until fish bites
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const biteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);

  function handleCast() {
    setPhase('wait');
    const delay = 1500 + Math.random() * 3000; // 1.5–4.5s until bite
    setBiteTime(delay);
    biteRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase('bite');
      // Auto-miss after 1s
      biteRef.current = setTimeout(() => {
        setPhase('done');
        onResult(0); // missed = 0 success rate
      }, 1000);
    }, delay);
  }

  function handleReel() {
    if (phase === 'bite') {
      if (biteRef.current) clearTimeout(biteRef.current);
      const reaction = Date.now() - startRef.current;
      setReactionMs(reaction);
      setPhase('done');
      // Perfect = <200ms, Good = <500ms, Okay = <800ms, Miss = >800ms
      const successRate = reaction < 200 ? 1.0 : reaction < 500 ? 0.75 : reaction < 800 ? 0.4 : 0.1;
      setTimeout(() => onResult(successRate), 400);
    }
  }

  return (
    <div className="space-y-4 text-center">
      {phase === 'cast' && (
        <>
          <div className="text-5xl">🎣</div>
          <p className="text-sm text-gray-600">Cast your line and wait for a bite!</p>
          <button onClick={handleCast}
            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-black text-lg rounded-2xl transition-colors">
            🎣 Cast Line!
          </button>
        </>
      )}

      {phase === 'wait' && (
        <>
          <div className="text-5xl animate-bounce">🎣</div>
          <p className="text-sm text-gray-500 animate-pulse">Waiting for a fish...</p>
          <div className="text-xs text-gray-400">Don't tap yet — wait for the splash!</div>
        </>
      )}

      {phase === 'bite' && (
        <>
          <div className="text-5xl animate-ping">💦</div>
          <p className="text-lg font-black text-teal-600 animate-pulse">BITE! TAP NOW!</p>
          <button onClick={handleReel}
            className="w-full py-5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-black text-2xl rounded-2xl shadow-lg transition-transform">
            🎣 REEL IN!
          </button>
        </>
      )}

      {phase === 'done' && (
        <>
          <div className="text-5xl">🌊</div>
          <p className="text-sm text-gray-500">
            {reactionMs !== null
              ? reactionMs < 200 ? 'Perfect timing! ⚡'
              : reactionMs < 500 ? 'Great catch!'
              : reactionMs < 800 ? 'Just barely!'
              : 'Too slow...'
              : 'The fish got away!'}
          </p>
          <div className="text-xs text-gray-400 animate-pulse">See what you caught...</div>
        </>
      )}
    </div>
  );
}

// ---- Main PondPanel ----
export default function PondPanel({ save, onFish }: Props) {
  const [showFishing, setShowFishing] = useState(false);
  const [lastResult, setLastResult] = useState<FishingResult | null>(null);
  const pond = save.pond;
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const collectiblesFound = pond?.collectibles ?? [];
  const allFound = ALL_COLLECTIBLES.every(c => collectiblesFound.includes(c));
  const grandpaQuestDone = allFound; // finding all 5 unlocks second stand

  function handleFishResult(successRate: number) {
    setShowFishing(false);
    const result = onFish(successRate);
    if ('error' in result) return;
    setLastResult(result as FishingResult);
  }

  if (!pond) return (
    <div className="text-center py-6 text-gray-400 text-sm">
      <div className="text-4xl mb-2">🎣</div>
      Ride your bike to the pond to unlock fishing!
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">🏞️</span>
        <div>
          <div className="font-bold text-gray-800">The Pond</div>
          <div className="text-xs text-gray-400">
            {pond.totalFishCaught} fish caught · {collectiblesFound.length}/5 collectibles found
          </div>
        </div>
      </div>

      {/* Grandpa's quest */}
      <div className={`p-3 rounded-2xl border-2 ${grandpaQuestDone ? 'border-green-300 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">👴</span>
          <div>
            <div className="text-sm font-bold text-amber-900">Grandpa's Collection Quest</div>
            <div className="text-xs text-amber-600">
              {grandpaQuestDone
                ? "You found everything! Talk to Grandpa to claim your reward."
                : `Find all 5 special items → Grandpa rewards you with a second lemonade stand!`}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_COLLECTIBLES.map(id => {
            const found = collectiblesFound.includes(id);
            const info = COLLECTIBLES[id];
            return (
              <div key={id} title={found ? `${info.name}: ${info.desc}` : '???'}
                className={`flex flex-col items-center px-2 py-1.5 rounded-xl border text-center ${found ? 'bg-white border-amber-300' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
                <span className="text-xl">{found ? info.emoji : '❓'}</span>
                <span className="text-xs text-gray-500 mt-0.5">{found ? info.name.split(' ')[0] : '???'}</span>
              </div>
            );
          })}
        </div>
        {grandpaQuestDone && (
          <div className="mt-2 text-xs font-bold text-green-700 text-center">
            🎉 All 5 found! Visit Grandpa to unlock your second stand!
          </div>
        )}
      </div>

      {/* Last fishing result */}
      {lastResult && (
        <div className={`p-3 rounded-2xl border-2 text-center ${lastResult.caught ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
          {lastResult.caught ? (
            <>
              <div className="text-3xl">{lastResult.fishEmoji}</div>
              <div className="font-bold text-teal-800">{lastResult.fishName} caught!</div>
              <div className="text-xs text-teal-600">+${lastResult.fishValue} 💵</div>
            </>
          ) : (
            <>
              <div className="text-3xl">🌊</div>
              <div className="text-sm text-gray-500">The fish got away this time.</div>
            </>
          )}
          {lastResult.collectibleFound && (
            <div className="mt-2 text-sm font-bold text-amber-700">
              🎉 Found: {COLLECTIBLES[lastResult.collectibleFound].emoji} {COLLECTIBLES[lastResult.collectibleFound].name}!
            </div>
          )}
          <button onClick={() => setLastResult(null)} className="mt-2 text-xs text-gray-400">Dismiss</button>
        </div>
      )}

      {/* Fishing button */}
      {showFishing ? (
        <div className="bg-white border-2 border-teal-200 rounded-2xl p-5">
          <FishingMiniGame onResult={handleFishResult} />
        </div>
      ) : (
        <button onClick={() => setShowFishing(true)}
          disabled={tokensLeft < 1}
          className="w-full flex items-center gap-3 p-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-colors">
          <span className="text-2xl">🎣</span>
          <div className="flex-1 text-left">
            Go Fishing
            <div className="text-xs opacity-80 font-normal">Tap when the fish bites! · chance to find collectibles</div>
          </div>
          <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
        </button>
      )}

      {/* Fish guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🐟 Fish Guide</div>
        <div className="grid grid-cols-2 gap-1.5">
          {FISH.map(f => (
            <div key={f.id} className="flex items-center gap-2 text-xs">
              <span className="text-base">{f.emoji}</span>
              <span className="text-gray-600">{f.name}</span>
              <span className="ml-auto font-bold text-green-600">${f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
