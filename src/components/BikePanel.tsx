'use client';
import { useState, useEffect, useRef } from 'react';
import type { PlayerSave } from '@/types/game';
import { BIKE_UPGRADES, RACE_INTERVAL_DAYS, DELIVERY_PAYMENT } from '@/lib/bike';
import type { RaceResult } from '@/lib/bike';

interface Props {
  save: PlayerSave;
  onDelivery: () => void;
  onRace: (miniGameScore: number) => RaceResult | { error: string };
  onBuyUpgrade: (upgradeId: string) => void;
  onGoToPond: () => void;
}

type Tab = 'ride' | 'upgrades' | 'record';

// ---- Race mini-game component ----
function RaceMiniGame({ onResult }: { onResult: (won: boolean, place: 1|2|3, prize: number, miniGameScore: number) => void; }) {
  const [phase, setPhase] = useState<'countdown' | 'race' | 'done'>('countdown');
  const [count, setCount] = useState(3);
  // Moving target bar
  const [barPos, setBarPos] = useState(50); // 0–100
  const [direction, setDirection] = useState(1);
  const [taps, setTaps] = useState<number[]>([]); // tap accuracy scores 0–1
  const [tapFlash, setTapFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TAPS_NEEDED = 5;
  const speed = 1.8; // bar movement speed

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) { setPhase('race'); return; }
    const t = setTimeout(() => setCount(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [count, phase]);

  // Bar movement
  useEffect(() => {
    if (phase !== 'race') return;
    intervalRef.current = setInterval(() => {
      setBarPos(pos => {
        const next = pos + direction * speed;
        if (next >= 100) { setDirection(-1); return 100; }
        if (next <= 0) { setDirection(1); return 0; }
        return next;
      });
    }, 30);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, direction]);

  function handleTap() {
    if (phase !== 'race') return;
    // Score based on proximity to center (50)
    const accuracy = 1 - Math.abs(barPos - 50) / 50;
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 150);
    const newTaps = [...taps, accuracy];
    setTaps(newTaps);
    if (newTaps.length >= TAPS_NEEDED) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const avgAccuracy = newTaps.reduce((a, b) => a + b, 0) / newTaps.length;
      setPhase('done');
      // Pass accuracy (0–1) to race engine — it determines the real outcome
      setTimeout(() => onResult(false, 3, 0, avgAccuracy), 600);
    }
  }

  const greenZone = barPos > 35 && barPos < 65;

  if (phase === 'countdown') {
    return (
      <div className="text-center py-6">
        <div className="text-6xl font-black text-orange-500 animate-pulse">
          {count === 0 ? 'GO!' : count}
        </div>
        <div className="text-sm text-gray-500 mt-2">Get ready to race!</div>
      </div>
    );
  }

  if (phase === 'race') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-gray-600">Tap when the marker is in the green!</div>
          <div className="text-sm font-bold text-orange-500">{TAPS_NEEDED - taps.length} taps left</div>
        </div>

        {/* Race track bar */}
        <div className="relative h-12 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200">
          {/* Green zone */}
          <div className="absolute top-0 bottom-0 bg-green-200 rounded" style={{ left: '35%', width: '30%' }} />
          {/* Moving marker */}
          <div
            className={`absolute top-1 bottom-1 w-8 rounded-xl transition-none flex items-center justify-center text-xl ${tapFlash ? 'bg-yellow-400 scale-110' : greenZone ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ left: `calc(${barPos}% - 16px)` }}
          >
            🚲
          </div>
          {/* Finish flag */}
          <div className="absolute right-2 top-1 bottom-1 flex items-center text-2xl">🏁</div>
        </div>

        {/* Tap accuracy indicators */}
        <div className="flex gap-1 justify-center">
          {Array.from({ length: TAPS_NEEDED }).map((_, i) => {
            const acc = taps[i];
            return (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                acc === undefined ? 'border-gray-200 bg-gray-50 text-gray-300' :
                acc > 0.7 ? 'border-green-400 bg-green-100 text-green-700' :
                acc > 0.4 ? 'border-yellow-400 bg-yellow-100 text-yellow-700' :
                'border-red-300 bg-red-100 text-red-600'
              }`}>
                {acc !== undefined ? (acc > 0.7 ? '✓' : acc > 0.4 ? '~' : '✗') : i + 1}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleTap}
          className="w-full py-5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-2xl rounded-2xl shadow-lg transition-transform"
        >
          TAP! 🚲
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <div className="text-4xl animate-bounce">🏁</div>
      <div className="text-sm font-bold text-gray-600 mt-2">Calculating result...</div>
    </div>
  );
}

