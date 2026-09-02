import type { PlayerSave } from '@/types/game';
import { GRANDPA_LESSONS } from './defaults';

const SAVE_KEY = 'finmike_save';

export function loadSave(): PlayerSave | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const save = JSON.parse(raw) as any;

    // ---- World unlocks ----
    if (!save.worldUnlocks) save.worldUnlocks = { garden: false, pet: false, treehouse: false, bicycle: false };
    if (!save.worldUnlocks.bicycle) save.worldUnlocks.bicycle = false;

    // ---- Lemon trees ----
    if (!save.lemonTrees) save.lemonTrees = [];
    if (save.lemonadeStand.helperShiftsToday === undefined) save.lemonadeStand.helperShiftsToday = 0;
    if (save.lemonadeStand.hasUpgrade === undefined) save.lemonadeStand.hasUpgrade = false;

    // ---- Clean up old stand fields ----
    const stand = save.lemonadeStand;
    if (stand.helperCount !== undefined) delete stand.helperCount;
    if (stand.shiftsRunByHelpers !== undefined) delete stand.shiftsRunByHelpers;
    if (stand.helpersPaidToday !== undefined) delete stand.helpersPaidToday;

    // ---- Remove clock field from old saves ----
    if (save.tokens?.hoursElapsed !== undefined) delete save.tokens.hoursElapsed;

    // ---- Piggy Bank (new in v2) ----
    if (!save.piggyBank) {
      save.piggyBank = { balance: 0, interestEarnedToday: 0, totalInterestEarned: 0 };
    }

    // ---- Skill (new in v2) ----
    if (save.skill === undefined) save.skill = 0;

    // ---- Grandpa lessons (new in v2) ----
    if (!save.grandpaLessons) save.grandpaLessons = GRANDPA_LESSONS;

    // ---- Bike + Pond (initialized when bicycle unlocked) ----
    if (save.worldUnlocks?.bicycle && !save.bike) {
      save.bike = { upgrades: [], racesEntered: 0, racesWon: 0, lastRaceDay: 0, lastDeliveryDay: 0, deliveriesToday: 0, totalDeliveries: 0 };
    }
    if (save.bike && save.bike.totalDeliveries === undefined) save.bike.totalDeliveries = 0;
    if (save.worldUnlocks?.bicycle && !save.pond) {
      save.pond = { fishingTripsToday: 0, totalFishCaught: 0, collectibles: [], lastFishingDay: 0 };
    }

    // ---- secondStand: no migration needed (optional field, undefined = not unlocked) ----

    // ---- Life meters defaults ----
    if (!save.lifeMeters) {
      save.lifeMeters = { financialSecurity: 30, health: 80, happiness: 70, relationships: 60, futureSecurity: 20 };
    }
    if (save.lifeMeters.relationships === undefined) save.lifeMeters.relationships = 60;

    // ---- dreamGoal.unlocks — infer from goal id if missing (old saves) ----
    if (save.dreamGoal && !save.dreamGoal.unlocks) {
      const idMap: Record<string, string> = {
        garden: 'garden', puppy: 'pet', bicycle: 'bicycle', treehouse: 'treehouse',
      };
      save.dreamGoal.unlocks = idMap[save.dreamGoal.id] ?? save.dreamGoal.id;
    }

    // ---- lemonadeStand.totalEarned ----
    if (save.lemonadeStand.totalEarned === undefined) save.lemonadeStand.totalEarned = 0;

    // ---- grandpaChatsToday ----
    if (save.grandpaChatsToday === undefined) save.grandpaChatsToday = 0;

    // ---- avatarId — default for old saves ----
    if (!save.avatarId || save.avatarId === 'default') save.avatarId = 'girl1';

    return save as PlayerSave;
  } catch {
    return null;
  }
}

export function writeSave(save: PlayerSave): void {
  if (typeof window === 'undefined') return;
  save.lastPlayedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function deleteSave(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SAVE_KEY);
}
