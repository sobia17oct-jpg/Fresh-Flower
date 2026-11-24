import React from 'react';
import { Invoice, ShopSettings } from '../types';
import { formatPKRPlain } from '../data/initialData';

interface ReceiptContentProps {
  invoice: Invoice;
  settings: ShopSettings;
  isPreview?: boolean;
}

export const ReceiptContent: React.FC<ReceiptContentProps> = ({
  invoice,
  settings,
  isPreview = false,
}) => {
  const dateObj = new Date(invoice.createdAt);
  const formattedDate = dateObj.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={
        isPreview
          ? 'mx-auto w-[300px] bg-white text-black p-4 font-mono text-[12px] leading-[1.35] border border-[#EFECE6] rounded-xl shadow-sm'
          : 'w-full bg-white text-black font-mono text-[12px] leading-[1.35]'
      }
    >
      {/* Shop Header */}
      <div className="text-center pb-2">
        {invoice.status === 'voided' && (
          <div className="text-[13px] font-bold border border-black py-0.5 mb-1.5">
            *** VOIDED RECEIPT ***
          </div>
        )}
        <div className="text-[16px] font-bold tracking-wide uppercase">
          {settings.shopName || 'Fresh Flowers Boutique'}
        </div>
        {settings.shopAddress && (
          <div className="text-[11px] mt-0.5 leading-snug">
            {settings.shopAddress}
          </div>
        )}
        {settings.shopPhone && (
          <div className="text-[11px] mt-0.5">Tel: {settings.shopPhone}</div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Invoice Metadata */}
      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Invoice #:</span>
          <span className="font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>
            {formattedDate} {formattedTime}
          </span>
        </div>
        {invoice.cashierName && (
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{invoice.cashierName}</span>
          </div>
        )}
        {invoice.customerName.trim() !== '' && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-semibold text-right max-w-[165px] truncate">
              {invoice.customerName.trim()}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Payment:</span>
          <span className="font-semibold">{invoice.paymentMethod}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Itemized Table */}
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left font-bold py-1 pr-1">Item</th>
            <th className="text-center font-bold py-1 px-1 w-9">Qty</th>
            <th className="text-right font-bold py-1 pl-1 w-20">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={`${item.name}-${idx}`} className="align-top">
              <td className="py-1 pr-1">
                <div className="font-semibold leading-tight">{item.name}</div>
                <div className="text-[10px]">@ {formatPKRPlain(item.unitPrice)}</div>
              </td>
              <td className="py-1 px-1 text-center tabular-nums">{item.quantity}</td>
              <td className="py-1 pl-1 text-right font-semibold tabular-nums whitespace-nowrap">
                {formatPKRPlain(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totals */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPKRPlain(invoice.subtotal)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>
              Discount
              {invoice.discountType === 'percent' ? ` (${invoice.discountValue}%)` : ''}
            </span>
            <span className="tabular-nums">
              - {formatPKRPlain(invoice.discountAmount)}
            </span>
          </div>
        )}
        <div className="border-t border-dashed border-black my-1.5" />
        <div className="flex justify-between text-[14px] font-bold">
          <span>GRAND TOTAL</span>
          <span className="tabular-nums">{formatPKRPlain(invoice.grandTotal)}</span>
        </div>
        {invoice.paymentMethod === 'Cash' &&
          invoice.amountTendered !== undefined &&
          invoice.amountTendered > 0 && (
            <>
              <div className="flex justify-between pt-1">
                <span>Cash Tendered</span>
                <span className="tabular-nums">
                  {formatPKRPlain(invoice.amountTendered)}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Change Due</span>
                <span className="tabular-nums">
                  {formatPKRPlain(Math.max(0, invoice.changeDue || 0))}
                </span>
              </div>
            </>
          )}
      </div>

      <div className="border-t border-dashed border-black my-2.5" />

      {/* Footer */}
      <div className="text-center text-[11px] space-y-1 pt-0.5">
        <div className="font-semibold">
          {settings.receiptFooter || 'Thank you for blooming with us!'}
        </div>
        <div className="text-[10px]">*** Fresh Flowers Boutique ***</div>
      </div>
    </div>
  );
};

interface ThermalReceiptProps {
  invoice: Invoice | null;
  settings: ShopSettings;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ invoice, settings }) => {
  if (!invoice) return null;
  return (
    <div id="thermal-receipt-root" className="hidden print:block" aria-hidden="true">
      <ReceiptContent invoice={invoice} settings={settings} />
    </div>
  );
};
