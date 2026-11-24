import React, { useMemo, useState } from 'react';
import {
  Ban,
  History,
  KeyRound,
  Lock,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  ActivityLogEntry,
  AdminConfig,
  Invoice,
  Product,
  StaffMember,
} from '../types';
import { formatPKR } from '../data/initialData';
import { PinLockModal } from './PinLockModal';
import { ConfirmModal } from './ConfirmModal';

interface AdminViewProps {
  products: Product[];
  invoices: Invoice[];
  staff: StaffMember[];
  activeStaffId: string;
  adminConfig: AdminConfig;
  activityLogs: ActivityLogEntry[];
  onSetActiveStaffId: (id: string) => void;
  onAddStaffMember: (name: string, role: 'Admin' | 'Cashier') => void;
  onDeleteStaffMember: (id: string) => void;
  onUpdateAdminConfig: (next: AdminConfig) => void;
  onLockTerminal: () => void;
  onVoidInvoice: (invoiceId: string) => void;
  onClearActivityLogs: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  invoices,
  staff,
  activeStaffId,
  adminConfig,
  activityLogs,
  onSetActiveStaffId,
  onAddStaffMember,
  onDeleteStaffMember,
  onUpdateAdminConfig,
  onLockTerminal,
  onVoidInvoice,
  onClearActivityLogs,
}) => {
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Admin' | 'Cashier'>('Cashier');
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState(false);

  const analytics = useMemo(() => {
    const activeInvoices = invoices.filter((inv) => inv.status !== 'voided');
    const voidedInvoices = invoices.filter((inv) => inv.status === 'voided');

    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    let totalRevenue = 0;
    let totalDiscounts = 0;
    let estimatedCost = 0;
    let todayRevenue = 0;

    const paymentTotals: Record<'Cash' | 'Card' | 'Bank Transfer', number> = {
      Cash: 0,
      Card: 0,
      'Bank Transfer': 0,
    };

    const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};

    const costLookup: Record<string, number> = {};
    for (const p of products) {
      costLookup[p.id] = p.costPrice ?? Math.round(p.price * 0.58);
    }

    for (const inv of activeInvoices) {
      totalRevenue += inv.grandTotal;
      totalDiscounts += inv.discountAmount;
      paymentTotals[inv.paymentMethod] =
        (paymentTotals[inv.paymentMethod] || 0) + inv.grandTotal;

      const dt = new Date(inv.createdAt);
      if (
        dt.getFullYear() === todayY &&
        dt.getMonth() === todayM &&
        dt.getDate() === todayD
      ) {
        todayRevenue += inv.grandTotal;
      }

      for (const item of inv.items) {
        const unitCost =
          item.costPrice ??
          (item.productId && costLookup[item.productId] !== undefined
            ? costLookup[item.productId]
            : Math.round(item.unitPrice * 0.55));
        estimatedCost += unitCost * item.quantity;

        const key = item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSalesMap[key].qty += item.quantity;
        productSalesMap[key].revenue += item.total;
      }
    }

    const estimatedProfit = Math.max(0, totalRevenue - estimatedCost);
    const marginPercent =
      totalRevenue > 0 ? Math.round((estimatedProfit / totalRevenue) * 100) : 0;

    const inventoryRetailValue = products.reduce(
      (sum, p) => sum + p.price * p.stock,
      0
    );
    const inventoryCostValue = products.reduce(
      (sum, p) => sum + (p.costPrice ?? Math.round(p.price * 0.58)) * p.stock,
      0
    );

    const topFlowers = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      todayRevenue,
      totalDiscounts,
      estimatedProfit,
      marginPercent,
      voidedCount: voidedInvoices.length,
      inventoryRetailValue,
      inventoryCostValue,
      paymentTotals,
      topFlowers,
      recentInvoices: invoices.slice(0, 8),
    };
  }, [invoices, products]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStaffName.trim();
    if (!trimmed) return;
    onAddStaffMember(trimmed, newStaffRole);
    setNewStaffName('');
  };

  const maxTopRevenue =
    analytics.topFlowers.length > 0 ? analytics.topFlowers[0].revenue : 1;

  return (
    <div className="space-y-6 pb-10">
      {/* Admin Command Header */}
      <div className="rounded-3xl bg-white border border-[#EFECE6] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[26px] font-semibold text-[#173328] leading-tight">
            Boutique Admin Console
          </h1>
          <p className="text-sm text-[#424844] mt-1">
            Profit margins, staff shifts, cashier PIN locks, invoice voiding, and local audit history
          </p>
        </div>

        <button
          type="button"
          onClick={onLockTerminal}
          className="min-h-[52px] px-5 rounded-xl bg-[#2E4A3E] text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 hover:bg-[#22382F] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
        >
          <Lock className="w-4 h-4" />
          <span>Lock Terminal (Cashier Mode)</span>
        </button>
      </div>

      {/* Business & Profit KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#2E4A3E] text-white p-5">
          <p className="text-sm text-[#CAEAD9] font-medium">Net Revenue (All-Time)</p>
          <p className="text-[28px] font-bold mt-1 tabular-nums">
            {formatPKR(analytics.totalRevenue)}
          </p>
          <p className="text-xs text-[#CAEAD9]/90 mt-1 tabular-nums">
            Today: {formatPKR(analytics.todayRevenue)}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-5">
          <p className="text-sm text-[#424844] font-medium">Estimated Gross Profit</p>
          <p className="text-[28px] font-bold text-[#173328] mt-1 tabular-nums">
            {formatPKR(analytics.estimatedProfit)}
          </p>
          <p className="text-xs text-[#424844] mt-1 tabular-nums">
            Margin: {analytics.marginPercent}% across completed sales
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-5">
          <p className="text-sm text-[#424844] font-medium">Stock Valuation (Retail)</p>
          <p className="text-[28px] font-bold text-[#173328] mt-1 tabular-nums">
            {formatPKR(analytics.inventoryRetailValue)}
          </p>
          <p className="text-xs text-[#424844] mt-1 tabular-nums">
            Cost Value: {formatPKR(analytics.inventoryCostValue)}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-5">
          <p className="text-sm text-[#424844] font-medium">Discounts &amp; Voids</p>
          <p className="text-[28px] font-bold text-[#8B4B58] mt-1 tabular-nums">
            {formatPKR(analytics.totalDiscounts)}
          </p>
          <p className="text-xs text-[#424844] mt-1 tabular-nums">
            {analytics.voidedCount} voided invoice{analytics.voidedCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Analytics Row: Top Flowers & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-white border border-[#EFECE6] p-6">
          <h2 className="font-serif text-[20px] font-semibold text-[#173328] mb-1">
            Top-Selling Flowers
          </h2>
          <p className="text-xs text-[#424844] mb-4">
            Ranked by completed revenue in Rs.
          </p>

          {analytics.topFlowers.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#424844]">
              Complete sales in POS Billing to populate top-selling stems.
            </div>
          ) : (
            <div className="space-y-3.5">
              {analytics.topFlowers.map((item) => {
                const widthPct = Math.max(8, Math.round((item.revenue / maxTopRevenue) * 100));
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#222222] truncate pr-3">
                        {item.name}{' '}
                        <span className="text-xs font-normal text-[#424844]">
                          ({item.qty} sold)
                        </span>
                      </span>
                      <span className="font-bold text-[#173328] tabular-nums shrink-0">
                        {formatPKR(item.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#F4F0EB] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2E4A3E]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-[#EFECE6] p-6">
          <h2 className="font-serif text-[20px] font-semibold text-[#173328] mb-1">
            Payment Method Totals
          </h2>
          <p className="text-xs text-[#424844] mb-4">
            Cash drawer reconciliation vs digital settlements
          </p>

          <div className="space-y-3">
            {(['Cash', 'Card', 'Bank Transfer'] as const).map((method) => {
              const amt = analytics.paymentTotals[method] || 0;
              const pct =
                analytics.totalRevenue > 0
                  ? Math.round((amt / analytics.totalRevenue) * 100)
                  : 0;
              return (
                <div
                  key={method}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-bold text-[#222222]">{method}</p>
                    <p className="text-xs text-[#424844] tabular-nums">
                      {pct}% of net sales
                    </p>
                  </div>
                  <p className="text-lg font-bold text-[#173328] tabular-nums">
                    {formatPKR(amt)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Profiles & Security Access Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Staff / Active Cashier Manager */}
        <div className="rounded-3xl bg-white border border-[#EFECE6] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F0EB] text-[#2E4A3E] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-[20px] font-semibold text-[#173328]">
                Staff &amp; Active Cashier
              </h2>
              <p className="text-xs text-[#424844]">
                Active cashier name is printed on every receipt
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {staff.map((member) => {
              const isActive = member.id === activeStaffId;
              return (
                <div
                  key={member.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#F4F0EB] border-[#2E4A3E]'
                      : 'bg-[#FAF8F5] border-[#EFECE6]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSetActiveStaffId(member.id)}
                    className="flex-1 min-h-[48px] text-left flex items-center gap-3"
                  >
                    <UserCheck
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-[#2E4A3E]' : 'text-[#7A9A8B]'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-bold text-[#222222]">
                        {member.name}
                      </p>
                      <p className="text-xs text-[#424844]">
                        {member.role} {isActive ? '· Active on Counter' : '· Tap to Activate'}
                      </p>
                    </div>
                  </button>

                  {staff.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteStaffMember(member.id)}
                      aria-label={`Remove ${member.name}`}
                      className="min-h-[48px] min-w-[48px] rounded-xl bg-white border border-[#ffdad6] text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffdad6]/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateStaff} className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <input
              type="text"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              placeholder="Staff member name..."
              className="flex-1 min-h-[48px] rounded-xl bg-[#F4F0EB] px-4 text-sm text-[#222222] placeholder:text-[#727974] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
            />
            <select
              value={newStaffRole}
              onChange={(e) => setNewStaffRole(e.target.value as 'Admin' | 'Cashier')}
              className="min-h-[48px] rounded-xl bg-[#F4F0EB] px-3 text-sm font-semibold text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:outline-none"
            >
              <option value="Cashier">Cashier</option>
              <option value="Admin">Admin</option>
            </select>
            <button
              type="submit"
              className="min-h-[48px] px-4 rounded-xl bg-[#2E4A3E] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#22382F] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </form>
        </div>

        {/* Security & PIN Controls */}
        <div className="rounded-3xl bg-white border border-[#EFECE6] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F0EB] text-[#2E4A3E] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-[20px] font-semibold text-[#173328]">
                Terminal Security &amp; PIN Lock
              </h2>
              <p className="text-xs text-[#424844]">
                Protect inventory edits, settings, and discounts with your Admin PIN
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#222222]">Admin PIN Code</p>
              <p className="text-xs text-[#424844] tabular-nums">
                Current PIN: {adminConfig.adminPin.replace(/./g, '•')} (
                {adminConfig.adminPin.length} digits)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePinModal(true)}
              className="min-h-[48px] px-4 rounded-xl border border-[#2E4A3E] bg-white text-[#2E4A3E] text-sm font-semibold hover:bg-[#F4F0EB] whitespace-nowrap"
            >
              Change PIN
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateAdminConfig({
                ...adminConfig,
                lockAdminFeatures: !adminConfig.lockAdminFeatures,
              })
            }
            className="w-full min-h-[60px] p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-4 text-left hover:bg-[#F4F0EB] transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-[#222222]">
                Require PIN for Inventory, Admin &amp; Settings
              </p>
              <p className="text-xs text-[#424844]">
                Cashiers can still bill &amp; view receipts; management tabs ask for PIN when locked
              </p>
            </div>
            <span
              className={`min-w-[60px] h-8 px-3 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                adminConfig.lockAdminFeatures
                  ? 'bg-[#2E4A3E] text-white'
                  : 'bg-[#EAE4DC] text-[#424844]'
              }`}
            >
              {adminConfig.lockAdminFeatures ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateAdminConfig({
                ...adminConfig,
                requirePinForDiscount: !adminConfig.requirePinForDiscount,
              })
            }
            className="w-full min-h-[60px] p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-4 text-left hover:bg-[#F4F0EB] transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-[#222222]">
                Require Admin PIN for Discounts (When Locked)
              </p>
              <p className="text-xs text-[#424844]">
                Prevents unauthorized manual discounts in Cashier Mode
              </p>
            </div>
            <span
              className={`min-w-[60px] h-8 px-3 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                adminConfig.requirePinForDiscount
                  ? 'bg-[#2E4A3E] text-white'
                  : 'bg-[#EAE4DC] text-[#424844]'
              }`}
            >
              {adminConfig.requirePinForDiscount ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Invoice Void & Stock Restoration + Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EFECE6] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-[20px] font-semibold text-[#173328]">
                Invoice Void &amp; Stock Restoration
              </h2>
              <p className="text-xs text-[#424844]">
                Voiding an invoice excludes it from revenue and automatically returns flower stock
              </p>
            </div>
          </div>

          {analytics.recentInvoices.length === 0 ? (
            <p className="text-sm text-[#424844] py-6 text-center">
              No sales invoices recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {analytics.recentInvoices.map((inv) => {
                const isVoided = inv.status === 'voided';
                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isVoided
                        ? 'bg-[#FFF5F5] border-[#ffdad6]'
                        : 'bg-[#FAF8F5] border-[#EFECE6]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#173328] tabular-nums">
                          {inv.invoiceNumber}
                        </span>
                        {isVoided && (
                          <span className="text-xs font-bold text-[#ba1a1a]">
                            · VOIDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#424844] truncate mt-0.5">
                        {inv.customerName || 'Walk-in'} · {inv.paymentMethod} ·{' '}
                        {new Date(inv.createdAt).toLocaleString('en-PK', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span
                        className={`text-base font-bold tabular-nums ${
                          isVoided
                            ? 'line-through text-[#727974]'
                            : 'text-[#173328]'
                        }`}
                      >
                        {formatPKR(inv.grandTotal)}
                      </span>
                      {!isVoided && (
                        <button
                          type="button"
                          onClick={() => setVoidTarget(inv)}
                          className="min-h-[48px] px-3.5 rounded-xl border border-[#ffdad6] bg-white text-[#ba1a1a] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#ffdad6]/40 whitespace-nowrap"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Void Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Local Activity Audit Trail */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[#EFECE6] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F0EB] text-[#2E4A3E] flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-[20px] font-semibold text-[#173328]">
                  Activity Log
                </h2>
                <p className="text-xs text-[#424844]">Recent local counter events</p>
              </div>
            </div>
            {activityLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearLogsConfirm(true)}
                className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-[#8B4B58] hover:bg-[#FAF8F5]"
              >
                Clear Log
              </button>
            )}
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-sm text-[#424844] py-8 text-center">
              No logged actions yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activityLogs.slice(0, 30).map((log) => (
                <div
                  key={log.id}
                  className="py-2.5 px-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] text-xs"
                >
                  <p className="font-semibold text-[#222222]">{log.action}</p>
                  <p className="text-[#424844] mt-0.5 tabular-nums">
                    {log.actor} ·{' '}
                    {new Date(log.timestamp).toLocaleString('en-PK', {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Change Admin PIN Modal */}
      <PinLockModal
        isOpen={showChangePinModal}
        mode="set"
        title="Set New Admin PIN"
        subtitle="Enter a 4 to 6 digit security PIN"
        onSuccess={(newPin) => {
          onUpdateAdminConfig({ ...adminConfig, adminPin: newPin });
          setShowChangePinModal(false);
        }}
        onClose={() => setShowChangePinModal(false)}
      />

      {/* Void Invoice Confirm Modal */}
      <ConfirmModal
        isOpen={voidTarget !== null}
        title={`Void ${voidTarget?.invoiceNumber || ''}?`}
        message={`Voiding this ${formatPKR(
          voidTarget?.grandTotal || 0
        )} invoice will mark it as voided in Sales History and restore sold catalog quantities back into stock.`}
        confirmLabel="Void & Restore Stock"
        destructive
        onConfirm={() => {
          if (voidTarget) {
            onVoidInvoice(voidTarget.id);
          }
          setVoidTarget(null);
        }}
        onCancel={() => setVoidTarget(null)}
      />

      {/* Clear Logs Confirm Modal */}
      <ConfirmModal
        isOpen={showClearLogsConfirm}
        title="Clear Activity Log?"
        message="This clears the local audit log history. Your products and sales invoices will not be affected."
        confirmLabel="Clear Log"
        destructive
        onConfirm={() => {
          onClearActivityLogs();
          setShowClearLogsConfirm(false);
        }}
        onCancel={() => setShowClearLogsConfirm(false)}
      />
    </div>
  );
};
