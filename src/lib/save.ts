import type { PlayerSave } from '@/types/game';

const SAVE_KEY = 'finmike_save';

export function loadSave(): PlayerSave | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerSave;
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
