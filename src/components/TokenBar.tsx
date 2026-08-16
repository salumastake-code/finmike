'use client';
import type { ActivityTokens } from '@/types/game';

interface Props {
  tokens: ActivityTokens;
}

export default function TokenBar({ tokens }: Props) {
  const remaining = tokens.total - tokens.spent;

  return (
    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
      <span className="text-sm font-bold text-indigo-700">⚡ Activity Tokens</span>
      <div className="flex gap-1 ml-auto">
        {Array.from({ length: tokens.total }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              i < remaining
                ? 'bg-indigo-400 border-indigo-600'
                : 'bg-gray-200 border-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-indigo-500 ml-1">{remaining} left</span>
    </div>
  );
}
