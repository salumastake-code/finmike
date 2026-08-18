import type { PlayerSave } from '@/types/game';

const SAVE_KEY = 'finmike_save';

export function loadSave(): PlayerSave | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as PlayerSave;
    // Migrate old saves missing fields
    if (!save.worldUnlocks) {
      save.worldUnlocks = { garden: false, pet: false, treehouse: false, bicycle: false };
    }
    if (!save.worldUnlocks.bicycle) save.worldUnlocks.bicycle = false;
    if (!save.lemonTrees) save.lemonTrees = [];
    if (!save.lemonadeStand.helpersPaidToday) save.lemonadeStand.helpersPaidToday = false;
    if (save.lemonadeStand.shiftsRunByHelpers === undefined) save.lemonadeStand.shiftsRunByHelpers = 0;
    return save;
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
