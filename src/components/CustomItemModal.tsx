import React, { useEffect, useState } from 'react';
import { Calculator, Flower2, Plus, X } from 'lucide-react';
import { NumericKeypadModal } from './NumericKeypadModal';
import { formatPKR } from '../data/initialData';

interface CustomItemModalProps {
  isOpen: boolean;
  onAddCustomItem: (name: string, variant: string, price: number) => void;
  onClose: () => void;
}

const QUICK_CUSTOM_PRESETS = [
  'Custom Hand-Tied Bouquet',
  'Bridal Nikah Garland',
  'Seasonal Mixed Basket',
  'Event Stage Arrangement',
];

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  onAddCustomItem,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('');
  const [price, setPrice] = useState<number>(2500);
  const [showPricePad, setShowPricePad] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setVariant('Custom Arrangement');
      setPrice(2500);
      setError('');
      setShowPricePad(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a bouquet or item name.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Please enter a valid price greater than Rs. 0.');
      return;
    }
    onAddCustomItem(trimmed, variant.trim() || 'Custom Arrangement', Math.round(price));
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-item-title"
      >
        <div
          className="w-full max-w-lg rounded-3xl bg-white p-6 border border-[#EFECE6]"
          style={{ boxShadow: '0 12px 36px rgba(46, 74, 62, 0.14)' }}
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F4F0EB] flex items-center justify-center text-[#2E4A3E]">
                <Flower2 className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="custom-item-title"
                  className="font-serif text-[22px] font-semibold text-[#173328] leading-tight"
                >
                  Custom Bouquet / Item
                </h2>
                <p className="text-sm text-[#424844]">
                  Bespoke floral arrangement billed directly to this ticket
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-[#F4F0EB] text-[#222222] hover:bg-[#EAE5DD] active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Suggestion Chips */}
            <div>
              <label className="block text-xs font-semibold text-[#424844] mb-2">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_CUSTOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setName(preset);
                      setError('');
                    }}
                    className={`min-h-[44px] px-3.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      name === preset
                        ? 'bg-[#2E4A3E] text-white border-[#2E4A3E]'
                        : 'bg-[#FAF8F5] text-[#222222] border-[#EFECE6] hover:bg-[#F4F0EB]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="custom-item-name"
                className="block text-sm font-semibold text-[#222222] mb-1.5"
              >
                Arrangement / Item Name
              </label>
              <input
                id="custom-item-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Custom Pink Roses & Baby's Breath"
                className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] placeholder:text-[#727974] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="custom-item-variant"
                  className="block text-sm font-semibold text-[#222222] mb-1.5"
                >
                  Note / Stem Details
                </label>
                <input
                  id="custom-item-variant"
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  placeholder="e.g. Ribbon wrap + card"
                  className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] placeholder:text-[#727974] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                  Price (Rs.)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPricePad(true)}
                  className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 flex items-center justify-between text-left border border-transparent hover:border-[#2E4A3E] transition-colors"
                >
                  <span className="text-lg font-bold text-[#173328] tabular-nums">
                    {formatPKR(price)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E4A3E] bg-white px-2.5 py-1.5 rounded-lg border border-[#EFECE6]">
                    <Calculator className="w-4 h-4" />
                    Keypad
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-[#ba1a1a] bg-[#ffdad6] px-4 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[54px] rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-base hover:bg-[#F4F0EB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[54px] rounded-xl bg-[#2E4A3E] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#22382F] active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add to Ticket</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <NumericKeypadModal
        isOpen={showPricePad}
        title="Custom Item Price"
        subtitle="Enter selling price in PKR"
        initialValue={price}
        unitPrefix="Rs."
        quickPresets={[
          { label: '1,000', value: 1000 },
          { label: '2,500', value: 2500 },
          { label: '5,000', value: 5000 },
          { label: '10,000', value: 10000 },
        ]}
        onConfirm={(val) => {
          setPrice(val);
          setError('');
          setShowPricePad(false);
        }}
        onClose={() => setShowPricePad(false)}
      />
    </>
  );
};
