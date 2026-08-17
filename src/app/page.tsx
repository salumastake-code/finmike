'use client';
import { useEffect, useState, useCallback } from 'react';
import type { PlayerSave } from '@/types/game';
import type { LogEntry } from '@/components/EventLog';
import { loadSave, writeSave } from '@/lib/save';
import { createNewSave } from '@/lib/defaults';
import {
  runLemonadeStand, applyStandResult,
  buySupplies, plantLemonTree, harvestLemonTree,
  contributeToDream, advanceDay,
  weatherDemandMultiplier,
} from '@/lib/economy';

import Onboarding from '@/components/Onboarding';
import GrandpaIntro from '@/components/GrandpaIntro';
import DreamCelebration, { NEXT_GOALS } from '@/components/DreamCelebration';
import WorldMap from '@/components/WorldMap';
import LocationPanel from '@/components/LocationPanel';
import TokenBar from '@/components/TokenBar';
import WeatherBadge from '@/components/WeatherBadge';
import EventLog from '@/components/EventLog';
import WorldCodeModal from '@/components/WorldCodeModal';

type Location = 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox';

let logCounter = 0;
function makeEntry(emoji: string, text: string, type: LogEntry['type']): LogEntry {
  return { id: String(logCounter++), emoji, text, type };
}

