'use client';
import type { PlayerSave } from '@/types/game';
import { TOWN_PARK_GOAL, PARK_ADDITIONS } from '@/lib/stage2';

interface Props {
  save: PlayerSave;
  onContribute: (amount: number) => void;
  onAddAddition: (id: string) => void;
}

export default function TownParkPanel({ save, onContribute, onAddAddition }: Props) {
  const park = save.townPark;
  const tokensLeft = save.tokens.total - save.tokens.spent;

  if (!park) return <div className="text-center py-8 text-gray-400">Town Park not started yet.</div>;

  const progressPct = Math.min(100, Math.round((park.fundsSaved / TOWN_PARK_GOAL) * 100));
  const buildPct = park.buildProgress;

  if (park.built) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-5xl mb-2">🌳🏀🌸</div>
          <div className="font-black text-green-700 text-lg">Town Park — Built!</div>
          <div className="text-xs text-green-500">The whole town loves it. Your reputation grew!</div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 space-y-2">
          <div className="text-xs font-bold text-green-700 uppercase tracking-wide">Add to the Park</div>
          {PARK_ADDITIONS.map(addition => {
            const owned = park.additions.includes(addition.id);
            return (
              <div key={addition.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${owned ? 'border-green-300 bg-green-100' : 'border-gray-200 bg-white'}`}>
                <span className="text-2xl">{addition.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-800">{addition.name}</div>
                  <div className="text-xs text-gray-500">{addition.desc}</div>
                </div>
                {owned ? (
                  <span className="text-green-500 text-lg">✅</span>
                ) : (
                  <button onClick={() => onAddAddition(addition.id)}
                    disabled={save.coins < addition.cost}
                    className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-xl">
                    ${addition.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {park.unlockedOpportunities.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-xs font-bold text-amber-700 mb-1">🎉 Opportunities Unlocked</div>
            {park.unlockedOpportunities.map(opp => (
              <div key={opp} className="text-xs text-amber-600">✨ {opp.replace(/_/g, ' ')}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🌳</span>
        <div>
          <div className="font-bold text-gray-800">Build the Town Park</div>
          <div className="text-xs text-gray-400">A big project — it'll take time and money</div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <span className="text-2xl">👴</span>
        <p className="text-xs text-amber-800 italic leading-relaxed">
          "This won't make you money directly — but it'll grow your reputation, your relationships,
          and your place in this town. Sometimes the best investments aren't about dollars."
        </p>
      </div>

      {/* Funds progress */}
      <div className="bg-white border-2 border-green-200 rounded-2xl p-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-bold text-green-700">Funds Raised</span>
          <span className="text-gray-500">${park.fundsSaved} / ${TOWN_PARK_GOAL}</span>
        </div>
        <div className="bg-green-100 rounded-full h-3 mb-1">
          <div className="bg-green-400 h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-xs text-gray-400">{progressPct}% funded</div>
      </div>

      {/* Build progress */}
      <div className="bg-white border-2 border-amber-200 rounded-2xl p-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-bold text-amber-700">Build Progress</span>
          <span className="text-gray-500">{buildPct}%</span>
        </div>
        <div className="bg-amber-100 rounded-full h-3 mb-1">
          <div className="bg-amber-400 h-3 rounded-full transition-all" style={{ width: `${buildPct}%` }} />
        </div>
        <div className="text-xs text-gray-400">Work on it each day — each contribution adds 5%</div>
      </div>

      {/* Contribute */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-gray-500">Contribute funds + work today:</div>
        {[25, 50, 100].map(amt => (
          <button key={amt} onClick={() => onContribute(amt)}
            disabled={save.coins < amt || tokensLeft < 1}
            className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
            <span className="text-xl">🌳</span>
            <div className="flex-1 text-left text-sm">Contribute ${amt}
              <div className="text-xs opacity-80 font-normal">+5% build progress · +1 reputation</div>
            </div>
            <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-center text-gray-400">
        You need to both fund AND build — delegate your other businesses while you work on this!
      </div>
    </div>
  );
}
