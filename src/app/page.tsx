'use client';
import { useEffect, useState, useCallback } from 'react';
import type { PlayerSave } from '@/types/game';
import type { LogEntry } from '@/components/EventLog';
import { loadSave, writeSave } from '@/lib/save';
import { createNewSave } from '@/lib/defaults';
import {
  runLemonadeStand, applyStandResult,
  buySupplies, plantLemonTree, harvestLemonTree, harvestLemonTreeById,
  contributeToDream, withdrawFromDream, advanceDay,
  weatherDemandMultiplier, hireForShift, type HireShiftResult,
  depositToPiggyBank, withdrawFromPiggyBank, gainSkill, getMood,
  unlockSecondStand, stockSecondStand, setSecondStandPrice,
  hireSecondStandHelper, advanceSecondStandDay, type SecondStandResult,
  buyStandUpgrade,
} from '@/lib/economy';
import { plantCrop, harvestPlot, sellAtMarket, initGarden, advanceGardenDay, CROPS } from '@/lib/garden';
import { feedPet, playWithPet, initPet, advancePetDay } from '@/lib/pet';
import { runDelivery, runRace, buyBikeUpgrade, initBike, advanceBikeDay, type RaceResult } from '@/lib/bike';
import { goFishing, initPond, advancePondDay, COLLECTIBLES, ALL_COLLECTIBLES } from '@/lib/pond';
import type { FishingResult } from '@/lib/pond';
import type { CropId } from '@/types/game';

import Onboarding from '@/components/Onboarding';
import GrandpaIntro from '@/components/GrandpaIntro';
import DreamCelebration, { NEXT_GOALS } from '@/components/DreamCelebration';
import GardenPanel from '@/components/GardenPanel';
import PetPanel from '@/components/PetPanel';
import TreehousePanel, { visitHappinessBonus } from '@/components/TreehousePanel';
import GrandpaPanel from '@/components/GrandpaPanel';
import BikePanel from '@/components/BikePanel';
import PondPanel from '@/components/PondPanel';
import SecondStandPanel from '@/components/SecondStandPanel';
import WorldMap from '@/components/WorldMap';
import LocationPanel from '@/components/LocationPanel';
import EventLog from '@/components/EventLog';
import WorldCodeModal from '@/components/WorldCodeModal';