export default function Home() {
  const [save, setSave] = useState<PlayerSave | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showWorldCode, setShowWorldCode] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeLocation, setActiveLocation] = useState<Location | null>('stand');

  useEffect(() => {
    const existing = loadSave();
    if (existing) setSave(existing);
    setReady(true);
  }, []);

  useEffect(() => {
    if (save) writeSave(save);
  }, [save]);

  const addLog = useCallback((entry: LogEntry) => {
    setLog(prev => [entry, ...prev].slice(0, 20));
  }, []);

  function handleOnboardingComplete(name: string, age: number, dreamGoalId: string) {
    const newSave = createNewSave(name, age, dreamGoalId);
    setSave(newSave);
    setShowIntro(true); // show Grandpa intro for new players
  }

  // ---- Actions ----
  function handleBuySupplies() {
    if (!save) return;
    const result = buySupplies(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🍋', 'Bought 10 lemons for 5 dollars. Ready to sell!', 'good'));
  }

  function handleRunStand() {
    if (!save) return;
    const result = runLemonadeStand(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    const updated = applyStandResult(save, result);
    setSave(updated);

    const weatherNote =
      save.weather === 'rainy' ? ' (fewer customers — it\'s rainy!)' :
      save.weather === 'stormy' ? ' (hardly anyone out in this storm!)' : '';

    if (result.cupsServed === 0) {
      addLog(makeEntry('😔', `No cups sold today.${weatherNote}`, 'bad'));
    } else {
      addLog(makeEntry('🥤', `Sold ${result.cupsServed} cups → +${result.revenue} dollars!${weatherNote}`, 'good'));
    }
    if (result.limitingFactor === 'supplies') {
      addLog(makeEntry('⚠️', 'Ran out of lemons before all customers were served!', 'neutral'));
    }

    setSave(prev => {
      if (!prev) return prev;
      const q1 = prev.quests.find(q => q.id === 'q1');
      if (!q1 || q1.completed || result.cupsServed < 1) return prev;
      setTimeout(() => addLog(makeEntry('🎉', 'Quest complete: First Sale! +5 dollars bonus!', 'event')), 0);
      return {
        ...prev,
        coins: prev.coins + 5,
        quests: prev.quests.map(q => q.id === 'q1' ? { ...q, completed: true } : q),
      };
    });
  }

  function handlePlantTree() {
    if (!save) return;
    const result = plantLemonTree(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🌱', `Planted a lemon tree! Ready to harvest in ${result.lemonTree.matureAt} days.`, 'good'));
  }

  function handleHarvestTree() {
    if (!save) return;
    const result = harvestLemonTree(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🍋', `Harvested ${save.lemonTree.lemonYield} free lemons from your tree!`, 'good'));
  }

  function handleContribute(amount: number) {
    if (!save) return;
    const result = contributeToDream(save, amount);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    const pct = Math.round((result.dreamGoal.saved / result.dreamGoal.cost) * 100);
    if (result.dreamGoal.unlocked) {
      setShowCelebration(true);
    } else {
      addLog(makeEntry('⭐', `Saved ${amount} dollars toward your ${result.dreamGoal.name}! (${pct}% there)`, 'good'));
    }
  }

  function handleHireHelper() {
    if (!save) return;
    if (save.lemonadeStand.hasHelper) return;
    if (save.coins < 10) { addLog(makeEntry('❌', 'You need 10 dollars to hire a helper.', 'bad')); return; }
    setSave({ ...save, coins: save.coins - 10, totalSpent: save.totalSpent + 10, lemonadeStand: { ...save.lemonadeStand, hasHelper: true } });
    addLog(makeEntry('👦', 'Hired a helper! They\'ll run the stand — you keep your tokens.', 'good'));
  }

  function handleSetPrice(price: number) {
    if (!save) return;
    setSave({ ...save, lemonadeStand: { ...save.lemonadeStand, pricePerCup: price } });
    const note = price === 1 ? 'More customers, less per cup.' : price >= 4 ? 'Big profit per cup, fewer buyers.' : 'Good balance.';
    addLog(makeEntry('🏷️', `Price set to ${price} 💵/cup. ${note}`, 'neutral'));
  }

  function handlePickNextGoal(goalId: string) {
    if (!save) return;
    const goal = NEXT_GOALS.find(g => g.id === goalId);
    if (!goal) return;

    // Apply world unlock for the completed goal
    const completedUnlock = save.dreamGoal.unlocks;
    const newWorldUnlocks = {
      ...save.worldUnlocks,
      ...(completedUnlock ? { [completedUnlock]: true } : {}),
    };

    setSave({
      ...save,
      worldUnlocks: newWorldUnlocks,
      dreamGoal: {
        id: goal.id,
        name: goal.name,
        emoji: goal.emoji,
        cost: goal.cost,
        unlocks: goal.unlocks,
        saved: 0,
        unlocked: false,
      },
    });
    setShowCelebration(false);
    addLog(makeEntry('✨', `New dream: ${goal.name}! ${goal.unlocksDesc}`, 'event'));
  }

  function handleNextDay() {
    if (!save) return;
    const updated = advanceDay(save);
    setSave(updated);
    const weatherEmojis: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️' };
    const demandNote = weatherDemandMultiplier(updated.weather) < 1 ? ' Demand will be lower today.' : ' Great day for lemonade!';
    addLog(makeEntry(
      weatherEmojis[updated.weather] ?? '🌤️',
      `Morning of Day ${updated.dayNumber}. ${updated.weather.charAt(0).toUpperCase() + updated.weather.slice(1)}.${demandNote}`,
      updated.weather === 'rainy' || updated.weather === 'stormy' ? 'bad' : 'neutral',
    ));
    if (updated.lemonTree.planted && updated.lemonTree.daysOld >= updated.lemonTree.matureAt && save.lemonTree.daysOld < save.lemonTree.matureAt) {
      addLog(makeEntry('🌳', 'Your lemon tree is ready to harvest!', 'event'));
    }
    if (updated.dreamGoal.interestEarnedToday && updated.dreamGoal.interestEarnedToday > 0) {
      addLog(makeEntry('🐷', `Your piggy bank grew overnight! +$${updated.dreamGoal.interestEarnedToday.toFixed(2)} interest on your savings.`, 'good'));
    }
    if (updated.dreamGoal.unlocked && !save.dreamGoal.unlocked) {
      setShowCelebration(true);
    }
    // Nudge player toward home after ending day
    setActiveLocation('stand');
  }

  // ---- Render ----
  if (!ready) return null;

  if (!save) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onLoadCode={(loaded) => { setSave(loaded); writeSave(loaded); }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Dream reached celebration */}
      {showCelebration && save && (
        <DreamCelebration
          completedGoal={save.dreamGoal}
          onPickNext={handlePickNextGoal}
        />
      )}

      {/* Grandpa intro overlay */}
      {showIntro && (
        <GrandpaIntro
          playerName={save.playerName}
          onDone={() => setShowIntro(false)}
        />
      )}

      {/* World Code modal */}
      {showWorldCode && (
        <WorldCodeModal
          save={save}
          onClose={() => setShowWorldCode(false)}
          onLoad={(loaded) => { setSave(loaded); writeSave(loaded); setLog([]); }}
          onReset={() => { localStorage.clear(); setSave(null); setLog([]); }}
        />
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <span className="font-bold text-green-700 text-sm">{save.playerName}'s World</span>
          <span className="text-xs text-gray-400">· Day {save.dayNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
            <span className="text-base">💵</span>
            <span className="font-bold text-yellow-700">{save.coins}</span>
          </div>
          <span className="text-xs text-gray-400">{save.lemonadeStand.supplyCount}🍋</span>
          <button onClick={() => setShowWorldCode(true)} className="text-lg hover:scale-110 transition-transform" title="World Code">🗺️</button>
        </div>
      </div>

      {/* World Map */}
      <WorldMap
        save={save}
        weather={save.weather}
        activeLocation={activeLocation}
        onSelectLocation={setActiveLocation}
      />

      {/* Weather + Token strip */}
      <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100">
        <WeatherBadge weather={save.weather} season={save.season} day={save.dayNumber} />
        <div className="flex-1">
          <TokenBar tokens={save.tokens} />
        </div>
      </div>

      {/* Location panel */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
        {/* Location tab selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {([
            { id: 'stand',    emoji: '🏪', label: 'Stand' },
            { id: 'tree',     emoji: '🌳', label: 'Tree' },
            { id: 'home',     emoji: '🏡', label: 'Home' },
            { id: 'tortoise', emoji: '🐢', label: 'Tortoise' },
            { id: 'buzzybee', emoji: '🐝', label: 'Buzzy' },
            { id: 'wisefox',  emoji: '🦊', label: 'Fox' },
          ] as const).map(loc => (
            <button
              key={loc.id}
              onClick={() => setActiveLocation(loc.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeLocation === loc.id
                  ? 'bg-green-500 text-white shadow'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span>{loc.emoji}</span>{loc.label}
            </button>
          ))}
        </div>

        {/* Active location content */}
        {activeLocation && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <LocationPanel
              location={activeLocation}
              save={save}
              onBuySupplies={handleBuySupplies}
              onRunStand={handleRunStand}
              onHireHelper={handleHireHelper}
              onSetPrice={handleSetPrice}
              onPlantTree={handlePlantTree}
              onHarvestTree={handleHarvestTree}
              onContribute={handleContribute}
              onNextDay={handleNextDay}
            />
          </div>
        )}
      </div>

      {/* Event log */}
      <div className="max-w-lg mx-auto px-4 pb-4 mt-2">
        <EventLog entries={log} />
      </div>

      <div className="pb-10" />
    </main>
  );
}
