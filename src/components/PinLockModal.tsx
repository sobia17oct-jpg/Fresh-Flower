import React, { useEffect, useState } from 'react';
import { Check, Delete, Lock, ShieldCheck, X } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  mode: 'verify' | 'set';
  title: string;
  subtitle?: string;
  expectedPin?: string;
  showDefaultHint?: boolean;
  onSuccess: (pin: string) => void;
  onClose: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  mode,
  title,
  subtitle,
  expectedPin,
  showDefaultHint = false,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (mode === 'verify' && expectedPin && next.length === expectedPin.length) {
      if (next === expectedPin) {
        onSuccess(next);
      } else {
        setError('Incorrect Admin PIN. Try again.');
        window.setTimeout(() => setPin(''), 250);
      }
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  const handleConfirm = () => {
    if (mode === 'set') {
      if (pin.length < 4) {
        setError('PIN must be 4 to 6 digits.');
        return;
      }
      onSuccess(pin);
      return;
    }

    if (pin === expectedPin) {
      onSuccess(pin);
    } else {
      setError('Incorrect Admin PIN. Try again.');
      setPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 border border-[#EFECE6]"
        style={{ boxShadow: '0 12px 36px rgba(46, 74, 62, 0.16)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F0EB] text-[#2E4A3E] flex items-center justify-center">
              {mode === 'set' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-[22px] font-semibold text-[#173328] leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#424844] mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PIN keypad"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-[#F4F0EB] text-[#222222]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Masked PIN Dots Display */}
        <div className="rounded-2xl bg-[#F4F0EB] py-4 px-5 mb-3 flex items-center justify-center gap-3 min-h-[60px]">
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < pin.length
                  ? 'bg-[#2E4A3E]'
                  : 'bg-[#DCD9D9]'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-xs font-semibold text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl text-center mb-3">
            {error}
          </p>
        ) : showDefaultHint && mode === 'verify' && expectedPin === '1234' ? (
          <p className="text-xs text-[#424844] text-center mb-3">
            Default Admin PIN is <span className="font-bold text-[#173328]">1234</span>
          </p>
        ) : (
          <div className="h-3 mb-2" />
        )}

        {/* 64px Touch Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-2xl bg-[#FAF8F5] text-2xl font-semibold text-[#222222] hover:bg-[#F4F0EB] active:bg-[#EAE4DC] active:scale-[0.97] transition-all tabular-nums"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-[#F4F0EB] text-sm font-bold text-[#8B4B58] hover:bg-[#EBE5DD] active:scale-[0.97] transition-all"
          >
            CLEAR
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-[#FAF8F5] text-2xl font-semibold text-[#222222] hover:bg-[#F4F0EB] active:bg-[#EAE4DC] active:scale-[0.97] transition-all tabular-nums"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace PIN"
            className="h-16 rounded-2xl bg-[#F4F0EB] flex items-center justify-center text-[#222222] hover:bg-[#EBE5DD] active:scale-[0.97] transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-base"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-[52px] rounded-xl bg-[#2E4A3E] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#22382F]"
          >
            <Check className="w-5 h-5" />
            <span>{mode === 'set' ? 'Save PIN' : 'Unlock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
