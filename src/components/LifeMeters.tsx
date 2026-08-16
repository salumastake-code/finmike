'use client';
import type { LifeMeters as LifeMetersType } from '@/types/game';

interface Props {
  meters: LifeMetersType;
}

const METER_CONFIG = [
  { key: 'financialSecurity', label: 'Money',      emoji: '💰', color: 'bg-green-400' },
  { key: 'health',            label: 'Health',     emoji: '❤️', color: 'bg-red-400' },
  { key: 'happiness',         label: 'Happy',      emoji: '😊', color: 'bg-yellow-400' },
  { key: 'relationships',     label: 'Friends',    emoji: '👫', color: 'bg-pink-400' },
  { key: 'futureSecurity',    label: 'Future',     emoji: '🌟', color: 'bg-purple-400' },
] as const;

export default function LifeMeters({ meters }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Life</div>
      <div className="space-y-2">
        {METER_CONFIG.map(({ key, label, emoji, color }) => {
          const value = meters[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-base w-6 text-center">{emoji}</span>
              <span className="text-xs text-gray-600 w-12">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div
                  className={`${color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
