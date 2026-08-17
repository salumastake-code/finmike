'use client';
import { useState, useEffect, useRef } from 'react';
import type { PlayerSave } from '@/types/game';
import { encodeWorldCode, decodeWorldCode, worldDisplayName } from '@/lib/worldcode';

interface Props {
  save: PlayerSave;
  onClose: () => void;
  onLoad: (save: PlayerSave) => void;
  onReset: () => void;
}

type Tab = 'save' | 'load' | 'settings';

// Draw QR code on a canvas using a simple data-URL approach via an img tag
// This avoids react-qr-code's SSR/loading issues on mobile
function QRImage({ value, size }: { value: string; size: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // Use the free QR API — fast, no keys needed
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=png&margin=4`;
    setSrc(url);
  }, [value, size]);

  if (!src) return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center bg-gray-50 rounded-xl">
      <div className="text-gray-300 text-sm">Loading QR…</div>
    </div>
  );

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="World Code QR" width={size} height={size} className="rounded-xl" />;
}

export default function WorldCodeModal({ save, onClose, onLoad, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('save');
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadSuccess, setLoadSuccess] = useState(false);

  const code = encodeWorldCode(save);
  const displayName = worldDisplayName(save);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: select the text
      const el = document.getElementById('world-code-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    });
  }

  function handleLoad() {
    setLoadError('');
    setLoadSuccess(false);
    const loaded = decodeWorldCode(inputCode);
    if (!loaded) {
      setLoadError("That code doesn't look right. Check for typos and try again.");
      return;
    }
    setLoadSuccess(true);
    setTimeout(() => { onLoad(loaded); onClose(); }, 1000);
  }

  return (
    // Full-screen backdrop
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header — fixed at top of sheet */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <div className="font-bold text-gray-800 text-base">🗺️ World Code</div>
            <div className="text-xs text-gray-400">Take your world anywhere</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 pb-2">
          {([
            { id: 'save', label: '📤 Save', active: 'bg-green-500' },
            { id: 'load', label: '📥 Load', active: 'bg-indigo-500' },
            { id: 'settings', label: '⚙️ More', active: 'bg-gray-600' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${tab === t.id ? `${t.active} text-white` : 'bg-gray-100 text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-4 pt-2">

          {/* ---- SAVE TAB ---- */}
          {tab === 'save' && (
            <>
              <p className="text-sm text-gray-500 text-center">Scan on another device, or copy the code.</p>

              {/* QR Code */}
              <div className="flex justify-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <QRImage value={code} size={180} />
              </div>

              <div className="text-center text-xs text-gray-400 font-medium">{displayName}</div>

              {/* Copy button — BIG and obvious */}
              <button
                onClick={handleCopy}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-colors shadow-sm ${
                  copied ? 'bg-green-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {copied ? '✅ Copied to clipboard!' : '📋 Copy World Code'}
              </button>

              {/* Code — scrollable box, tap to select all */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1 font-medium">Your World Code (tap to select)</div>
                <div
                  id="world-code-text"
                  className="font-mono text-xs text-gray-600 break-all leading-relaxed select-all cursor-text"
                  onClick={handleCopy}
                >
                  {code}
                </div>
              </div>

              <p className="text-xs text-center text-gray-400">Keep this code safe — it's the key to your world!</p>
            </>
          )}

          {/* ---- LOAD TAB ---- */}
          {tab === 'load' && (
            <>
              <p className="text-sm text-gray-500">Paste your World Code below to restore progress on this device.</p>

              <textarea
                value={inputCode}
                onChange={e => { setInputCode(e.target.value); setLoadError(''); }}
                placeholder="Paste your World Code here…"
                className="w-full border-2 border-gray-200 rounded-xl p-3 font-mono text-xs h-32 resize-none focus:outline-none focus:border-indigo-400"
              />

              {loadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">❌ {loadError}</div>
              )}
              {loadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">✅ World found! Loading…</div>
              )}

              <button
                onClick={handleLoad}
                disabled={!inputCode.trim() || loadSuccess}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors"
              >
                🚀 Load This World
              </button>

              <p className="text-xs text-center text-gray-400">⚠️ This will replace your current save on this device.</p>
            </>
          )}

          {/* ---- SETTINGS TAB ---- */}
          {tab === 'settings' && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <div className="font-bold text-gray-800 text-base">{save.playerName}'s World</div>
                <div>Day {save.dayNumber} · 💵 {save.coins} · {save.stage} stage</div>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Danger Zone</div>
                <button
                  onClick={() => {
                    if (confirm('Start over? This will erase all your progress.')) {
                      onReset();
                      onClose();
                    }
                  }}
                  className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-2xl text-sm transition-colors"
                >
                  🗑️ Reset World — Start Over
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Save your World Code first if you want to come back to this save.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
