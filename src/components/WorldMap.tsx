'use client';
import type { PlayerSave } from '@/types/game';

type Location = 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox';

interface Props {
  save: PlayerSave;
  activeLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
  weather: PlayerSave['weather'];
}

const WEATHER_BG: Record<string, string> = {
  sunny:  'from-sky-300 to-green-300',
  cloudy: 'from-gray-300 to-green-200',
  rainy:  'from-blue-400 to-teal-300',
  stormy: 'from-slate-500 to-slate-400',
};

const WEATHER_OVERLAY: Record<string, string> = {
  sunny:  '',
  cloudy: 'bg-white/10',
  rainy:  'bg-blue-400/20',
  stormy: 'bg-slate-600/40',
};

export default function WorldMap({ save, activeLocation, onSelectLocation, weather }: Props) {
  // Use text for unplanted tree — 🟫 renders as a brown box on iOS
  const treeEmoji = !save.lemonTree.planted ? '🪵' :
    save.lemonTree.daysOld >= save.lemonTree.matureAt ? '🌳' : '🌱';

  const locations: Array<{
    id: Location;
    emoji: string;
    label: string;
    x: number; // % from left
    y: number; // % from top
    badge?: string;
  }> = [
    // Row 1 — top (spread wider, pushed down so they're not cut off)
    { id: 'tortoise',  emoji: '🐢', label: 'Old Tortoise', x: 14, y: 22 },
    { id: 'home',      emoji: '🏡', label: 'Your Home',    x: 50, y: 14 },
    { id: 'wisefox',   emoji: '🦊', label: 'Wise Fox',     x: 78, y: 24 },
    // Row 2 — bottom (pulled in from edges so nothing clips)
    { id: 'tree',      emoji: treeEmoji, label: 'Lemon Tree', x: 20, y: 65,
      badge: save.lemonTree.planted && save.lemonTree.daysOld >= save.lemonTree.matureAt ? '!' : undefined },
    { id: 'stand',     emoji: '🏪', label: 'Your Stand',   x: 52, y: 68,
      badge: save.lemonadeStand.supplyCount === 0 ? '!' : undefined },
    { id: 'buzzybee',  emoji: '🐝', label: 'Buzzy Bee',    x: 80, y: 62 },
  ];

  return (
    <div className={`relative w-full h-56 bg-gradient-to-b ${WEATHER_BG[weather] || WEATHER_BG.sunny} overflow-hidden`}>

      {/* Animated weather overlay */}
      {weather !== 'sunny' && (
        <div className={`absolute inset-0 ${WEATHER_OVERLAY[weather]} pointer-events-none`} />
      )}
      {weather === 'rainy' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl animate-bounce pointer-events-none">🌧️</div>
      )}
      {weather === 'stormy' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl animate-pulse pointer-events-none">⛈️</div>
      )}

      {/* Path lines between locations (decorative) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
        {/* Tortoise → Home */}
        <line x1="14%" y1="22%" x2="50%" y2="14%" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
        {/* Home → Wise Fox */}
        <line x1="50%" y1="14%" x2="78%" y2="24%" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
        {/* Home → Stand */}
        <line x1="50%" y1="14%" x2="52%" y2="68%" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
        {/* Tree → Stand */}
        <line x1="20%" y1="65%" x2="52%" y2="68%" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
        {/* Stand → Buzzybee */}
        <line x1="52%" y1="68%" x2="80%" y2="62%" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
      </svg>

      {/* Location tiles */}
      {locations.map(loc => (
        <button
          key={loc.id}
          onClick={() => onSelectLocation(loc.id)}
          style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: 'translate(-50%, -50%)' }}
          className={`absolute flex flex-col items-center group transition-transform hover:scale-110 active:scale-95 ${
            activeLocation === loc.id ? 'scale-110' : ''
          }`}
        >
          {/* Notification badge */}
          {loc.badge && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center z-10 animate-pulse">
              !
            </div>
          )}

          {/* Emoji tile */}
          <div className={`text-4xl drop-shadow-md transition-all ${
            activeLocation === loc.id
              ? 'filter drop-shadow-lg scale-110'
              : ''
          }`}>
            {loc.emoji}
          </div>

          {/* Label */}
          <div className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors whitespace-nowrap ${
            activeLocation === loc.id
              ? 'bg-white/90 text-gray-800 shadow ring-2 ring-white'
              : 'bg-black/25 text-white'
          }`}>
            {loc.label}
          </div>
        </button>
      ))}
    </div>
  );
}
