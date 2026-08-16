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
import DreamGoalBar from '@/components/DreamGoalBar';
import TokenBar from '@/components/TokenBar';
import LifeMeters from '@/components/LifeMeters';
import WeatherBadge from '@/components/WeatherBadge';
import ActionPanel from '@/components/ActionPanel';
import EventLog from '@/components/EventLog';

let logCounter = 0;
function makeEntry(emoji: string, text: string, type: LogEntry['type']): LogEntry {
  return { id: String(logCounter++), emoji, text, type };
}

export default function Home() {
  const [save, setSave] = useState<PlayerSave | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [ready, setReady] = useState(false);

  // Load save on mount
  useEffect(() => {
    const existing = loadSave();
    if (existing) setSave(existing);
    setReady(true);
  }, []);

  // Auto-save whenever save changes
  useEffect(() => {
    if (save) writeSave(save);
  }, [save]);

  const addLog = useCallback((entry: LogEntry) => {
    setLog(prev => [entry, ...prev].slice(0, 20));
  }, []);

  function handleOnboardingComplete(name: string, age: number, dreamGoalId: string) {
    const newSave = createNewSave(name, age, dreamGoalId);
    setSave(newSave);
    setLog([
      makeEntry('🌍', `Welcome, ${name}! Your world is ready. Start by buying supplies for your lemonade stand.`, 'event'),
    ]);
  }

  function handleBuySupplies() {
    if (!save) return;
    const result = buySupplies(save);
    if ('error' in result) {
      addLog(makeEntry('❌', result.error, 'bad'));
      return;
    }
    setSave(result);
    addLog(makeEntry('🍋', `Bought 10 lemons for 5 coins. Stand ready!`, 'good'));
  }

  function handleRunStand() {
    if (!save) return;
    const result = runLemonadeStand(save);
    if ('error' in result) {
      addLog(makeEntry('❌', result.error, 'bad'));
      return;
    }
    const updated = applyStandResult(save, result);
    setSave(updated);

    const weatherNote = save.weather === 'rainy'
      ? ' (fewer customers — it\'s rainy!)'
      : save.weather === 'stormy' ? ' (hardly anyone out in this storm!)' : '';

    if (result.cupsServed === 0) {
      addLog(makeEntry('😔', `No cups sold today.${weatherNote}`, 'bad'));
    } else {
      addLog(makeEntry('🥤', `Sold ${result.cupsServed} cups → +${result.revenue} coins${result.helperCost ? ` (paid helper ${result.helperCost})` : ''}. Profit: +${result.profit}${weatherNote}`, 'good'));
    }

    if (result.limitingFactor === 'supplies') {
      addLog(makeEntry('⚠️', 'You ran out of lemons before all customers were served. Buy more supplies next time!', 'neutral'));
    }

    // Check quest q1 — use functional update to avoid stale closure
    setSave(prev => {
      if (!prev) return prev;
      const q1 = prev.quests.find(q => q.id === 'q1');
      if (!q1 || q1.completed || result.cupsServed < 1) return prev;
      // Complete the quest
      setTimeout(() => addLog(makeEntry('🎉', 'Quest complete: First Sale! +5 coins bonus!', 'event')), 0);
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
    if ('error' in result) {
      addLog(makeEntry('❌', result.error, 'bad'));
      return;
    }
    setSave(result);
    addLog(makeEntry('🌱', `You planted a lemon tree! It'll be ready to harvest in ${result.lemonTree.matureAt} days. Wise Fox approves.`, 'good'));
  }

  function handleHarvestTree() {
    if (!save) return;
    const result = harvestLemonTree(save);
    if ('error' in result) {
      addLog(makeEntry('❌', result.error, 'bad'));
      return;
    }
    setSave(result);
    addLog(makeEntry('🍋', `Harvested ${save.lemonTree.lemonYield} lemons from your tree — for free!`, 'good'));
  }

  function handleContribute(amount: number) {
    if (!save) return;
    const result = contributeToDream(save, amount);
    if ('error' in result) {
      addLog(makeEntry('❌', result.error, 'bad'));
      return;
    }
    setSave(result);
    const pct = Math.round((result.dreamGoal.saved / result.dreamGoal.cost) * 100);
    if (result.dreamGoal.unlocked) {
      addLog(makeEntry('🎉', `YOU DID IT! You reached your Dream Goal: ${result.dreamGoal.name}!`, 'event'));
    } else {
      addLog(makeEntry('⭐', `Saved ${amount} coins toward your ${result.dreamGoal.name}! (${pct}% there)`, 'good'));
    }
  }

  function handleSetPrice(price: number) {
    if (!save) return;
    setSave({
      ...save,
      lemonadeStand: { ...save.lemonadeStand, pricePerCup: price },
    });
    const note = price === 1 ? 'More customers, less per cup.' : price >= 4 ? 'Big profit per cup, but fewer buyers.' : 'Good middle ground.';
    addLog(makeEntry('🏷️', `Price set to ${price} 🪙/cup. ${note}`, 'neutral'));
  }

  function handleNextDay() {
    if (!save) return;
    const updated = advanceDay(save);
    setSave(updated);

    const weatherEmojis: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️' };
    const demandNote = weatherDemandMultiplier(updated.weather) < 1
      ? ` Lemonade demand will be lower today.`
      : ' Great day for lemonade!';

    addLog(makeEntry(
      weatherEmojis[updated.weather] ?? '🌤️',
      `Morning of Day ${updated.dayNumber}. Weather: ${updated.weather}.${demandNote}`,
      updated.weather === 'rainy' || updated.weather === 'stormy' ? 'bad' : 'neutral'
    ));

    if (updated.lemonTree.planted && updated.lemonTree.daysOld >= updated.lemonTree.matureAt && save.lemonTree.daysOld < save.lemonTree.matureAt) {
      addLog(makeEntry('🌳', 'Your lemon tree is ready to harvest!', 'event'));
    }
  }

  // ---- Render ----
  if (!ready) return null;

  if (!save) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // tokensLeft used by ActionPanel disabled logic (passed via save prop)

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-green-100">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <span className="font-bold text-green-700">{save.playerName}'s World</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-yellow-700">{save.coins}</span>
          </div>
          <div className="text-xs text-gray-400">
            {save.lemonadeStand.supplyCount} 🍋
          </div>
        </div>
      </div>

      {/* World view — placeholder town art */}
      <div className="relative h-48 bg-gradient-to-b from-sky-300 to-green-300 overflow-hidden flex items-end justify-center pb-2 gap-6">
        <div className="text-center">
          <div className="text-6xl">{save.lemonTree.planted ? (save.lemonTree.daysOld >= save.lemonTree.matureAt ? '🌳' : '🌱') : '⬜'}</div>
          <div className="text-xs text-white/80 font-medium">Lemon Tree</div>
        </div>
        <div className="text-center">
          <div className="text-6xl">🏪</div>
          <div className="text-xs text-white/80 font-medium">Stand</div>
        </div>
        <div className="text-center">
          <div className="text-6xl">🏡</div>
          <div className="text-xs text-white/80 font-medium">Home</div>
        </div>
        {/* Weather overlay */}
        {save.weather === 'rainy' && (
          <div className="absolute inset-0 bg-blue-400/20 flex items-start justify-center pt-4">
            <span className="text-4xl animate-bounce">🌧️</span>
          </div>
        )}
        {save.weather === 'stormy' && (
          <div className="absolute inset-0 bg-slate-600/30 flex items-start justify-center pt-4">
            <span className="text-4xl animate-pulse">⛈️</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Weather + tokens row */}
        <div className="flex gap-3">
          <WeatherBadge weather={save.weather} season={save.season} day={save.dayNumber} />
          <div className="flex-1">
            <TokenBar tokens={save.tokens} />
          </div>
        </div>

        {/* Dream goal */}
        <DreamGoalBar goal={save.dreamGoal} onContribute={handleContribute} coins={save.coins} />

        {/* Action panel */}
        <ActionPanel
          save={save}
          onBuySupplies={handleBuySupplies}
          onRunStand={handleRunStand}
          onPlantTree={handlePlantTree}
          onHarvestTree={handleHarvestTree}
          onNextDay={handleNextDay}
          onSetPrice={handleSetPrice}
        />

        {/* Event log */}
        <EventLog entries={log} />

        {/* Life meters */}
        <LifeMeters meters={save.lifeMeters} />

        {/* Debug reset */}
        <div className="text-center pt-2 pb-8">
          <button
            onClick={() => { if (confirm('Start over?')) { localStorage.clear(); setSave(null); setLog([]); } }}
            className="text-xs text-gray-300 hover:text-gray-400 transition-colors"
          >
            reset world
          </button>
        </div>
      </div>
    </main>
  );
}
