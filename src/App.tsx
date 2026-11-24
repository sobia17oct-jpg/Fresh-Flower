import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Boxes,
  CheckCircle2,
  Lock,
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import {
  ActiveTab,
  ActivityLogEntry,
  AdminConfig,
  CartItem,
  DiscountConfig,
  Invoice,
  PaymentMethod,
  PosBackupPayload,
  Product,
  ShopSettings,
  StaffMember,
} from './types';
import { INITIAL_PRODUCTS, formatPKR } from './data/initialData';
import {
  formatInvoiceNumber,
  loadActiveStaffId,
  loadActivityLogs,
  loadAdminConfig,
  loadInvoices,
  loadNextInvoiceSequence,
  loadProducts,
  loadSettings,
  loadStaff,
  saveActiveStaffId,
  saveActivityLogs,
  saveAdminConfig,
  saveInvoices,
  saveNextInvoiceSequence,
  saveProducts,
  saveSettings,
  saveStaff,
} from './utils/storage';
import { PosBillingView } from './components/PosBillingView';
import { InventoryView } from './components/InventoryView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { AdminView } from './components/AdminView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { ThermalReceipt } from './components/ThermalReceipt';
import { PinLockModal } from './components/PinLockModal';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Persistent Offline State (localStorage)
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  const [nextInvoiceSeq, setNextInvoiceSeq] = useState<number>(() =>
    loadNextInvoiceSequence()
  );
  const [staff, setStaff] = useState<StaffMember[]>(() => loadStaff());
  const [activeStaffId, setActiveStaffId] = useState<string>(() =>
    loadActiveStaffId()
  );
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() =>
    loadAdminConfig()
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() =>
    loadActivityLogs()
  );

  // Admin unlock state (starts unlocked unless lockAdminFeatures is enabled)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(
    () => !loadAdminConfig().lockAdminFeatures
  );
  const [pendingPinAction, setPendingPinAction] = useState<{
    title: string;
    subtitle: string;
    onAuthorized: () => void;
  } | null>(null);

  // Active POS Ticket State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<DiscountConfig>({
    type: 'flat',
    value: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<number>(0);

  // Active Receipt for 80mm Thermal Printing
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Non-intrusive Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveNextInvoiceSequence(nextInvoiceSeq);
  }, [nextInvoiceSeq]);

  useEffect(() => {
    saveStaff(staff);
  }, [staff]);

  useEffect(() => {
    saveActiveStaffId(activeStaffId);
  }, [activeStaffId]);

  useEffect(() => {
    saveAdminConfig(adminConfig);
  }, [adminConfig]);

  useEffect(() => {
    saveActivityLogs(activityLogs);
  }, [activityLogs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activeStaffMember = useMemo(
    () => staff.find((s) => s.id === activeStaffId) || staff[0],
    [staff, activeStaffId]
  );

  const appendLog = (action: string, actorOverride?: string) => {
    const entry: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: actorOverride || activeStaffMember?.name || 'Admin',
      action,
    };
    setActivityLogs((prev) => [entry, ...prev].slice(0, 150));
  };

  const todaySalesTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return invoices.reduce((sum, inv) => {
      if (inv.status === 'voided') return sum;
      const dt = new Date(inv.createdAt);
      if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
        return sum + inv.grandTotal;
      }
      return sum;
    }, 0);
  }, [invoices]);

  const isTerminalLocked = adminConfig.lockAdminFeatures && !isAdminUnlocked;

  const handleTabSelect = (tab: ActiveTab) => {
    const isProtected = tab === 'inventory' || tab === 'admin' || tab === 'settings';
    if (isProtected && isTerminalLocked) {
      setPendingPinAction({
        title: 'Admin PIN Required',
        subtitle: `Enter PIN to open ${
          tab === 'inventory' ? 'Inventory' : tab === 'admin' ? 'Admin' : 'Settings'
        }`,
        onAuthorized: () => {
          setIsAdminUnlocked(true);
          setActiveTab(tab);
        },
      });
      return;
    }
    setActiveTab(tab);
  };

  const handleRequestDiscountUnlock = (onAuthorized: () => void) => {
    if (!isTerminalLocked) {
      onAuthorized();
      return;
    }
    setPendingPinAction({
      title: 'Discount Approval',
      subtitle: 'Enter Admin PIN to apply a manual discount',
      onAuthorized,
    });
  };

  const handleLockTerminal = () => {
    setAdminConfig((prev) => ({ ...prev, lockAdminFeatures: true }));
    setIsAdminUnlocked(false);
    setActiveTab('pos');
    appendLog('Terminal locked into Cashier Mode');
    showToast('Terminal locked. Cashier Mode active.');
  };

  const handleAddProductToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Maximum available stock (${product.stock}) reached for ${product.name}.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          variant: product.variant,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const handleAddCustomItem = (name: string, variant: string, price: number) => {
    setCart((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: null,
        name,
        variant,
        price,
        quantity: 1,
        isCustom: true,
      },
    ]);
    showToast(`Added custom item: ${name}`);
  };

  const handleUpdateCartQty = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        if (item.productId) {
          const prod = products.find((p) => p.id === item.productId);
          if (prod && newQty > prod.stock) {
            showToast(`Only ${prod.stock} units available in stock.`);
            return { ...item, quantity: prod.stock };
          }
        }
        return { ...item, quantity: newQty };
      })
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomerName('');
    setDiscount({ type: 'flat', value: 0 });
    setAmountTendered(0);
  };

  const triggerThermalPrint = (invoice: Invoice) => {
    flushSync(() => {
      setPrintInvoice(invoice);
    });
    window.print();
  };

  const handleCompleteAndPrint = () => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    if (discount.value > 0 && subtotal > 0) {
      if (discount.type === 'percent') {
        discountAmount = Math.round(
          (subtotal * Math.min(100, Math.max(0, discount.value))) / 100
        );
      } else {
        discountAmount = Math.min(subtotal, Math.round(discount.value));
      }
    }
    const grandTotal = Math.max(0, subtotal - discountAmount);
    const effectiveTendered =
      paymentMethod === 'Cash'
        ? amountTendered > 0
          ? amountTendered
          : grandTotal
        : undefined;
    const changeDue =
      paymentMethod === 'Cash' && effectiveTendered !== undefined
        ? Math.max(0, effectiveTendered - grandTotal)
        : undefined;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: formatInvoiceNumber(nextInvoiceSeq),
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      cashierName: activeStaffMember?.name,
      status: 'completed',
      items: cart.map((c) => {
        const prod = c.productId
          ? products.find((p) => p.id === c.productId)
          : undefined;
        return {
          productId: c.productId,
          name: c.name,
          variant: c.variant,
          quantity: c.quantity,
          unitPrice: c.price,
          costPrice: prod?.costPrice,
          total: c.price * c.quantity,
          isCustom: c.isCustom,
        };
      }),
      subtotal,
      discountType: discount.type,
      discountValue: discount.value,
      discountAmount,
      grandTotal,
      paymentMethod,
      amountTendered: effectiveTendered,
      changeDue,
    };

    // (a) Deduct sold quantities from inventory
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const soldQty = cart
          .filter((c) => c.productId === prod.id)
          .reduce((sum, c) => sum + c.quantity, 0);
        if (soldQty <= 0) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - soldQty),
        };
      })
    );

    // (b) Save invoice to local sales history & increment sequence
    setInvoices((prev) => [newInvoice, ...prev]);
    setNextInvoiceSeq((seq) => seq + 1);
    appendLog(
      `Sale completed: ${newInvoice.invoiceNumber} (${formatPKR(grandTotal)})`
    );

    // (c) Clear active cart & checkout inputs
    setCart([]);
    setCustomerName('');
    setDiscount({ type: 'flat', value: 0 });
    setAmountTendered(0);

    // (d) Immediately trigger 80mm thermal print
    triggerThermalPrint(newInvoice);
    showToast(`Saved ${newInvoice.invoiceNumber} (${formatPKR(grandTotal)})`);
  };

  // Admin: Void Invoice & Restore Sold Stock
  const handleVoidInvoice = (invoiceId: string) => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target || target.status === 'voided') return;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'voided',
              voidedAt: new Date().toISOString(),
            }
          : inv
      )
    );

    // Restore stock for catalog items
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const returnedQty = target.items
          .filter(
            (item) =>
              item.productId === prod.id ||
              (!item.productId && !item.isCustom && item.name === prod.name)
          )
          .reduce((sum, item) => sum + item.quantity, 0);
        if (returnedQty <= 0) return prod;
        return {
          ...prod,
          stock: prod.stock + returnedQty,
        };
      })
    );

    appendLog(`Voided invoice ${target.invoiceNumber} and restored stock`);
    showToast(`${target.invoiceNumber} voided and stock restored.`);
  };

  // Inventory CRUD handlers
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const created: Product = {
      ...newProd,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setProducts((prev) => [created, ...prev]);
    appendLog(`Added flower item "${created.name}" (Stock: ${created.stock})`);
    showToast(`Added "${created.name}" to inventory.`);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((c) => c.productId !== productId));
    if (target) {
      appendLog(`Removed item "${target.name}" from catalog`);
    }
    showToast('Item removed from catalog.');
  };

  // Staff Management
  const handleAddStaffMember = (name: string, role: 'Admin' | 'Cashier') => {
    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name,
      role,
    };
    setStaff((prev) => [...prev, created]);
    appendLog(`Added ${role} staff profile: ${name}`);
    showToast(`Added ${name} (${role}).`);
  };

  const handleDeleteStaffMember = (id: string) => {
    if (staff.length <= 1) return;
    const removed = staff.find((s) => s.id === id);
    const remaining = staff.filter((s) => s.id !== id);
    setStaff(remaining);
    if (activeStaffId === id && remaining.length > 0) {
      setActiveStaffId(remaining[0].id);
    }
    if (removed) {
      appendLog(`Removed staff profile: ${removed.name}`);
    }
    showToast('Staff profile removed.');
  };

  const handleUpdateAdminConfig = (next: AdminConfig) => {
    if (next.adminPin !== adminConfig.adminPin) {
      appendLog('Admin security PIN updated');
      showToast('Admin PIN updated.');
    } else if (next.lockAdminFeatures !== adminConfig.lockAdminFeatures) {
      appendLog(
        next.lockAdminFeatures
          ? 'Enabled PIN lock for management tabs'
          : 'Disabled PIN lock for management tabs'
      );
    }
    setAdminConfig(next);
  };

  // Backup Restore & Reset handlers
  const handleRestoreBackup = (payload: PosBackupPayload) => {
    setProducts(payload.products);
    setInvoices(payload.invoices);
    setSettings(payload.settings);
    setNextInvoiceSeq(payload.nextInvoiceSequence);
    if (payload.staff && payload.staff.length > 0) {
      setStaff(payload.staff);
      setActiveStaffId(payload.staff[0].id);
    }
    if (payload.adminConfig) {
      setAdminConfig(payload.adminConfig);
    }
    if (payload.activityLogs) {
      setActivityLogs(payload.activityLogs);
    }
    setCart([]);
    appendLog('Restored POS backup from local JSON');
    showToast('Backup restored successfully.');
  };

  const handleResetSampleCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    setCart([]);
    appendLog('Restored sample Fresh Flowers catalog');
    showToast('Sample Fresh Flowers catalog restored.');
  };

  const navTabs: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    protectedTab?: boolean;
  }[] = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Boxes, protectedTab: true },
    { id: 'history', label: 'Sales History', icon: ReceiptText },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, protectedTab: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, protectedTab: true },
  ];

  return (
    <>
      <div className="pos-app-shell min-h-screen bg-[#FAF8F5] text-[#222222] flex flex-col">
        {/* Top Bar Contract: [Brand Wordmark] — [5 Navigation Tabs] — [Primary Contextual Summary] */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EFECE6]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 lg:gap-8">
            {/* Zone 1: Brand Wordmark */}
            <button
              type="button"
              onClick={() => handleTabSelect('pos')}
              className="font-serif text-[22px] font-semibold tracking-tight text-[#173328] whitespace-nowrap shrink-0 text-left"
            >
              {settings.shopName || 'Petal & Sage Boutique'}
            </button>

            {/* Zone 2: 5 Single-line Navigation Tabs */}
            <nav
              aria-label="Primary POS navigation"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar order-3 lg:order-2 w-full lg:w-auto pb-1 lg:pb-0"
            >
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                const showLock = tab.protectedTab && isTerminalLocked;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabSelect(tab.id)}
                    className={`min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#2E4A3E] text-white'
                        : 'text-[#424844] hover:bg-[#F4F0EB] hover:text-[#173328]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {showLock && <Lock className="w-3.5 h-3.5 opacity-70 shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Single Contextual Action (Today's Sales) */}
            <div className="order-2 lg:order-3 shrink-0">
              <button
                type="button"
                onClick={() => handleTabSelect('history')}
                className="min-h-[48px] px-4 rounded-xl bg-[#F4F0EB] hover:bg-[#EAE4DC] text-[#173328] text-sm font-semibold whitespace-nowrap shrink-0 tabular-nums transition-colors"
              >
                Today: {formatPKR(todaySalesTotal)}
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-5">
          {activeTab === 'pos' && (
            <PosBillingView
              products={products}
              cart={cart}
              customerName={customerName}
              discount={discount}
              paymentMethod={paymentMethod}
              amountTendered={amountTendered}
              nextInvoiceSequence={nextInvoiceSeq}
              lowStockThreshold={settings.lowStockThreshold}
              activeCashierName={activeStaffMember?.name}
              requireDiscountPin={adminConfig.requirePinForDiscount && isTerminalLocked}
              onRequestDiscountUnlock={handleRequestDiscountUnlock}
              onCustomerNameChange={setCustomerName}
              onAddProductToCart={handleAddProductToCart}
              onAddCustomItem={handleAddCustomItem}
              onUpdateCartQty={handleUpdateCartQty}
              onClearCart={handleClearCart}
              onDiscountChange={setDiscount}
              onPaymentMethodChange={setPaymentMethod}
              onAmountTenderedChange={setAmountTendered}
              onCompleteAndPrint={handleCompleteAndPrint}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              lowStockThreshold={settings.lowStockThreshold}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'history' && (
            <SalesHistoryView
              invoices={invoices}
              settings={settings}
              onReprintInvoice={triggerThermalPrint}
            />
          )}

          {activeTab === 'admin' && (
            <AdminView
              products={products}
              invoices={invoices}
              staff={staff}
              activeStaffId={activeStaffId}
              adminConfig={adminConfig}
              activityLogs={activityLogs}
              onSetActiveStaffId={(id) => {
                setActiveStaffId(id);
                const chosen = staff.find((s) => s.id === id);
                if (chosen) {
                  appendLog(`Switched active counter cashier to ${chosen.name}`);
                  showToast(`Active cashier: ${chosen.name}`);
                }
              }}
              onAddStaffMember={handleAddStaffMember}
              onDeleteStaffMember={handleDeleteStaffMember}
              onUpdateAdminConfig={handleUpdateAdminConfig}
              onLockTerminal={handleLockTerminal}
              onVoidInvoice={handleVoidInvoice}
              onClearActivityLogs={() => {
                setActivityLogs([]);
                showToast('Activity log cleared.');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsBackupView
              settings={settings}
              products={products}
              invoices={invoices}
              nextInvoiceSequence={nextInvoiceSeq}
              staff={staff}
              adminConfig={adminConfig}
              activityLogs={activityLogs}
              onSaveSettings={(next) => {
                setSettings(next);
                appendLog('Updated shop & 80mm receipt settings');
              }}
              onRestoreBackup={handleRestoreBackup}
              onResetSampleCatalog={handleResetSampleCatalog}
              onNotify={showToast}
            />
          )}
        </main>

        {/* Subtle Non-Intrusive Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#173328] text-white text-sm font-semibold flex items-center gap-2.5 shadow-lg max-w-[90vw]">
            <CheckCircle2 className="w-4 h-4 text-[#CAEAD9] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Admin PIN Unlock Modal */}
      <PinLockModal
        isOpen={pendingPinAction !== null}
        mode="verify"
        title={pendingPinAction?.title || 'Admin PIN'}
        subtitle={pendingPinAction?.subtitle}
        expectedPin={adminConfig.adminPin}
        showDefaultHint
        onSuccess={() => {
          const action = pendingPinAction;
          setPendingPinAction(null);
          action?.onAuthorized();
        }}
        onClose={() => setPendingPinAction(null)}
      />

      {/* Dedicated 80mm Thermal Print Output (hidden on screen, sole content on print) */}
      <ThermalReceipt invoice={printInvoice} settings={settings} />
    </>
  );
}

export default App;
