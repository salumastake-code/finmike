'use client';
import type { Weather, Season } from '@/types/game';

interface Props {
  weather: Weather;
  season: Season;
  day: number;
}

const WEATHER_CONFIG: Record<Weather, { emoji: string; label: string; bg: string }> = {
  sunny:  { emoji: '☀️', label: 'Sunny',  bg: 'bg-yellow-100 border-yellow-300' },
  cloudy: { emoji: '⛅', label: 'Cloudy', bg: 'bg-gray-100 border-gray-300' },
  rainy:  { emoji: '🌧️', label: 'Rainy',  bg: 'bg-blue-100 border-blue-300' },
  stormy: { emoji: '⛈️', label: 'Stormy', bg: 'bg-slate-200 border-slate-400' },
};

const SEASON_EMOJI: Record<Season, string> = {
  spring: '🌸', summer: '🌻', fall: '🍂', winter: '❄️',
};

export default function WeatherBadge({ weather, season, day }: Props) {
  const { emoji, label, bg } = WEATHER_CONFIG[weather];
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${bg}`}>
      <span className="text-xl">{emoji}</span>
      <div>
        <div className="text-sm font-bold text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{SEASON_EMOJI[season]} Day {day}</div>
      </div>
    </div>
  );
}