type GameLocation = 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox' | 'garden' | 'pet' | 'treehouse' | 'grandpa' | 'bike' | 'pond' | 'stand2';

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
  const [activeLocation, setActiveLocation] = useState<GameLocation | null>('stand');

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
    // Check quest before updating state
    const q1 = updated.quests.find(q => q.id === 'q1');
    let finalSave = updated;
    if (q1 && !q1.completed && result.cupsServed >= 1) {
      finalSave = {
        ...updated,
        coins: updated.coins + 5,
        quests: updated.quests.map(q => q.id === 'q1' ? { ...q, completed: true } : q),
      };
    }
    setSave(finalSave);

    const weatherNote =
      save.weather === 'rainy' ? ' (fewer customers — it\'s rainy!)' :
      save.weather === 'stormy' ? ' (hardly anyone out in this storm!)' : '';

    if (result.cupsServed === 0) {
      addLog(makeEntry('😔', `Quiet shift — no cups sold.${weatherNote}`, 'bad'));
    } else {
      addLog(makeEntry('🥤', `Shift done! Sold ${result.cupsServed} cups → +${result.revenue} dollars!${weatherNote}`, 'good'));
    }
    if (result.limitingFactor === 'supplies') {
      addLog(makeEntry('⚠️', 'Ran out of lemons before all customers were served!', 'neutral'));
    }
    if (q1 && !q1.completed && result.cupsServed >= 1) {
      addLog(makeEntry('🎉', 'Quest complete: First Sale! +5 dollars bonus!', 'event'));
    }
  }

  function handlePlantTree() {
    if (!save) return;
    const result = plantLemonTree(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    const treeNum = (result.lemonTrees?.length ?? 1);
    addLog(makeEntry('🌱', `Planted tree #${treeNum}! Grows in 3 days, then yields 10 lemons every 3 days.`, 'good'));
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
    const result = hireForShift(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    const { save: nextSave, cupsServed, revenue, profit, isBadShift } = result as HireShiftResult;
    setSave(nextSave);
    if (cupsServed === 0) {
      addLog(makeEntry('👦', `Hired someone — they showed up late and sold nothing. Lost $5.`, 'bad'));
    } else if (isBadShift) {
      addLog(makeEntry('👦', `Helper had a rough shift. Only sold ${cupsServed} cups → $${revenue}. ${profit < 0 ? `Lost $${Math.abs(profit)} after paying them.` : `Barely covered the $5.`}`, 'bad'));
    } else {
      addLog(makeEntry('👦', `Hired someone for a shift! They sold ${cupsServed} cups → +$${revenue} (cost $5, kept $${profit}).`, 'good'));
    }
  }

  function handleBuyStandUpgrade() {
    if (!save) return;
    const result = buyStandUpgrade(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🏪', 'Stand upgraded! Better sign, nicer setup — more customers will stop by, and you can charge more without losing as many.', 'event'));
    addLog(makeEntry('💡', 'Grandpa says: "A little investment in your business can pay for itself many times over."', 'neutral'));
  }

  function handleWithdrawFromDream(amount: number) {
    if (!save) return;
    const result = withdrawFromDream(save, amount);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🐷', `Withdrew $${amount} from savings. Balance: $${result.dreamGoal.saved.toFixed(0)}`, 'neutral'));
  }

  function handleHarvestTree(treeId?: string) {
    if (!save) return;
    const result = treeId ? harvestLemonTreeById(save, treeId) : harvestLemonTree(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    const trees = save.lemonTrees ?? [];
    const tree = treeId ? trees.find(t => t.id === treeId) : trees[0];
    addLog(makeEntry('🍋', `Harvested ${tree?.lemonYield ?? 10} lemons! Ready again in ${tree?.harvestEveryDays ?? 3} days.`, 'good'));
  }

  function handleSetPrice(price: number) {
    if (!save) return;
    setSave({ ...save, lemonadeStand: { ...save.lemonadeStand, pricePerCup: price } });
    const note = price === 1 ? 'More customers, less per cup.' : price >= 4 ? 'Big profit per cup, fewer buyers.' : 'Good balance.';
    addLog(makeEntry('🏷️', `Price set to ${price} 💵/cup. ${note}`, 'neutral'));
  }

  // ---- Garden handlers ----
  function handlePlantCrop(cropId: CropId) {
    if (!save) return;
    const result = plantCrop(save, cropId);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry(CROPS[cropId].emoji, `Planted ${CROPS[cropId].name}! Grows in ${CROPS[cropId].growDays} day(s).`, 'good'));
  }

  function handleHarvestPlot(plotId: string) {
    if (!save) return;
    const result = harvestPlot(save, plotId);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🧺', 'Harvested! Head to the market to sell.', 'good'));
  }

  function handleSellAtMarket(cropId: CropId) {
    if (!save) return;
    const result = sellAtMarket(save, cropId);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    const prev = save.garden?.marketInventory[cropId] ?? 0;
    const earned = prev * CROPS[cropId].sellPrice;
    setSave(result);
    addLog(makeEntry('💵', `Sold ${prev}x ${CROPS[cropId].name} for $${earned}!`, 'good'));
  }

  // ---- Pet handlers ----
  function handleFeedPet() {
    if (!save) return;
    const result = feedPet(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🍖', `${save.pet?.name} ate happily! +20 happiness.`, 'good'));
  }

  function handlePlayWithPet() {
    if (!save) return;
    const result = playWithPet(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🎾', `${save.pet?.name} had a great time! +25 happiness.`, 'good'));
  }

  function handleNamePet(name: string) {
    if (!save) return;
    setSave({ ...save, pet: initPet(name) });
    addLog(makeEntry('🐶', `${name} is home! Make sure to feed and play every day.`, 'event'));
  }

  // ---- Treehouse handlers ----
  function handleVisitTreehouse() {
    // First-time visit — marks treehouse as visited, costs 1⚡, gives base happiness
    if (!save) return;
    const tokensLeft = save.tokens.total - save.tokens.spent;
    if (tokensLeft < 1) { addLog(makeEntry('❌', 'Not enough energy to climb up today.', 'bad')); return; }
    const decorations = save.treehouse?.decorations ?? [];
    const happinessGain = visitHappinessBonus(decorations);
    setSave({
      ...save,
      tokens: { ...save.tokens, spent: save.tokens.spent + 1 },
      lifeMeters: { ...save.lifeMeters, happiness: Math.min(100, save.lifeMeters.happiness + happinessGain) },
      treehouse: { visited: true, questGiven: true, butterflies: save.treehouse?.butterflies ?? [], decorations },
    });
    addLog(makeEntry('🌳', 'You climbed up to your treehouse! Grandpa was right — it\'s magical up here.', 'event'));
  }

  function handleHangOutTreehouse() {
    // Repeatable daily hang-out — costs 1⚡, gives decoration-based happiness
    if (!save || !save.treehouse) return;
    const tokensLeft = save.tokens.total - save.tokens.spent;
    if (tokensLeft < 1) { addLog(makeEntry('❌', 'Not enough energy to head up today.', 'bad')); return; }
    const decorations = save.treehouse.decorations ?? [];
    const happinessGain = visitHappinessBonus(decorations);
    setSave({
      ...save,
      tokens: { ...save.tokens, spent: save.tokens.spent + 1 },
      lifeMeters: { ...save.lifeMeters, happiness: Math.min(100, save.lifeMeters.happiness + happinessGain) },
    });
    const decoNote = decorations.length > 0
      ? ` Your ${decorations.length} decoration${decorations.length > 1 ? 's' : ''} made it extra cozy.`
      : ' Add decorations to make it even better!';
    addLog(makeEntry('🌳', `Hung out in the treehouse. +${happinessGain} happiness.${decoNote}`, 'good'));
  }

  function handleBuyAddon(addonId: string, cost: number) {
    if (!save) return;
    if (save.coins < cost) { addLog(makeEntry('❌', `You need $${cost} for that.`, 'bad')); return; }
    if (!save.treehouse) return;
    if (save.treehouse.decorations.includes(addonId)) { addLog(makeEntry('❌', 'Already installed!', 'bad')); return; }
    const addonNames: Record<string, string> = { string_lights: '✨ String Lights', telescope: '🔭 Telescope', flag: '🚩 Flag', rug: '🟫 Cozy Rug' };
    setSave({
      ...save,
      coins: save.coins - cost,
      totalSpent: save.totalSpent + cost,
      treehouse: { ...save.treehouse, decorations: [...save.treehouse.decorations, addonId] },
    });
    addLog(makeEntry('🌳', `Added ${addonNames[addonId] ?? addonId} to your treehouse!`, 'good'));
  }

  function handleCatchButterfly() {
    if (!save || !save.treehouse) return;
    const tokensLeft = save.tokens.total - save.tokens.spent;
    if (tokensLeft < 1) { addLog(makeEntry('❌', 'Not enough energy.', 'bad')); return; }
    const allButterflies = ['blue', 'yellow', 'purple', 'golden'];
    const uncaught = allButterflies.filter(b => !save.treehouse!.butterflies.includes(b));
    if (uncaught.length === 0) { addLog(makeEntry('🦋', 'You\'ve caught them all!', 'good')); return; }
    const weights: Record<string, number> = { blue: 60, yellow: 55, purple: 25, golden: 8 };
    const available = uncaught.filter(b => Math.random() * 100 < weights[b]);
    const caught = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
    const names: Record<string, string> = { blue: 'Blue Morpho 🦋', yellow: 'Yellow Swallowtail 🌼', purple: 'Purple Emperor 💜', golden: 'Golden Wing ✨' };
    setSave({
      ...save,
      tokens: { ...save.tokens, spent: save.tokens.spent + 1 },
      treehouse: { ...save.treehouse, butterflies: caught ? [...save.treehouse.butterflies, caught] : save.treehouse.butterflies },
    });
    if (caught) {
      addLog(makeEntry('🦋', `You caught a ${names[caught]}! Added to your collection.`, 'event'));
    } else {
      addLog(makeEntry('🌿', 'You looked around but didn\'t catch anything this time. Try again tomorrow!', 'neutral'));
    }
  }

  function handlePickNextGoal(goalId: string) {
    if (!save) return;

    // If no available goals remain, just close the celebration
    if (goalId === '__done__') {
      setShowCelebration(false);
      // Still apply the completed goal's world unlock
      const completedUnlock = save.dreamGoal.unlocks;
      if (completedUnlock) {
        setSave(prev => {
          if (!prev) return prev;
          const newUnlocks = { ...prev.worldUnlocks, [completedUnlock]: true };
          const gardenInit = completedUnlock === 'garden' && !prev.garden ? initGarden() : prev.garden;
          const treeInit = completedUnlock === 'treehouse' && !prev.treehouse
            ? { visited: false, questGiven: false, butterflies: [], decorations: [] } : prev.treehouse;
          const bikeInitD = completedUnlock === 'bicycle' && !prev.bike ? initBike() : prev.bike;
          const pondInitD = completedUnlock === 'bicycle' && !prev.pond ? initPond() : prev.pond;
          return { ...prev, worldUnlocks: newUnlocks, garden: gardenInit, treehouse: treeInit, bike: bikeInitD, pond: pondInitD };
        });
      }
      return;
    }

    const goal = NEXT_GOALS.find(g => g.id === goalId);
    if (!goal) return;

    // Apply world unlock for the completed goal
    const completedUnlock = save.dreamGoal.unlocks;
    const newWorldUnlocks = {
      ...save.worldUnlocks,
      ...(completedUnlock ? { [completedUnlock]: true } : {}),
    };

    // Initialize newly unlocked features
    const gardenInit = completedUnlock === 'garden' && !save.garden ? initGarden() : save.garden;
    const treeInit = completedUnlock === 'treehouse' && !save.treehouse
      ? { visited: false, questGiven: false, butterflies: [], decorations: [] } : save.treehouse;
    const bikeInit = completedUnlock === 'bicycle' && !save.bike ? initBike() : save.bike;
    const pondInit = completedUnlock === 'bicycle' && !save.pond ? initPond() : save.pond;
    // Pet: unlock adds the tab but doesn't init pet yet (player names it on first visit)

    setSave({
      ...save,
      worldUnlocks: newWorldUnlocks,
      garden: gardenInit,
      treehouse: treeInit,
      bike: bikeInit,
      pond: pondInit,
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
    if (completedUnlock === 'pet') {
      addLog(makeEntry('🐶', `Your puppy arrived! Tap the 🐶 Puppy tab to meet them and give them a name!`, 'event'));
    }
    if (completedUnlock === 'bicycle') {
      addLog(makeEntry('🚲', `You got your bicycle! Buzzy Bee has a delivery quest for you — visit the 🐝 tab!`, 'event'));
    }
  }

  // ---- Second stand handlers ----
  function handleClaimSecondStand() {
    if (!save) return;
    const result = unlockSecondStand(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🏪', 'Grandpa helped you open Stand #2! You can\'t be in two places at once — hire a helper to run it.', 'event'));
    addLog(makeEntry('💡', 'Remember: hire a helper each day or the stand earns nothing. That\'s the cost of delegation!', 'neutral'));
  }

  function handleStockSecondStand(lemons: number) {
    if (!save) return;
    const result = stockSecondStand(save, lemons);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🍋', `Moved ${lemons} lemons to Stand #2.`, 'neutral'));
  }

  function handleHireSecondStandHelper(): SecondStandResult | { error: string } {
    if (!save) return { error: 'No save.' };
    const result = hireSecondStandHelper(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return result; }
    const r = result as SecondStandResult;
    setSave(r.save);
    if (r.isBadShift) {
      addLog(makeEntry('👦', `Rough shift at Stand #2 — helper sold ${r.cupsServed} cups for $${r.revenue}. ${r.profit < 0 ? `Lost $${Math.abs(r.profit)} after wages.` : 'Barely covered the $5.'}`, 'bad'));
    } else {
      addLog(makeEntry('👦', `Stand #2 helper sold ${r.cupsServed} cups → $${r.revenue} revenue, $${r.profit} profit after their $5 wage.`, 'good'));
    }
    return r;
  }

  function handleSetSecondStandPrice(price: number) {
    if (!save) return;
    setSave(setSecondStandPrice(save, price));
  }

  // ---- Bike handlers ----
  function handleDelivery() {
    if (!save) return;
    const result = runDelivery(save);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    const lemonCost = save.bike?.upgrades.includes('basket') ? 10 : 5;
    const pay = save.bike?.upgrades.includes('basket') ? 20 : 10;
    setSave(result);
    addLog(makeEntry('🚲', `Delivered ${lemonCost} lemons to the bakery — earned $${pay}!`, 'good'));
  }

  function handleRace(miniGameScore = 0.5): RaceResult | { error: string } {
    if (!save) return { error: 'No save.' };
    const result = runRace(save, miniGameScore);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return result; }
    const r = result as RaceResult;
    setSave(r.save);
    if (r.won) {
      addLog(makeEntry('🏆', `You WON the race! 1st place — earned $${r.prize}! Your treehouse gets a trophy!`, 'good'));
    } else if (r.place === 2) {
      addLog(makeEntry('🥈', `2nd place! Earned $${r.prize}. Upgrade your bike for next time.`, 'neutral'));
    } else {
      addLog(makeEntry('🥉', `3rd place. No prize, but great fun! Keep practicing!`, 'neutral'));
    }
    return r;
  }

  function handleBuyBikeUpgrade(upgradeId: string) {
    if (!save) return;
    const result = buyBikeUpgrade(save, upgradeId as import('@/types/game').BikeUpgrade);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🔧', `Bike upgrade installed! Your bike just got better.`, 'good'));
  }

  // ---- Pond / fishing handlers ----
  function handleFish(successRate: number): FishingResult | { error: string } {
    if (!save) return { error: 'No save.' };
    const result = goFishing(save, successRate);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return result; }
    const r = result as FishingResult;
    setSave(r.save);
    if (r.caught) {
      addLog(makeEntry(r.fishEmoji, `Caught a ${r.fishName}! +$${r.fishValue}`, 'good'));
    } else {
      addLog(makeEntry('🌊', 'No catch this time. Try again!', 'neutral'));
    }
    if (r.collectibleFound) {
      const info = COLLECTIBLES[r.collectibleFound];
      const remaining = ALL_COLLECTIBLES.filter(c => !r.save.pond?.collectibles.includes(c)).length;
      addLog(makeEntry(info.emoji, `Found a ${info.name} for Grandpa's quest! ${remaining === 0 ? 'That\'s all 5 — go see Grandpa!' : `${5 - remaining}/5 found.`}`, 'event'));
    }
    return r;
  }

  // ---- Piggy bank handlers ----
  function handleDepositPiggyBank(amount: number) {
    if (!save) return;
    const result = depositToPiggyBank(save, amount);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🐷', `Deposited $${amount} into your piggy bank! Balance: $${result.piggyBank.balance.toFixed(2)}`, 'good'));
  }

  function handleWithdrawPiggyBank(amount: number) {
    if (!save) return;
    const result = withdrawFromPiggyBank(save, amount);
    if ('error' in result) { addLog(makeEntry('❌', result.error, 'bad')); return; }
    setSave(result);
    addLog(makeEntry('🐷', `Withdrew $${amount} from piggy bank. Cash: $${result.coins}`, 'neutral'));
  }

  // ---- Grandpa / Skill handlers ----
  function handleLearnLesson(lessonId: string, skillGained: number) {
    if (!save) return;
    const updatedLessons = save.grandpaLessons.map(l =>
      l.id === lessonId ? { ...l, completed: true } : l
    );
    const withSkill = gainSkill({ ...save, grandpaLessons: updatedLessons }, skillGained);
    // spend 1 energy
    const withToken = { ...withSkill, tokens: { ...withSkill.tokens, spent: withSkill.tokens.spent + 1 } };
    setSave(withToken);
    addLog(makeEntry('⭐', `Lesson complete! +${skillGained} Skill. Total: ${withToken.skill}/100`, 'good'));
  }

  function handleSimpleLearn() {
    if (!save) return;
    const tokensLeft = save.tokens.total - save.tokens.spent;
    if (tokensLeft < 1) { addLog(makeEntry('❌', 'Not enough energy to chat with Grandpa today.', 'bad')); return; }
    const chats = [
      "Always pay yourself first — even a little bit into savings adds up.",
      "Customers care about value, not just price. Give them a reason to come back.",
      "The best time to plant a tree was yesterday. The second best time is today.",
      "Keep track of what comes in and what goes out. That awareness is half the battle.",
      "When something goes wrong, ask: what can I learn from this?",
    ];
    const line = chats[save.dayNumber % chats.length];
    const withSkill = gainSkill(save, 1);
    const withToken = { ...withSkill, tokens: { ...withSkill.tokens, spent: withSkill.tokens.spent + 1 } };
    setSave(withToken);
    addLog(makeEntry('👴', `Grandpa: "${line}" (+1 Skill)`, 'event'));
  }

  function handleNextDay() {
    if (!save) return;
    let updated = advanceDay(save);
    updated = advanceGardenDay(updated);
    updated = advancePetDay(updated);
    updated = advanceBikeDay(updated);
    updated = advancePondDay(updated);
    updated = advanceSecondStandDay(updated);
    setSave(updated);
    const weatherEmojis: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️' };
    const demandNote = weatherDemandMultiplier(updated.weather) < 1 ? ' Demand will be lower today.' : ' Great day for lemonade!';
    addLog(makeEntry(
      weatherEmojis[updated.weather] ?? '🌤️',
      `Morning of Day ${updated.dayNumber}. ${updated.weather.charAt(0).toUpperCase() + updated.weather.slice(1)}.${demandNote}`,
      updated.weather === 'rainy' || updated.weather === 'stormy' ? 'bad' : 'neutral',
    ));
    // Tree harvest ready notifications
    (updated.lemonTrees ?? []).forEach((tree, i) => {
      const prevTree = (save.lemonTrees ?? []).find(t => t.id === tree.id);
      const daysSince = tree.lastHarvestedDay === 0 ? tree.daysOld : updated.dayNumber - tree.lastHarvestedDay;
      const isReadyNow = tree.daysOld >= tree.matureAt && daysSince >= tree.harvestEveryDays;
      const prevDaysSince = prevTree
        ? (prevTree.lastHarvestedDay === 0 ? prevTree.daysOld : save.dayNumber - prevTree.lastHarvestedDay)
        : 0;
      const wasReadyBefore = prevTree && prevTree.daysOld >= prevTree.matureAt && prevDaysSince >= prevTree.harvestEveryDays;
      if (isReadyNow && !wasReadyBefore) {
        addLog(makeEntry('🍋', `Tree #${i + 1} is ready to harvest! 10 free lemons waiting.`, 'event'));
      }
    });
    // Recap helper shifts from yesterday
    if (save.lemonadeStand.helperShiftsToday > 0) {
      addLog(makeEntry('👦', `Yesterday you hired help for ${save.lemonadeStand.helperShiftsToday} shift${save.lemonadeStand.helperShiftsToday > 1 ? 's' : ''}.`, 'neutral'));
    }
    // Pet neglect / runaway
    if (save.pet && !updated.pet) {
      addLog(makeEntry('💔', `${save.pet.name} ran away... They were too unhappy for too long. You can earn them back by saving for a new puppy.`, 'bad'));
    } else if (updated.pet && !save.pet?.fed && !save.pet?.played) {
      addLog(makeEntry('🐶', `${updated.pet.name} looks sad... Make sure to feed and play today!`, 'bad'));
    }

    if (updated.dreamGoal.interestEarnedToday && updated.dreamGoal.interestEarnedToday > 0) {
      addLog(makeEntry('⭐', `Dream savings grew! +$${updated.dreamGoal.interestEarnedToday.toFixed(2)} interest.`, 'good'));
    }
    // Second stand reminder
    if (updated.secondStand && updated.secondStand.supplyCount === 0) {
      addLog(makeEntry('🏪', 'Stand #2 is empty! Stock it with lemons so your helper can sell today.', 'neutral'));
    } else if (updated.secondStand && !updated.secondStand.helperHiredToday) {
      addLog(makeEntry('🏪', `Stand #2 is stocked with ${updated.secondStand.supplyCount} lemons — don't forget to hire a helper!`, 'neutral'));
    }
    if (updated.piggyBank?.interestEarnedToday && updated.piggyBank.interestEarnedToday > 0) {
      addLog(makeEntry('🐷', `Piggy bank: +$${updated.piggyBank.interestEarnedToday.toFixed(2)} interest! Balance: $${updated.piggyBank.balance.toFixed(2)}`, 'good'));
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
          unlockedGoals={Object.entries(save.worldUnlocks ?? {}).filter(([,v]) => v).map(([k]) => k)}
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
          {/* Mood icon */}
          <span className="text-base" title={`Mood: ${getMood(save.lifeMeters.happiness).label}`}>
            {getMood(save.lifeMeters.happiness).emoji}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
            <span className="text-base">💵</span>
            <span className="font-bold text-yellow-700">{save.coins}</span>
          </div>
          {save.piggyBank?.balance > 0 && (
            <div className="flex items-center gap-1 bg-pink-50 border border-pink-200 rounded-xl px-2 py-1.5" title="Piggy Bank">
              <span className="text-sm">🐷</span>
              <span className="text-xs font-bold text-pink-600">${save.piggyBank.balance.toFixed(0)}</span>
            </div>
          )}
          {(save.skill ?? 0) > 0 && (
            <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-1.5" title="Skill">
              <span className="text-sm">⭐</span>
              <span className="text-xs font-bold text-indigo-600">{save.skill}</span>
            </div>
          )}
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

      {/* Zero-energy sleep nudge */}
      {save.tokens.spent >= save.tokens.total && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center gap-2 text-sm text-indigo-700 font-medium">
          <span>🌙</span>
          <span>You're out of energy for today — head to <strong>Home</strong> to sleep and start a new day!</span>
        </div>
      )}

      {/* Energy strip */}
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: save.tokens.total }).map((_, i) => (
            <span key={i} className={`text-lg transition-all ${i < (save.tokens.total - save.tokens.spent) ? 'opacity-100' : 'opacity-20'}`}>⚡</span>
          ))}
          <span className="text-xs text-gray-500 ml-1 font-medium">
            {save.tokens.total - save.tokens.spent} energy left
          </span>
        </div>
        <div className="text-xs text-gray-400">Day {save.dayNumber} · {save.weather === 'sunny' ? '☀️' : save.weather === 'cloudy' ? '⛅' : save.weather === 'rainy' ? '🌧️' : '⛈️'} {save.weather}</div>
      </div>

      {/* Location panel */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
        {/* Location tab selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {([
            { id: 'stand',    emoji: '🏪', label: 'Stand' },
            { id: 'tree',     emoji: '🌳', label: 'Tree' },
            { id: 'home',     emoji: '🏡', label: 'Home' },
            ...(save.worldUnlocks?.garden    ? [{ id: 'garden' as const,    emoji: '🌱', label: 'Garden' }] : []),
            ...(save.worldUnlocks?.pet       ? [{ id: 'pet' as const,       emoji: '🐶', label: save.pet?.name || 'Puppy' }] : []),
            ...(save.worldUnlocks?.treehouse ? [{ id: 'treehouse' as const, emoji: '🏠', label: 'Treehouse' }] : []),
            ...(save.worldUnlocks?.bicycle   ? [{ id: 'bike' as const,      emoji: '🚲', label: 'Bike' }] : []),
            ...(save.worldUnlocks?.bicycle   ? [{ id: 'pond' as const,      emoji: '🎣', label: 'Pond' }] : []),
            ...(save.worldUnlocks?.bicycle   ? [{ id: 'stand2' as const,    emoji: save.secondStand ? '🏪' : '🔒', label: 'Stand #2' }] : []),
            { id: 'grandpa',  emoji: '👴', label: 'Grandpa' },
            { id: 'tortoise', emoji: '🐢', label: 'Tortoise' },
            { id: 'buzzybee', emoji: '🐝', label: 'Buzzy' },
            { id: 'wisefox',  emoji: '🦊', label: 'Fox' },
          ] as const).map(loc => (
            <button
              key={loc.id}
              onClick={() => setActiveLocation(loc.id as GameLocation)}
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
            {activeLocation === 'garden' ? (
              <GardenPanel
                save={save}
                onPlant={handlePlantCrop}
                onHarvest={handleHarvestPlot}
                onSell={handleSellAtMarket}
              />
            ) : activeLocation === 'pet' ? (
              <PetPanel
                save={save}
                onFeed={handleFeedPet}
                onPlay={handlePlayWithPet}
                onNamePet={handleNamePet}
              />
            ) : activeLocation === 'treehouse' ? (
              <TreehousePanel
                save={save}
                onVisit={handleVisitTreehouse}
                onHangOut={handleHangOutTreehouse}
                onCatch={handleCatchButterfly}
                onBuyAddon={handleBuyAddon}
              />
            ) : activeLocation === 'grandpa' ? (
              <GrandpaPanel
                save={save}
                onLearnLesson={handleLearnLesson}
                onSimpleLearn={handleSimpleLearn}
                onClose={() => setActiveLocation('home')}
              />
            ) : activeLocation === 'bike' ? (
              <BikePanel
                save={save}
                onDelivery={handleDelivery}
                onRace={handleRace}
                onBuyUpgrade={handleBuyBikeUpgrade}
                onGoToPond={() => setActiveLocation('pond')}
              />
            ) : activeLocation === 'pond' ? (
              <PondPanel
                save={save}
                onFish={handleFish}
              />
            ) : activeLocation === 'stand2' ? (
              <SecondStandPanel
                save={save}
                onStock={handleStockSecondStand}
                onHireHelper={handleHireSecondStandHelper}
                onSetPrice={handleSetSecondStandPrice}
                onClaimReward={handleClaimSecondStand}
              />
            ) : (
              <LocationPanel
                location={activeLocation as unknown as 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox'}
                save={save}
                onBuySupplies={handleBuySupplies}
                onRunStand={handleRunStand}
                onHireHelper={handleHireHelper}
                onSetPrice={handleSetPrice}
                onBuyStandUpgrade={handleBuyStandUpgrade}
                onPlantTree={handlePlantTree}
                onHarvestTree={handleHarvestTree}
                onContribute={handleContribute}
                onWithdraw={handleWithdrawFromDream}
                onDepositPiggyBank={handleDepositPiggyBank}
                onWithdrawPiggyBank={handleWithdrawPiggyBank}
                onNextDay={handleNextDay}
              />
            )}
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
