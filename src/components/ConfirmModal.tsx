import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 border border-[#EFECE6]"
        style={{ boxShadow: '0 12px 36px rgba(46, 74, 62, 0.14)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                destructive
                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                  : 'bg-[#F4F0EB] text-[#2E4A3E]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-[20px] font-semibold text-[#173328]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-[#F4F0EB] text-[#222222]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[15px] text-[#424844] leading-relaxed mb-6">{message}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[52px] rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-base hover:bg-[#F4F0EB]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[52px] rounded-xl font-semibold text-base text-white active:scale-[0.98] transition-all ${
              destructive
                ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
                : 'bg-[#2E4A3E] hover:bg-[#22382F]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
