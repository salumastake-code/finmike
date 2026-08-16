'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import type { PlayerSave } from '@/types/game';
import { encodeWorldCode, decodeWorldCode, worldDisplayName } from '@/lib/worldcode';

interface Props {
  save: PlayerSave;
  onClose: () => void;
  onLoad: (save: PlayerSave) => void;
}

type Tab = 'save' | 'load';

export default function WorldCodeModal({ save, onClose, onLoad }: Props) {
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
    setTimeout(() => {
      onLoad(loaded);
      onClose();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-gray-800 text-lg">🗺️ World Code</div>
            <div className="text-xs text-gray-400">Take your world anywhere</div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('save')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'save' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            📤 Save My World
          </button>
          <button
            onClick={() => setTab('load')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'load' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            📥 Load a World
          </button>
        </div>

        {tab === 'save' && (
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500 mb-2">
              Scan this on another device, or copy the code below.
            </div>

            {/* QR Code */}
            <div className="flex justify-center bg-white p-3 rounded-2xl border border-gray-100">
              <QRCode value={code} size={180} />
            </div>

            {/* World name */}
            <div className="text-center text-xs font-medium text-gray-500">{displayName}</div>

            {/* Code display */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1 font-medium">Your World Code</div>
              <div className="font-mono text-xs text-gray-700 break-all leading-relaxed select-all">
                {code}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                copied ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy Code'}
            </button>

            <p className="text-xs text-center text-gray-400">
              Keep this code safe — it's the key to your world!
            </p>
          </div>
        )}

        {tab === 'load' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Paste your World Code below to restore your progress on this device.
            </div>

            <textarea
              value={inputCode}
              onChange={e => { setInputCode(e.target.value); setLoadError(''); }}
              placeholder="Paste your World Code here…"
              className="w-full border-2 border-gray-200 rounded-xl p-3 font-mono text-xs h-28 resize-none focus:outline-none focus:border-indigo-400"
            />

            {loadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                ❌ {loadError}
              </div>
            )}

            {loadSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                ✅ World found! Loading…
              </div>
            )}

            <button
              onClick={handleLoad}
              disabled={!inputCode.trim() || loadSuccess}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              🚀 Load This World
            </button>

            <p className="text-xs text-center text-gray-400">
              ⚠️ This will replace your current save on this device.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
