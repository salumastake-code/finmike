import pako from 'pako';
import type { PlayerSave } from '@/types/game';

// ============================================================
// World Code — encode/decode save state without a backend
// Compress JSON → Uint8Array → base64 → URL-safe string
// ============================================================

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeWorldCode(save: PlayerSave): string {
  const json = JSON.stringify(save);
  const compressed = pako.deflate(json);
  return toBase64(compressed);
}

export function decodeWorldCode(code: string): PlayerSave | null {
  try {
    const trimmed = code.trim();
    const bytes = fromBase64(trimmed);
    const inflated = pako.inflate(bytes);
    const json = new TextDecoder().decode(inflated);
    return JSON.parse(json) as PlayerSave;
  } catch {
    return null;
  }
}

// Generate a short friendly display name for the world
// shown alongside the code so kids can identify their save
export function worldDisplayName(save: PlayerSave): string {
  return `${save.playerName}'s World · Day ${save.dayNumber}`;
}
