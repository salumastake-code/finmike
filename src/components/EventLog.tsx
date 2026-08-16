'use client';

export interface LogEntry {
  id: string;
  emoji: string;
  text: string;
  type: 'good' | 'bad' | 'neutral' | 'event';
}

interface Props {
  entries: LogEntry[];
}

const TYPE_STYLES: Record<LogEntry['type'], string> = {
  good:    'bg-green-50 border-green-200 text-green-800',
  bad:     'bg-red-50 border-red-200 text-red-800',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
  event:   'bg-indigo-50 border-indigo-200 text-indigo-800',
};

export default function EventLog({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">What happened</div>
      {entries.map(entry => (
        <div
          key={entry.id}
          className={`flex items-start gap-2 p-2 rounded-xl border text-sm ${TYPE_STYLES[entry.type]}`}
        >
          <span className="text-base shrink-0">{entry.emoji}</span>
          <span>{entry.text}</span>
        </div>
      ))}
    </div>
  );
}
