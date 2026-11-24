import React, { useMemo, useState } from 'react';
import {
  Eye,
  Printer,
  ReceiptText,
  Search,
  X,
} from 'lucide-react';
import { Invoice, ShopSettings } from '../types';
import { formatPKR } from '../data/initialData';
import { ReceiptContent } from './ThermalReceipt';

interface SalesHistoryViewProps {
  invoices: Invoice[];
  settings: ShopSettings;
  onReprintInvoice: (invoice: Invoice) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  invoices,
  settings,
  onReprintInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const todayStats = useMemo(() => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    let todayTotal = 0;
    let todayOrders = 0;
    let allTimeTotal = 0;

    for (const inv of invoices) {
      if (inv.status === 'voided') continue;
      allTimeTotal += inv.grandTotal;
      const d = new Date(inv.createdAt);
      if (
        d.getFullYear() === todayY &&
        d.getMonth() === todayM &&
        d.getDate() === todayD
      ) {
        todayTotal += inv.grandTotal;
        todayOrders += 1;
      }
    }

    return {
      todayTotal,
      todayOrders,
      allTimeTotal,
      avgTicket: todayOrders > 0 ? Math.round(todayTotal / todayOrders) : 0,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!q) return sorted;
    return sorted.filter((inv) => {
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCustomer = inv.customerName.toLowerCase().includes(q);
      const matchMethod = inv.paymentMethod.toLowerCase().includes(q);
      const matchItem = inv.items.some((item) =>
        item.name.toLowerCase().includes(q)
      );
      return matchNum || matchCustomer || matchMethod || matchItem;
    });
  }, [invoices, searchQuery]);

  return (
    <div className="space-y-5 pb-8">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#2E4A3E] text-white p-5">
          <p className="text-sm text-[#CAEAD9] font-medium">Today&apos;s Total Sales</p>
          <p className="text-[30px] font-bold tracking-tight mt-1 tabular-nums">
            {formatPKR(todayStats.todayTotal)}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-5">
          <p className="text-sm text-[#424844] font-medium">Today&apos;s Total Orders</p>
          <p className="text-[30px] font-bold text-[#173328] tracking-tight mt-1 tabular-nums">
            {todayStats.todayOrders}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-5">
          <p className="text-sm text-[#424844] font-medium">Today&apos;s Average Order</p>
          <p className="text-[30px] font-bold text-[#173328] tracking-tight mt-1 tabular-nums">
            {formatPKR(todayStats.avgTicket)}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-5">
          <p className="text-sm text-[#424844] font-medium">All-Time Local Sales</p>
          <p className="text-[30px] font-bold text-[#173328] tracking-tight mt-1 tabular-nums">
            {formatPKR(todayStats.allTimeTotal)}
          </p>
        </div>
      </div>

      {/* Searchable Past Invoices Table */}
      <div className="rounded-3xl bg-white border border-[#EFECE6] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#173328]">
              Sales Invoices ({filteredInvoices.length})
            </h2>
            <p className="text-sm text-[#424844]">
              Search by invoice #, customer name, payment method, or flower item
            </p>
          </div>

          <div className="relative w-full md:w-96 flex items-center">
            <Search className="w-5 h-5 text-[#2E4A3E] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search INV-1001, customer, roses..."
              className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] pl-12 pr-12 text-base text-[#222222] placeholder:text-[#727974] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear invoice search"
                className="absolute right-1 min-h-[48px] min-w-[48px] flex items-center justify-center text-[#424844]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F0EB] text-[#7A9A8B] flex items-center justify-center mx-auto mb-3">
              <ReceiptText className="w-7 h-7" />
            </div>
            <p className="font-serif text-xl font-semibold text-[#173328]">
              {invoices.length === 0
                ? 'No completed sales yet'
                : 'No matching invoices found'}
            </p>
            <p className="text-sm text-[#424844] mt-1">
              {invoices.length === 0
                ? 'Complete your first order on the POS Billing tab to record a receipt.'
                : 'Try searching a different invoice number or customer name.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFECE6] text-xs font-bold text-[#424844]">
                  <th className="py-3 pr-4">Invoice #</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6] text-sm">
                {filteredInvoices.map((inv) => {
                  const dt = new Date(inv.createdAt);
                  const dateLabel = dt.toLocaleDateString('en-PK', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  });
                  const timeLabel = dt.toLocaleTimeString('en-PK', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const itemsSummary = inv.items
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(', ');

                  const isVoided = inv.status === 'voided';

                  return (
                    <tr
                      key={inv.id}
                      className={
                        isVoided
                          ? 'bg-[#FFF5F5]/60 opacity-80'
                          : 'hover:bg-[#FAF8F5] transition-colors'
                      }
                    >
                      <td className="py-3.5 pr-4 font-bold text-[#173328] whitespace-nowrap tabular-nums">
                        {inv.invoiceNumber}
                        {isVoided && (
                          <span className="ml-2 text-xs font-bold text-[#ba1a1a]">
                            Voided
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#424844] whitespace-nowrap tabular-nums">
                        {dateLabel} · {timeLabel}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#222222] max-w-[160px] truncate">
                        {inv.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-3.5 px-4 text-[#424844] max-w-[260px] truncate">
                        {itemsSummary}
                      </td>
                      <td className="py-3.5 px-4 text-[#222222] whitespace-nowrap">
                        {inv.paymentMethod}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold whitespace-nowrap tabular-nums ${
                          isVoided
                            ? 'line-through text-[#727974]'
                            : 'text-[#173328]'
                        }`}
                      >
                        {formatPKR(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="min-h-[48px] px-3.5 rounded-xl border border-[#EFECE6] bg-white text-[#222222] font-semibold text-sm inline-flex items-center gap-1.5 hover:bg-[#F4F0EB]"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReprintInvoice(inv)}
                            className="min-h-[48px] px-4 rounded-xl bg-[#2E4A3E] text-white font-semibold text-sm inline-flex items-center gap-1.5 hover:bg-[#22382F] active:scale-[0.98] transition-all"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Reprint Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {previewInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#FAF8F5] p-6 border border-[#EFECE6] max-h-[92vh] overflow-y-auto"
            style={{ boxShadow: '0 12px 36px rgba(46, 74, 62, 0.14)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-[20px] font-semibold text-[#173328]">
                Receipt {previewInvoice.invoiceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                aria-label="Close receipt preview"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-white border border-[#EFECE6] text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ReceiptContent
              invoice={previewInvoice}
              settings={settings}
              isPreview
            />

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="min-h-[52px] rounded-xl border border-[#2E4A3E] bg-white text-[#2E4A3E] font-semibold text-base"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewInvoice;
                  setPreviewInvoice(null);
                  onReprintInvoice(target);
                }}
                className="min-h-[52px] rounded-xl bg-[#2E4A3E] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#22382F]"
              >
                <Printer className="w-5 h-5" />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
