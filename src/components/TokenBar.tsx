'use client';
import type { ActivityTokens } from '@/types/game';

interface Props {
  tokens: ActivityTokens;
}

export default function TokenBar({ tokens }: Props) {
  const remaining = tokens.total - tokens.spent;

  return (
    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
      <span className="text-sm font-bold text-indigo-700">⚡ Energy</span>
      <div className="flex gap-0.5 ml-auto">
        {Array.from({ length: tokens.total }).map((_, i) => (
          <span
            key={i}
            className={`text-lg leading-none transition-all ${
              i < remaining ? 'opacity-100' : 'opacity-20'
            }`}
          >
            ⚡
          </span>
        ))}
      </div>
      <span className="text-xs text-indigo-500 ml-1">{remaining} left</span>
    </div>
  );
}
