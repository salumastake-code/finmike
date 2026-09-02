'use client';
import type { PlayerSave } from '@/types/game';

type GameLocation = 'stand' | 'tree' | 'home' | 'tortoise' | 'buzzybee' | 'wisefox' | 'garden' | 'pet' | 'treehouse' | 'grandpa' | 'bike' | 'pond' | 'stand2' | 'bakery' | 'employees' | 'dogwalking' | 'townbank' | 'townpark';

interface Props {
  save: PlayerSave;
  activeLocation: GameLocation | null;
  onSelectLocation: (loc: GameLocation) => void;
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

  // When Stage 2 is active, compress Stage 1 tiles into the top half so Stage 2
  // tiles have room in the bottom half. Map is 28rem tall with Stage 2.
  const s2 = save.worldUnlocks?.stage2;

  const locations: Array<{
    id: GameLocation;
    emoji: string;
    label: string;
    x: number; // % from left
    y: number; // % from top
    badge?: string;
  }> = [
    // Row 1 — top
    { id: 'tortoise',  emoji: '🐢', label: 'Old Tortoise', x: 14, y: s2 ? 9  : 22 },
    { id: 'home',      emoji: '🏡', label: 'Your Home',    x: 50, y: s2 ? 6  : 14 },
    { id: 'wisefox',   emoji: '🦊', label: 'Wise Fox',     x: 78, y: s2 ? 10 : 24 },
    // Row 2 — middle
    { id: 'tree',      emoji: treeEmoji, label: 'Lemon Tree', x: 20, y: s2 ? 26 : 65,
      badge: save.lemonTree.planted && save.lemonTree.daysOld >= save.lemonTree.matureAt ? '!' : undefined },
    { id: 'stand',     emoji: '🏪', label: 'Your Stand',   x: 52, y: s2 ? 28 : 68,
      badge: save.lemonadeStand.supplyCount === 0 ? '!' : undefined },
    { id: 'buzzybee',  emoji: '🐝', label: 'Buzzy Bee',    x: 80, y: s2 ? 24 : 62 },
    // Unlockable Stage 1 locations
    ...(save.worldUnlocks?.garden ? [{
      id: 'garden' as GameLocation, emoji: '🌱', label: 'Garden',
      x: 8, y: s2 ? 18 : 50,
      badge: save.garden?.plots.some(p => !p.harvested && !p.damaged && (save.dayNumber - p.plantedDay) >= p.matureAt) ? '!' : undefined,
    }] : []),
    ...(save.worldUnlocks?.pet ? [{
      id: 'pet' as GameLocation, emoji: '🐶', label: save.pet?.name || 'Puppy',
      x: 50, y: s2 ? 17 : 42,
      badge: save.pet && (!save.pet.fed || !save.pet.played) ? '!' : undefined,
    }] : []),
    ...(save.worldUnlocks?.treehouse ? [{
      id: 'treehouse' as GameLocation, emoji: '🏠', label: 'Treehouse',
      x: 88, y: s2 ? 16 : 38,
    }] : []),
    ...(save.worldUnlocks?.bicycle ? [{
      id: 'bike' as GameLocation, emoji: '🚲', label: 'Bike',
      x: 30, y: s2 ? 36 : 85,
    }] : []),
    ...(save.worldUnlocks?.bicycle ? [{
      id: 'pond' as GameLocation, emoji: '🎣', label: 'Pond',
      x: 65, y: s2 ? 36 : 85,
      badge: save.pond && save.pond.collectibles.length === 5 && !save.secondStand ? '!' : undefined,
    }] : []),
    ...(save.worldUnlocks?.bicycle ? [{
      id: 'stand2' as GameLocation,
      emoji: save.secondStand ? '🏪' : '🔒',
      label: 'Stand #2',
      x: 88, y: s2 ? 28 : 68,
      badge: save.secondStand && (!save.secondStand.helperHiredToday || save.secondStand.supplyCount === 0) ? '!' : undefined,
    }] : []),
    // Stage 2 locations — bottom half of map (below bridge at ~47%)
    ...(s2 ? [
      { id: 'bakery'    as GameLocation, emoji: '🥖', label: 'Bakery',     x: 18, y: 62,
        badge: save.bakery?.competitorActive && !save.bakery.competitorResponseChosen ? '!' : undefined },
      { id: 'dogwalking' as GameLocation, emoji: '🐕', label: 'Dog Walking', x: 50, y: 60 },
      { id: 'townbank'  as GameLocation, emoji: '🏦', label: 'Town Bank',  x: 82, y: 62,
        badge: save.townBank?.loan && save.townBank.loan.missedPayments > 0 ? '!' : undefined },
      { id: 'employees' as GameLocation, emoji: '👥', label: 'Employees',  x: 30, y: 80 },
      { id: 'townpark'  as GameLocation, emoji: save.townPark?.built ? '🌳' : '🔨', label: 'Town Park', x: 68, y: 80 },
    ] : []),
  ];

  return (
    <div className={`relative w-full bg-gradient-to-b ${WEATHER_BG[weather] || WEATHER_BG.sunny} overflow-hidden`} style={{ height: s2 ? '28rem' : save.worldUnlocks?.bicycle ? '17rem' : '14rem' }}>

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

      {/* Stage 2 bridge divider — sits at ~44% of 28rem = ~123px */}
      {s2 && (
        <div className="absolute w-full pointer-events-none" style={{ top: '43%' }}>
          <div className="flex items-center gap-0 mx-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex-1 h-3 rounded-sm bg-amber-700 mx-px opacity-80" />
            ))}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white/80 rounded-full px-2 py-0.5 text-xs font-bold text-gray-600 whitespace-nowrap">
            🌉 Stage 2 Town
          </div>
        </div>
      )}

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