// ---- Main BikePanel ----
export default function BikePanel({ save, onDelivery, onRace, onBuyUpgrade, onGoToPond }: Props) {
  const [tab, setTab] = useState<Tab>('ride');
  const [showRace, setShowRace] = useState(false);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);

  const bike = save.bike;
  const tokensLeft = save.tokens.total - save.tokens.spent;
  const isRainy = save.weather === 'rainy' || save.weather === 'stormy';
  const lemonCost = bike?.upgrades.includes('basket') ? 10 : 5;
  const deliveryPay = bike?.upgrades.includes('basket') ? DELIVERY_PAYMENT * 2 : DELIVERY_PAYMENT;
  const daysSinceRace = bike ? save.dayNumber - (bike.lastRaceDay ?? 0) : 99;
  const canRace = bike && (bike.lastRaceDay === 0 || daysSinceRace >= RACE_INTERVAL_DAYS);
  const daysUntilRace = bike ? Math.max(0, RACE_INTERVAL_DAYS - daysSinceRace) : 0;
  const ownedUpgrades = bike?.upgrades ?? [];

  function handleRaceMiniGame(won: boolean, place: 1|2|3, prize: number, miniGameScore: number) {
    setShowRace(false);
    const result = onRace(miniGameScore);
    if ('error' in result) return;
    setRaceResult(result as RaceResult);
  }

  if (!bike) return (
    <div className="text-center py-6 text-gray-400 text-sm">
      <div className="text-4xl mb-2">🚲</div>
      No bike yet — unlock the Bicycle dream to ride!
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">🚲</span>
        <div>
          <div className="font-bold text-gray-800">Your Bicycle</div>
          <div className="text-xs text-gray-400">
            {ownedUpgrades.length === 0 ? 'Basic bike' : `${ownedUpgrades.length} upgrade${ownedUpgrades.length > 1 ? 's' : ''} installed`}
            {' · '}{bike.racesEntered} race{bike.racesEntered !== 1 ? 's' : ''}, {bike.racesWon} won
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['ride', 'upgrades', 'record'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {t === 'ride' ? '🛣️ Ride' : t === 'upgrades' ? '🔧 Upgrades' : '🏆 Record'}
          </button>
        ))}
      </div>

      {/* Race result overlay */}
      {raceResult && (
        <div className={`p-4 rounded-2xl border-2 text-center ${raceResult.won ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
          <div className="text-3xl mb-1">{raceResult.won ? '🏆' : raceResult.place === 2 ? '🥈' : '🥉'}</div>
          <div className="font-black text-lg text-gray-800">
            {raceResult.place === 1 ? '1st Place!' : raceResult.place === 2 ? '2nd Place' : '3rd Place'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Your score: {raceResult.playerScore} · Opponent: {raceResult.opponentScore}
          </div>
          {raceResult.prize > 0 && (
            <div className="text-sm font-bold text-green-600 mt-1">+${raceResult.prize} prize money!</div>
          )}
          {!raceResult.won && (
            <div className="text-xs text-gray-400 mt-1">Upgrade your bike to go faster next time!</div>
          )}
          <button onClick={() => setRaceResult(null)}
            className="mt-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold px-4 py-2 rounded-xl">
            Close
          </button>
        </div>
      )}

      {/* Race mini-game modal */}
      {showRace && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <div className="text-center mb-4">
              <div className="font-black text-gray-800 text-lg">🏁 Weekly Bike Race</div>
              <div className="text-xs text-gray-400">Tap when the bike is in the green zone!</div>
            </div>
            <RaceMiniGame onResult={handleRaceMiniGame} />
            <button onClick={() => setShowRace(false)} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tab === 'ride' && (
        <div className="space-y-3">
          {/* Delivery */}
          <div className={`p-3 rounded-2xl border-2 ${isRainy ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🥖</span>
              <div>
                <div className="text-sm font-bold text-gray-800">Bakery Delivery</div>
                <div className="text-xs text-gray-500">
                  {isRainy
                    ? `Deliver ${lemonCost} lemons → earn $${deliveryPay}`
                    : '☀️ Bakery only needs deliveries on rainy days'}
                </div>
              </div>
            </div>
            {isRainy && (
              <>
                <div className="text-xs text-blue-600 mb-2">
                  🌧️ Rainy day! Lemonade is slow — deliveries are your best bet.
                  {bike.deliveriesToday > 0 && ` (${bike.deliveriesToday} run${bike.deliveriesToday > 1 ? 's' : ''} today)`}
                </div>
                <button onClick={onDelivery}
                  disabled={tokensLeft < 1 || save.lemonadeStand.supplyCount < lemonCost}
                  className="w-full flex items-center gap-3 p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors">
                  <span>🚲</span>
                  <div className="flex-1 text-left text-sm">
                    Deliver to Bakery
                    <div className="text-xs opacity-80 font-normal">{lemonCost} lemons → ${deliveryPay}</div>
                  </div>
                  <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
                </button>
                {save.lemonadeStand.supplyCount < lemonCost && (
                  <div className="text-xs text-center text-red-400 mt-1">Need {lemonCost} lemons — buy supplies first!</div>
                )}
              </>
            )}
          </div>

          {/* Pond */}
          <button
            onClick={onGoToPond}
            className="w-full flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 active:scale-95 border-2 border-teal-200 rounded-2xl transition-all"
          >
            <span className="text-xl">🎣</span>
            <div className="flex-1 text-left text-sm font-bold text-teal-700">
              Ride to the Pond
              <div className="text-xs font-normal text-teal-500">Fish, explore, find collectibles</div>
            </div>
            <span className="text-xs bg-teal-200 text-teal-600 rounded-xl px-2 py-1 font-bold">Go →</span>
          </button>

          {/* Race */}
          <div className={`p-3 rounded-2xl border-2 ${canRace ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏁</span>
              <div>
                <div className="text-sm font-bold text-gray-800">Weekly Bike Race</div>
                <div className="text-xs text-gray-500">
                  {canRace ? 'This week\'s race is on! Tap the green zone to go fast.' : `Next race in ${daysUntilRace} day${daysUntilRace !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            {canRace ? (
              <button onClick={() => setShowRace(true)}
                disabled={tokensLeft < 1}
                className="w-full flex items-center gap-3 p-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl font-bold transition-colors">
                <span>🚲</span>
                <div className="flex-1 text-left text-sm">
                  Enter the Race!
                  <div className="text-xs opacity-80 font-normal">1st: $15 + 🏆 · 2nd: $5 · 3rd: the glory</div>
                </div>
                <span className="text-xs bg-black/20 rounded-lg px-2 py-1">1⚡</span>
              </button>
            ) : (
              <div className="text-xs text-center text-gray-400 py-2">
                Practice upgrading your bike while you wait!
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'upgrades' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-1">Upgrades make your bike faster for races and better for deliveries.</div>
          {BIKE_UPGRADES.map(upgrade => {
            const owned = ownedUpgrades.includes(upgrade.id);
            return (
              <div key={upgrade.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${owned ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="text-2xl">{upgrade.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-700">{upgrade.name}</div>
                  <div className="text-xs text-gray-500 leading-snug">{upgrade.desc}</div>
                  {upgrade.raceBonus > 0 && (
                    <div className="text-xs text-orange-500 font-medium mt-0.5">+{upgrade.raceBonus} race speed</div>
                  )}
                </div>
                {owned ? (
                  <span className="text-green-500 text-xl flex-shrink-0">✅</span>
                ) : (
                  <button onClick={() => onBuyUpgrade(upgrade.id)}
                    disabled={save.coins < upgrade.cost}
                    className="flex-shrink-0 text-xs bg-orange-400 hover:bg-orange-500 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-xl">
                    ${upgrade.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'record' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Races', value: bike.racesEntered, emoji: '🏁' },
              { label: 'Wins', value: bike.racesWon, emoji: '🏆' },
              { label: 'Deliveries', value: bike.totalDeliveries ?? 0, emoji: '🚲' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center">
                <div className="text-2xl">{s.emoji}</div>
                <div className="font-black text-xl text-gray-800">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
          {bike.racesWon > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-sm font-bold text-yellow-800">{bike.racesWon} race win{bike.racesWon > 1 ? 's' : ''}!</div>
              <div className="text-xs text-yellow-600">These trophies live in your treehouse.</div>
            </div>
          )}
          <div className="text-xs text-center text-gray-400">Win a race to earn $15 and a trophy!</div>
        </div>
      )}
    </div>
  );
}
