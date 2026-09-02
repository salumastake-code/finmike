'use client';
import { useEffect, useState } from 'react';

interface Props {
  characterEmoji: string;
  onComplete: () => void;
  toStage?: number; // 1 or 2
}

export default function BridgeTransition({ characterEmoji, onComplete, toStage = 2 }: Props) {
  const [phase, setPhase] = useState<'walk' | 'pause' | 'fadeout'>('walk');

  useEffect(() => {
    // Walk across bridge: 2.8s
    const t1 = setTimeout(() => setPhase('pause'), 2800);
    // Show message briefly: 1.4s
    const t2 = setTimeout(() => setPhase('fadeout'), 4200);
    // Done: 0.6s fade
    const t3 = setTimeout(() => onComplete(), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const message = toStage === 2
    ? "A new part of town is just across the bridge..."
    : "Back to where it all started...";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #87CEEB 0%, #b8e4f9 40%, #c8f0a0 60%, #5a9e3a 100%)',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: phase === 'fadeout' ? 'opacity 0.6s ease-in-out' : 'none',
      }}
    >
      {/* Sky layer */}
      <div className="flex-1 relative flex items-end" style={{ minHeight: '45%' }}>
        {/* Sun */}
        <div className="absolute top-6 right-10 text-5xl" style={{ animation: 'float 3s ease-in-out infinite' }}>☀️</div>
        {/* Clouds */}
        <div className="absolute top-8 left-4 text-4xl opacity-80" style={{ animation: 'cloudDrift 8s linear infinite' }}>☁️</div>
        <div className="absolute top-14 left-1/3 text-3xl opacity-60" style={{ animation: 'cloudDrift 12s linear infinite 2s' }}>☁️</div>

        {/* Left side — Stage 1 town */}
        <div className="absolute bottom-0 left-0 flex items-end gap-1 pl-2 pb-1">
          <span className="text-4xl">🌳</span>
          <span className="text-3xl">🏪</span>
          <span className="text-4xl">🌳</span>
          <span className="text-2xl">🌱</span>
        </div>

        {/* Right side — Stage 2 town (fades in) */}
        <div className="absolute bottom-0 right-0 flex items-end gap-1 pr-2 pb-1"
          style={{ opacity: phase === 'walk' ? 0.3 : 1, transition: 'opacity 1s ease-in 1.5s' }}>
          <span className="text-2xl">🌳</span>
          <span className="text-3xl">🏘️</span>
          <span className="text-4xl">🌳</span>
          <span className="text-3xl">🥖</span>
        </div>
      </div>

      {/* Bridge + character layer */}
      <div className="relative" style={{ height: '120px' }}>
        {/* Bridge structure */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: '56px' }}>
          {/* Railing posts */}
          <div className="flex justify-around items-end px-4 absolute inset-x-0 top-0" style={{ height: '28px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-full bg-amber-700" style={{ width: '6px', height: '24px' }} />
            ))}
          </div>
          {/* Top rail */}
          <div className="absolute inset-x-0 rounded-full bg-amber-600" style={{ top: '3px', height: '5px', margin: '0 12px' }} />
          {/* Bridge deck */}
          <div className="absolute inset-x-0 bottom-0" style={{ height: '24px', background: 'repeating-linear-gradient(90deg, #92400e 0px, #92400e 28px, #78350f 28px, #78350f 32px)' }} />
        </div>

        {/* Walking character */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            bottom: '52px',
            left: phase === 'walk' ? '-60px' : '50%',
            transform: phase === 'walk' ? 'translateX(0)' : 'translateX(-50%)',
            transition: phase === 'walk'
              ? 'left 2.8s cubic-bezier(0.45, 0, 0.55, 1)'
              : 'none',
            animation: phase === 'walk' ? 'walkBounce 0.4s ease-in-out infinite' : 'none',
          }}
        >
          <span style={{ fontSize: '2.2rem', display: 'block' }}>{characterEmoji}</span>
        </div>
      </div>

      {/* River */}
      <div className="relative overflow-hidden" style={{ height: '48px', background: 'linear-gradient(to bottom, #38bdf8, #0ea5e9)' }}>
        {/* Animated ripples */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-2xl opacity-60 flex-shrink-0"
              style={{ animation: `riverFlow 3s linear infinite`, animationDelay: `${i * -0.4}s`, marginLeft: i === 0 ? '0' : '12.5%' }}>
              〰️
            </div>
          ))}
        </div>
        {/* Fish */}
        <div className="absolute text-xl" style={{ bottom: '8px', animation: 'fishSwim 4s linear infinite', left: '-40px' }}>🐟</div>
      </div>

      {/* Ground */}
      <div style={{ height: '32px', background: 'linear-gradient(to bottom, #5a9e3a, #4a7c2e)' }} />

      {/* Caption */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg text-center"
          style={{
            opacity: phase === 'pause' ? 1 : 0,
            transform: phase === 'pause' ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(8px)',
            transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
            marginTop: '-60px',
          }}
        >
          <div className="text-base font-bold text-gray-800">{message}</div>
          {toStage === 2 && <div className="text-xs text-green-600 font-medium mt-1">🎉 Stage 2 Unlocked!</div>}
        </div>
      </div>

      <style>{`
        @keyframes walkBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes cloudDrift {
          from { transform: translateX(-20px); }
          to   { transform: translateX(120vw); }
        }
        @keyframes riverFlow {
          from { transform: translateX(0vw); }
          to   { transform: translateX(200vw); }
        }
        @keyframes fishSwim {
          from { left: -40px; }
          to   { left: 110vw; }
        }
      `}</style>
    </div>
  );
}
