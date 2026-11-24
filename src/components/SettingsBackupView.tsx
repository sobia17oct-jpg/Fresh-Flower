import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  RotateCcw,
  Store,
  Upload,
} from 'lucide-react';
import {
  ActivityLogEntry,
  AdminConfig,
  Invoice,
  PosBackupPayload,
  Product,
  ShopSettings,
  StaffMember,
} from '../types';
import { ReceiptContent } from './ThermalReceipt';
import { buildBackupPayload, parseBackupPayload } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface SettingsBackupViewProps {
  settings: ShopSettings;
  products: Product[];
  invoices: Invoice[];
  nextInvoiceSequence: number;
  staff: StaffMember[];
  adminConfig: AdminConfig;
  activityLogs: ActivityLogEntry[];
  onSaveSettings: (next: ShopSettings) => void;
  onRestoreBackup: (payload: PosBackupPayload) => void;
  onResetSampleCatalog: () => void;
  onNotify: (message: string) => void;
}

const SAMPLE_PREVIEW_INVOICE: Invoice = {
  id: 'sample-preview',
  invoiceNumber: 'INV-1042',
  createdAt: new Date().toISOString(),
  customerName: 'Ayesha Khan',
  items: [
    {
      name: 'Red Roses Bunch',
      quantity: 2,
      unitPrice: 2500,
      total: 5000,
    },
    {
      name: 'Ribbed Glass Vase',
      quantity: 1,
      unitPrice: 1850,
      total: 1850,
    },
  ],
  subtotal: 6850,
  discountType: 'flat',
  discountValue: 350,
  discountAmount: 350,
  grandTotal: 6500,
  paymentMethod: 'Cash',
  amountTendered: 7000,
  changeDue: 500,
};

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  settings,
  products,
  invoices,
  nextInvoiceSequence,
  staff,
  adminConfig,
  activityLogs,
  onSaveSettings,
  onRestoreBackup,
  onResetSampleCatalog,
  onNotify,
}) => {
  const [form, setForm] = useState<ShopSettings>(settings);
  const [importError, setImportError] = useState('');
  const [pendingRestore, setPendingRestore] = useState<PosBackupPayload | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      shopName: form.shopName.trim() || 'Petal & Sage Boutique',
      shopAddress: form.shopAddress.trim(),
      shopPhone: form.shopPhone.trim(),
      receiptFooter: form.receiptFooter.trim() || 'Thank you for blooming with us!',
      lowStockThreshold: Math.max(1, Math.floor(Number(form.lowStockThreshold) || 5)),
    });
    onNotify('Shop & receipt settings saved locally.');
  };

  const handleExportJson = () => {
    const payload = buildBackupPayload(
      products,
      invoices,
      settings,
      nextInvoiceSequence,
      staff,
      adminConfig,
      activityLogs
    );
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flower-boutique-pos-backup-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Backup JSON downloaded to your computer.');
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = parseBackupPayload(text);
        setPendingRestore(parsed);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : 'Unable to read backup JSON file.'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
      {/* Left: Shop & Receipt Header/Footer Form + Backup Controls */}
      <div className="lg:col-span-7 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white border border-[#EFECE6] p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F0EB] text-[#2E4A3E] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-[22px] font-semibold text-[#173328]">
                Boutique &amp; 80mm Receipt Settings
              </h2>
              <p className="text-sm text-[#424844]">
                Printed at the top and bottom of every thermal receipt
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-1.5">
              Shop Name
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                Shop Phone
              </label>
              <input
                type="text"
                value={form.shopPhone}
                onChange={(e) => setForm({ ...form, shopPhone: e.target.value })}
                className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    lowStockThreshold: Number(e.target.value),
                  })
                }
                className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] tabular-nums border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-1.5">
              Shop Address
            </label>
            <input
              type="text"
              value={form.shopAddress}
              onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
              className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-1.5">
              Receipt Footer Message
            </label>
            <input
              type="text"
              value={form.receiptFooter}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
              className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="min-h-[54px] px-6 rounded-xl bg-[#2E4A3E] text-white font-semibold text-base inline-flex items-center gap-2 hover:bg-[#22382F] active:scale-[0.98] transition-all"
            >
              <Check className="w-5 h-5" />
              <span>Save Shop Settings</span>
            </button>
          </div>
        </form>

        {/* Offline Local Backup & Restore Card */}
        <div className="rounded-3xl bg-white border border-[#EFECE6] p-6 space-y-4">
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#173328]">
              Local PC Backup &amp; Restore
            </h2>
            <p className="text-sm text-[#424844] mt-1">
              All data lives offline in this browser&apos;s storage ({products.length}{' '}
              products, {invoices.length} invoices). Export a JSON file anytime to save a
              backup on your PC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportJson}
              className="min-h-[56px] px-5 rounded-xl bg-[#2E4A3E] text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#22382F] active:scale-[0.98] transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Export Backup (Download JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[56px] px-5 rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#F4F0EB] active:scale-[0.98] transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>Import Backup (Restore JSON)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFileChange}
              className="hidden"
            />
          </div>

          {importError && (
            <p className="text-sm font-medium text-[#ba1a1a] bg-[#ffdad6] px-4 py-3 rounded-xl">
              {importError}
            </p>
          )}

          <div className="pt-3 border-t border-[#EFECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#424844]">
              Need to restore the starter sample flower catalog?
            </p>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="min-h-[48px] px-4 rounded-xl border border-[#EFECE6] bg-[#FAF8F5] text-sm font-semibold text-[#8B4B58] inline-flex items-center justify-center gap-1.5 hover:bg-[#F4F0EB]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore Sample Flowers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Live 80mm Thermal Receipt Preview */}
      <div className="lg:col-span-5 rounded-3xl bg-white border border-[#EFECE6] p-6">
        <div className="mb-4 text-center">
          <h3 className="font-serif text-[20px] font-semibold text-[#173328]">
            80mm Thermal Receipt Preview
          </h3>
          <p className="text-xs text-[#424844] mt-0.5">
            Live preview using your current shop header &amp; footer
          </p>
        </div>
        <ReceiptContent
          invoice={SAMPLE_PREVIEW_INVOICE}
          settings={form}
          isPreview
        />
      </div>

      {/* Restore Backup Confirmation Modal */}
      <ConfirmModal
        isOpen={pendingRestore !== null}
        title="Restore POS Backup?"
        message={`This will replace your current catalog and sales history with ${
          pendingRestore?.products.length || 0
        } products and ${pendingRestore?.invoices.length || 0} invoices from the selected JSON file.`}
        confirmLabel="Restore Backup"
        onConfirm={() => {
          if (pendingRestore) {
            onRestoreBackup(pendingRestore);
          }
          setPendingRestore(null);
        }}
        onCancel={() => setPendingRestore(null)}
      />

      {/* Reset Sample Catalog Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Restore Sample Flower Catalog?"
        message="This resets your product list to the 8 default Fresh Flowers Boutique items. Your existing sales invoices will be kept."
        confirmLabel="Restore Catalog"
        destructive
        onConfirm={() => {
          onResetSampleCatalog();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
