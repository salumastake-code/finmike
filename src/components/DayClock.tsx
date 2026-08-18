'use client';
import type { ActivityTokens } from '@/types/game';

interface Props {
  tokens: ActivityTokens;
  weather: string;
}

// Day runs 7am → 9pm = 14 hours
// Each token = 14/6 ≈ 2.33 hours
const DAY_START = 7;   // 7am
const DAY_END   = 21;  // 9pm
const HOURS     = DAY_END - DAY_START; // 14

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const mins = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return mins === 0 ? `${display}${ampm}` : `${display}:${String(mins).padStart(2, '0')}${ampm}`;
}

const SKY_COLORS: Record<string, string> = {
  sunny:  'from-sky-300 via-sky-200 to-amber-100',
  cloudy: 'from-slate-300 via-slate-200 to-gray-100',
  rainy:  'from-blue-400 via-blue-300 to-slate-200',
  stormy: 'from-slate-600 via-slate-500 to-slate-400',
};

export default function DayClock({ tokens, weather }: Props) {
  const spent = tokens.spent;
  const total = tokens.total;
  const remaining = total - spent;

  // Current hour in the day
  const hoursPerToken = HOURS / total;
  const currentHour = DAY_START + spent * hoursPerToken;
  const timeStr = formatTime(currentHour);

  // Sun position as % across the arc (0% = left/morning, 100% = right/evening)
  const sunPct = (spent / total) * 100;

  // Bedtime warning
  const isBedtime = remaining <= 1;
  const isAlmostBedtime = remaining === 2;

  // Sun emoji changes with weather + time of day
  const sunEmoji = weather === 'stormy' ? '⛈️' :
                   weather === 'rainy'  ? '🌧️' :
                   weather === 'cloudy' ? '⛅' :
                   spent >= total - 1   ? '🌅' : '☀️';

  return (
    <div className={`w-full rounded-2xl overflow-hidden border ${isBedtime ? 'border-indigo-300' : 'border-sky-200'}`}>
      {/* Sky gradient background */}
      <div className={`bg-gradient-to-r ${SKY_COLORS[weather] || SKY_COLORS.sunny} px-3 pt-2 pb-1`}>

        {/* Time label row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-sky-900/70">7am</span>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold ${isBedtime ? 'text-indigo-700' : 'text-sky-800'}`}>
              {isBedtime ? '🌙 Bedtime soon!' : isAlmostBedtime ? `🌆 ${timeStr}` : `☀️ ${timeStr}`}
            </span>
          </div>
          <span className="text-xs font-bold text-sky-900/70">9pm</span>
        </div>

        {/* Sun arc track */}
        <div className="relative h-8 mx-1">
          {/* Arc path (visual only) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path
              d="M 2 28 Q 50 2 98 28"
              fill="none"
              stroke="white"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </svg>

          {/* Sun emoji — positioned along the arc using parabola */}
          {(() => {
            // parabola: x goes 0→100, y = 28 - 26*sin(π*t) where t = pct/100
            const t = sunPct / 100;
            const x = sunPct; // left %
            const y = 28 - 26 * Math.sin(Math.PI * t); // arc height in viewBox units (0–32)
            const yPct = (y / 32) * 100;
            return (
              <div
                className="absolute text-xl leading-none transition-all duration-500"
                style={{
                  left: `${x}%`,
                  top: `${yPct}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: weather === 'sunny' && spent < total - 1 ? 'drop-shadow(0 0 4px rgba(255,200,0,0.8))' : undefined,
                }}
              >
                {sunEmoji}
              </div>
            );
          })()}
        </div>

        {/* Token dots row */}
        <div className="flex items-center justify-center gap-1 pb-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-1.5 rounded-full transition-all ${
                i < remaining
                  ? weather === 'stormy' ? 'bg-slate-400' : 'bg-amber-400'
                  : 'bg-black/15'
              }`}
            />
          ))}
          <span className={`text-xs font-bold ml-1.5 ${isBedtime ? 'text-indigo-700' : 'text-sky-900/60'}`}>
            {remaining} {remaining === 1 ? 'shift' : 'shifts'} left
          </span>
        </div>
      </div>

      {/* Bedtime banner */}
      {isBedtime && (
        <div className="bg-indigo-100 text-indigo-700 text-xs font-bold text-center py-1 px-2 flex items-center justify-center gap-1">
          🌙 Head home to sleep and start a new day!
        </div>
      )}
    </div>
  );
}
