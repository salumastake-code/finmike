'use client';
import type { PlayerSave } from '@/types/game';
import { DOG_WALK_EARNINGS, DOG_WALK_MISHAP_INTERVAL } from '@/lib/stage2';

interface Props {
  save: PlayerSave;
  onWalk: (dogs: 1 | 2) => void;
  onUnlock: () => void;
}

export default function DogWalkingPanel({ save, onWalk, onUnlock }: Props) {
  const dw = save.dogWalking;
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const walkerEmployee = (save.employees ?? []).find(e => e.assignment === 'dog_walking');

  if (!dw) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="text-5xl">🐕</div>
        <div className="font-black text-gray-800 text-lg">Start Dog Walking!</div>
        <p className="text-sm text-gray-500 leading-relaxed px-2">
          Low startup cost, earns fast. Walk dogs around the neighborhood and build your reputation!
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left flex items-start gap-2">
          <span className="text-xl">👴</span>
          <p className="text-xs text-amber-800 italic leading-relaxed">
            "Great starter business — almost no cost! But it takes a lot of your time.
            Once you hire a dog walker, they can do the walks while you focus on bigger things."
          </p>
        </div>
        <button onClick={onUnlock}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-black text-lg rounded-2xl transition-colors shadow-lg">
          Start Walking Dogs! 🐕
        </button>
      </div>
    );
  }

  const walksUntilMishap = DOG_WALK_MISHAP_INTERVAL - (dw.totalWalks % DOG_WALK_MISHAP_INTERVAL);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🐕</span>
        <div>
          <div className="font-bold text-gray-800">Dog Walking</div>
          <div className="text-xs text-gray-400">{dw.totalWalks} total walks · {dw.walksToday}/3 today</div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <span className="text-2xl">👴</span>
        <p className="text-xs text-amber-800 italic leading-relaxed">
          "Great starter business — almost no cost! But it takes a lot of your time.
          Once you hire a dog walker, they can do the walks while you focus on bigger things."
        </p>
      </div>

      {/* Walk options */}
      {!walkerEmployee && (
        <div className="space-y-2">
          {DOG_WALK_EARNINGS.map(opt => (
            <button key={opt.dogs} onClick={() => onWalk(opt.dogs as 1 | 2)}
              disabled={tokensLeft < opt.energyCost || dw.walksToday >= 3}
              className="w-full flex items-center gap-3 p-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
              <span className="text-2xl">{opt.dogs === 1 ? '🐕' : '🐕🐕'}</span>
              <div className="flex-1 text-left text-sm">
                {opt.label}
                <div className="text-xs opacity-80 font-normal">Earn ${opt.earnings} · good for reputation too</div>
              </div>
              <span className="text-xs bg-black/20 rounded-lg px-2 py-1">{opt.energyCost}⚡</span>
            </button>
          ))}
          {dw.walksToday >= 3 && (
            <div className="text-xs text-center text-gray-400">That's enough walks for today!</div>
          )}
        </div>
      )}

      {/* Employee walker */}
      {walkerEmployee && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">🐕</div>
          <div className="font-bold text-green-800">{walkerEmployee.name} is walking dogs today!</div>
          <div className="text-xs text-green-600 mt-1">2 dogs · earning for you while you do other things</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <div className="font-black text-xl text-teal-600">{dw.totalWalks}</div>
          <div className="text-xs text-gray-400">Total Walks</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <div className="font-black text-xl text-orange-400">{dw.mishapCount}</div>
          <div className="text-xs text-gray-400">Mishaps 🐾</div>
        </div>
      </div>

      <div className="text-xs text-center text-gray-400 bg-orange-50 border border-orange-200 rounded-xl p-2">
        ⚠️ Every ~{DOG_WALK_MISHAP_INTERVAL} walks there's a chance of a mishap (dog off leash!) — costs reputation.
        <br/>Next potential mishap in ~{walksUntilMishap} walk{walksUntilMishap !== 1 ? 's' : ''}.
      </div>

      {!walkerEmployee && (
        <div className="text-xs text-center text-gray-400">
          💡 Hire an employee and assign them to Dog Walking to earn without spending your energy
        </div>
      )}
    </div>
  );
}
