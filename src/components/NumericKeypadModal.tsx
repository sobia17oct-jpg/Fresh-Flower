import React, { useEffect, useState } from 'react';
import { Delete, X, Check } from 'lucide-react';

interface NumericKeypadModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  initialValue: number;
  unitPrefix?: string;
  unitSuffix?: string;
  allowDecimal?: boolean;
  maxValue?: number;
  quickPresets?: { label: string; value: number }[];
  onConfirm: (value: number) => void;
  onClose: () => void;
}

export const NumericKeypadModal: React.FC<NumericKeypadModalProps> = ({
  isOpen,
  title,
  subtitle,
  initialValue,
  unitPrefix,
  unitSuffix,
  allowDecimal = false,
  maxValue,
  quickPresets,
  onConfirm,
  onClose,
}) => {
  const [display, setDisplay] = useState<string>('0');
  const [hasTyped, setHasTyped] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDisplay(initialValue > 0 ? String(initialValue) : '0');
      setHasTyped(false);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (digit === '.' && !allowDecimal) return;

    let next = display;
    if (!hasTyped) {
      next = digit === '.' ? '0.' : digit;
      setHasTyped(true);
    } else {
      if (digit === '.' && display.includes('.')) return;
      if (display === '0' && digit !== '.') {
        next = digit;
      } else {
        if (display.length >= 10) return;
        next = display + digit;
      }
    }

    const numeric = Number(next);
    if (maxValue !== undefined && Number.isFinite(numeric) && numeric > maxValue) {
      setDisplay(String(maxValue));
      return;
    }
    setDisplay(next);
  };

  const handleBackspace = () => {
    setHasTyped(true);
    if (display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleClear = () => {
    setHasTyped(true);
    setDisplay('0');
  };

  const handleConfirm = () => {
    const parsed = Number(display);
    const safe = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    onConfirm(maxValue !== undefined ? Math.min(safe, maxValue) : safe);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keypad-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 border border-[#EFECE6]"
        style={{ boxShadow: '0 12px 36px rgba(46, 74, 62, 0.14)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2
              id="keypad-modal-title"
              className="font-serif text-[22px] font-semibold text-[#173328] leading-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#424844] mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keypad"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-[#F4F0EB] text-[#222222] hover:bg-[#EAE5DD] active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display readout */}
        <div className="mb-4 rounded-2xl bg-[#F4F0EB] px-5 py-4 flex items-baseline justify-between border border-[#EFECE6]">
          <span className="text-base font-medium text-[#424844]">
            {unitPrefix || ''}
          </span>
          <span className="text-[32px] font-bold tracking-tight text-[#173328] tabular-nums">
            {display}
            {unitSuffix ? (
              <span className="ml-1 text-xl font-semibold text-[#424844]">
                {unitSuffix}
              </span>
            ) : null}
          </span>
        </div>

        {/* Optional Quick Presets */}
        {quickPresets && quickPresets.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setDisplay(String(preset.value));
                  setHasTyped(true);
                }}
                className="min-h-[48px] px-2 rounded-xl bg-[#D88C9A]/15 text-[#2E4A3E] font-semibold text-sm hover:bg-[#D88C9A]/25 active:scale-95 transition-transform tabular-nums whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* 64px Touch Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleDigit(key)}
              className="h-16 rounded-2xl bg-[#FAF8F5] text-2xl font-semibold text-[#222222] hover:bg-[#F4F0EB] active:bg-[#EAE4DC] active:scale-[0.97] transition-all tabular-nums"
            >
              {key}
            </button>
          ))}

          {allowDecimal ? (
            <button
              type="button"
              onClick={() => handleDigit('.')}
              className="h-16 rounded-2xl bg-[#FAF8F5] text-2xl font-semibold text-[#222222] hover:bg-[#F4F0EB] active:bg-[#EAE4DC] active:scale-[0.97] transition-all"
            >
              .
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="h-16 rounded-2xl bg-[#F4F0EB] text-sm font-bold text-[#8B4B58] hover:bg-[#EBE5DD] active:scale-[0.97] transition-all"
            >
              CLEAR
            </button>
          )}

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
            aria-label="Backspace"
            className="h-16 rounded-2xl bg-[#F4F0EB] flex items-center justify-center text-[#222222] hover:bg-[#EBE5DD] active:scale-[0.97] transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Action Footer */}
        <div className="grid grid-cols-2 gap-3">
          {allowDecimal ? (
            <button
              type="button"
              onClick={handleClear}
              className="min-h-[54px] rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-base hover:bg-[#F4F0EB] active:scale-[0.98] transition-all"
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[54px] rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-base hover:bg-[#F4F0EB] active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-[54px] rounded-xl bg-[#2E4A3E] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#22382F] active:scale-[0.98] transition-all"
          >
            <Check className="w-5 h-5" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
