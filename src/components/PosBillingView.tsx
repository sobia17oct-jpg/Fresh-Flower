import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  Calculator,
  CreditCard,
  Flower2,
  Minus,
  Plus,
  Power,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  CartItem,
  DiscountConfig,
  DiscountType,
  PaymentMethod,
  Product,
  ProductCategory,
} from '../types';
import { PRODUCT_CATEGORIES, formatPKR } from '../data/initialData';
import { formatInvoiceNumber } from '../utils/storage';
import { NumericKeypadModal } from './NumericKeypadModal';
import { CustomItemModal } from './CustomItemModal';

interface PosBillingViewProps {
  products: Product[];
  cart: CartItem[];
  customerName: string;
  discount: DiscountConfig;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  nextInvoiceSequence: number;
  lowStockThreshold: number;
  activeCashierName?: string;
  requireDiscountPin?: boolean;
  onRequestDiscountUnlock?: (onAuthorized: () => void) => void;
  onCustomerNameChange: (name: string) => void;
  onAddProductToCart: (product: Product) => void;
  onAddCustomItem: (name: string, variant: string, price: number) => void;
  onUpdateCartQty: (cartItemId: string, newQty: number) => void;
  onClearCart: () => void;
  onDiscountChange: (discount: DiscountConfig) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onAmountTenderedChange: (amount: number) => void;
  onCompleteAndPrint: () => void;
}

export const PosBillingView: React.FC<PosBillingViewProps> = ({
  products,
  cart,
  customerName,
  discount,
  paymentMethod,
  amountTendered,
  nextInvoiceSequence,
  lowStockThreshold,
  activeCashierName,
  requireDiscountPin = false,
  onRequestDiscountUnlock,
  onCustomerNameChange,
  onAddProductToCart,
  onAddCustomItem,
  onUpdateCartQty,
  onClearCart,
  onDiscountChange,
  onPaymentMethodChange,
  onAmountTenderedChange,
  onCompleteAndPrint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isScreenOff, setIsScreenOff] = useState(false);

  // Keypad modal state
  const [keypadState, setKeypadState] = useState<{
    mode: 'qty' | 'discount' | 'tender' | null;
    cartItemId?: string;
    cartItemName?: string;
    maxQty?: number;
    initialValue: number;
  }>({ mode: null, initialValue: 0 });

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.variant.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  const cartQtyByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      if (item.productId) {
        map[item.productId] = (map[item.productId] || 0) + item.quantity;
      }
    }
    return map;
  }, [cart]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    if (discount.value <= 0 || subtotal <= 0) return 0;
    if (discount.type === 'percent') {
      const pct = Math.min(100, Math.max(0, discount.value));
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, Math.round(discount.value));
  }, [discount, subtotal]);

  const grandTotal = Math.max(0, subtotal - discountAmount);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const changeDue =
    paymentMethod === 'Cash' && amountTendered > grandTotal
      ? amountTendered - grandTotal
      : 0;

  const handleDiscountTypeToggle = (type: DiscountType) => {
    if (type === discount.type) return;
    onDiscountChange({ type, value: 0 });
  };

  const handleOpenQtyPad = (item: CartItem) => {
    const product = item.productId
      ? products.find((p) => p.id === item.productId)
      : undefined;
    setKeypadState({
      mode: 'qty',
      cartItemId: item.id,
      cartItemName: item.name,
      maxQty: product ? product.stock : undefined,
      initialValue: item.quantity,
    });
  };

  const renderCartPanelContent = () => (
    <div className="flex flex-col h-full">
      {/* Ledger Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#EFECE6]">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-[#173328] leading-tight">
            Order Ticket
          </h2>
          <p className="text-xs font-medium text-[#424844] mt-0.5 tabular-nums">
            Next {formatInvoiceNumber(nextInvoiceSequence)} · {totalItemCount}{' '}
            {totalItemCount === 1 ? 'item' : 'items'}
            {activeCashierName ? ` · ${activeCashierName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="min-h-[48px] px-3.5 rounded-xl border border-[#EFECE6] bg-[#FAF8F5] text-sm font-semibold text-[#8B4B58] hover:bg-[#F4F0EB] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsScreenOff(true)}
            aria-label="Turn screen off"
            className="min-h-[48px] px-3.5 rounded-xl border border-[#EFECE6] bg-[#FAF8F5] text-sm font-semibold text-[#2E4A3E] hover:bg-[#F4F0EB] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Power className="w-4 h-4" />
            <span>Screen Off</span>
          </button>
        </div>
      </div>

      {/* Customer Name Field */}
      <div className="px-5 py-3 border-b border-[#EFECE6]">
        <div className="relative flex items-center">
          <User className="w-4 h-4 text-[#7A9A8B] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Customer Name (optional for receipt)"
            className="w-full min-h-[48px] rounded-xl bg-[#F4F0EB] pl-10 pr-10 text-sm text-[#222222] placeholder:text-[#727974] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
          />
          {customerName && (
            <button
              type="button"
              onClick={() => onCustomerNameChange('')}
              aria-label="Clear customer name"
              className="absolute right-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#727974] hover:text-[#222222]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 min-h-[180px] max-h-[38vh] lg:max-h-none">
        {cart.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F0EB] flex items-center justify-center text-[#7A9A8B] mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="font-serif text-lg font-medium text-[#173328]">
              Ticket is empty
            </p>
            <p className="text-sm text-[#424844] mt-1 max-w-[240px]">
              Tap any flower card on the left or create a custom bouquet to begin billing.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="min-h-[68px] py-2.5 px-3 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#222222] truncate">
                  {item.name}
                </p>
                <p className="text-xs text-[#424844] tabular-nums mt-0.5">
                  {formatPKR(item.price)} each
                  {item.isCustom ? ' · Custom' : ''}
                </p>
              </div>

              {/* Touch Quantity Stepper (44px+ hit targets) */}
              <div className="flex items-center bg-white rounded-xl border border-[#EFECE6] p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateCartQty(item.id, item.quantity - 1)}
                  aria-label={`Decrease quantity for ${item.name}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#2E4A3E] hover:bg-[#F4F0EB] active:scale-95 transition-transform"
                >
                  {item.quantity <= 1 ? (
                    <Trash2 className="w-4 h-4 text-[#8B4B58]" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQtyPad(item)}
                  aria-label={`Edit quantity for ${item.name}`}
                  className="min-h-[44px] min-w-[38px] px-1.5 flex items-center justify-center text-base font-bold text-[#173328] hover:bg-[#FAF8F5] rounded-lg tabular-nums"
                >
                  {item.quantity}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCartQty(item.id, item.quantity + 1)}
                  aria-label={`Increase quantity for ${item.name}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#2E4A3E] hover:bg-[#F4F0EB] active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right min-w-[78px] shrink-0">
                <p className="text-[15px] font-bold text-[#173328] tabular-nums">
                  {formatPKR(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout & Totals Panel */}
      <div className="p-5 bg-[#FAF8F5] border-t border-[#EFECE6] rounded-b-3xl space-y-3.5">
        {/* Discount Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[#424844] mr-1">Discount</span>
            <button
              type="button"
              onClick={() => handleDiscountTypeToggle('flat')}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-bold transition-colors ${
                discount.type === 'flat'
                  ? 'bg-[#2E4A3E] text-white'
                  : 'bg-white text-[#424844] border border-[#EFECE6]'
              }`}
            >
              Rs.
            </button>
            <button
              type="button"
              onClick={() => handleDiscountTypeToggle('percent')}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-bold transition-colors ${
                discount.type === 'percent'
                  ? 'bg-[#2E4A3E] text-white'
                  : 'bg-white text-[#424844] border border-[#EFECE6]'
              }`}
            >
              %
            </button>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              const openDiscountPad = () =>
                setKeypadState({
                  mode: 'discount',
                  initialValue: discount.value,
                  maxQty: discount.type === 'percent' ? 100 : subtotal,
                });

              if (requireDiscountPin && onRequestDiscountUnlock) {
                onRequestDiscountUnlock(openDiscountPad);
              } else {
                openDiscountPad();
              }
            }}
            className="min-h-[48px] px-3.5 rounded-xl bg-white border border-[#EFECE6] flex items-center gap-2 text-sm font-semibold text-[#173328] hover:border-[#2E4A3E] disabled:opacity-50 tabular-nums"
          >
            <Calculator className="w-4 h-4 text-[#7A9A8B]" />
            <span>
              {discount.value > 0
                ? discount.type === 'percent'
                  ? `${discount.value}% (-${formatPKR(discountAmount)})`
                  : `-${formatPKR(discountAmount)}`
                : 'Add Discount'}
            </span>
          </button>
        </div>

        {/* Subtotal & Grand Total */}
        <div className="space-y-1.5 pt-1 border-t border-[#EFECE6]">
          <div className="flex items-center justify-between text-sm text-[#424844]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#222222] tabular-nums">
              {formatPKR(subtotal)}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm text-[#8B4B58]">
              <span>
                Discount {discount.type === 'percent' ? `(${discount.value}%)` : ''}
              </span>
              <span className="font-semibold tabular-nums">
                - {formatPKR(discountAmount)}
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-serif text-[20px] font-semibold text-[#173328]">
              Grand Total
            </span>
            <span className="text-[28px] font-bold tracking-tight text-[#173328] tabular-nums">
              {formatPKR(grandTotal)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'Cash', icon: Banknote, label: 'Cash' },
              { id: 'Card', icon: CreditCard, label: 'Card' },
              { id: 'Bank Transfer', icon: Building2, label: 'Transfer' },
            ] as const
          ).map(({ id, icon: Icon, label }) => {
            const active = paymentMethod === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPaymentMethodChange(id)}
                className={`min-h-[48px] px-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#2E4A3E] text-white'
                    : 'bg-white text-[#222222] border border-[#EFECE6] hover:bg-[#F4F0EB]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick-Tender Cash Workflow */}
        {paymentMethod === 'Cash' && cart.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onAmountTenderedChange(grandTotal)}
                className={`min-h-[48px] rounded-xl text-xs font-bold transition-colors ${
                  amountTendered === grandTotal || amountTendered === 0
                    ? 'bg-[#D88C9A]/30 text-[#173328] border border-[#D88C9A]'
                    : 'bg-[#D88C9A]/15 text-[#2E4A3E] hover:bg-[#D88C9A]/25'
                }`}
              >
                Exact
              </button>
              {[1000, 2000, 5000].map((cash) => (
                <button
                  key={cash}
                  type="button"
                  onClick={() => onAmountTenderedChange(cash)}
                  className={`min-h-[48px] rounded-xl text-xs font-bold tabular-nums transition-colors ${
                    amountTendered === cash
                      ? 'bg-[#D88C9A]/30 text-[#173328] border border-[#D88C9A]'
                      : 'bg-[#D88C9A]/15 text-[#2E4A3E] hover:bg-[#D88C9A]/25'
                  }`}
                >
                  {cash.toLocaleString('en-PK')}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs px-1">
              <button
                type="button"
                onClick={() =>
                  setKeypadState({
                    mode: 'tender',
                    initialValue: amountTendered || grandTotal,
                  })
                }
                className="min-h-[36px] font-semibold text-[#2E4A3E] underline underline-offset-2"
              >
                Cash Received: {formatPKR(amountTendered || grandTotal)}
              </button>
              <span className="font-bold text-[#173328] tabular-nums">
                Change: {formatPKR(changeDue)}
              </span>
            </div>
          </div>
        )}

        {/* Primary Complete & Print Receipt Action */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => {
            onCompleteAndPrint();
            setMobileCartOpen(false);
          }}
          className="w-full min-h-[56px] rounded-[14px] bg-[#2E4A3E] text-white font-semibold text-base flex items-center justify-center gap-2.5 hover:bg-[#22382F] active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none transition-all"
        >
          <Printer className="w-5 h-5" />
          <span>Complete &amp; Print Receipt</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-24 lg:pb-6">
      {/* Left Zone: Search, Category Ribbon, Custom Button & Product Grid */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search & Custom Bouquet Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-[#2E4A3E] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roses, lilies, garlands, vases..."
              className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] pl-12 pr-12 text-base text-[#222222] placeholder:text-[#727974] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-1 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg text-[#424844] hover:text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="min-h-[52px] px-5 rounded-xl bg-[#D88C9A]/18 border border-[#D88C9A]/45 text-[#173328] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#D88C9A]/28 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <Flower2 className="w-5 h-5 text-[#8B4B58]" />
            <span>Custom Bouquet / Item</span>
          </button>
        </div>

        {/* Category Filter Ribbon */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[48px] px-5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#2E4A3E] text-[#FAF8F5]'
                    : 'bg-white text-[#222222] border border-[#EAE6DF] hover:bg-[#F4F0EB]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#EFECE6] p-10 text-center">
            <p className="font-serif text-xl font-semibold text-[#173328]">
              No flowers match your filter
            </p>
            <p className="text-sm text-[#424844] mt-1.5">
              Clear your search or tap &ldquo;Custom Bouquet / Item&rdquo; to bill a bespoke stem arrangement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const inCartQty = cartQtyByProductId[product.id] || 0;
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= lowStockThreshold;
              const remainingToAdd = product.stock - inCartQty;
              const imgFailed = imageErrors[product.id] || !product.imageUrl;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOut || remainingToAdd <= 0}
                  onClick={() => onAddProductToCart(product)}
                  className={`group text-left rounded-[14px] bg-white p-3 border transition-all flex flex-col justify-between min-h-[220px] active:scale-[0.98] ${
                    inCartQty > 0
                      ? 'border-[#2E4A3E] ring-1 ring-[#2E4A3E]'
                      : 'border-[#EFECE6] hover:border-[#7A9A8B]'
                  } ${
                    isOut || remainingToAdd <= 0
                      ? 'opacity-55 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-[10px] bg-[#F4F0EB] overflow-hidden mb-3">
                      {!imgFailed ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setImageErrors((prev) => ({ ...prev, [product.id]: true }))
                          }
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F4F0EB] to-[#EAE4DC] text-[#7A9A8B] p-3">
                          <Flower2 className="w-10 h-10 mb-1.5" />
                          <span className="text-xs font-medium text-center text-[#424844]">
                            {product.category}
                          </span>
                        </div>
                      )}

                      {inCartQty > 0 && (
                        <div className="absolute top-2 right-2 min-w-[30px] h-[30px] px-2 rounded-full bg-[#2E4A3E] text-white text-xs font-bold flex items-center justify-center tabular-nums shadow-sm">
                          {inCartQty}
                        </div>
                      )}
                    </div>

                    <h3 className="text-[15px] font-bold text-[#222222] leading-snug line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="text-xs text-[#424844] mt-1 truncate">
                      {product.variant || product.category}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-[#EFECE6] flex items-baseline justify-between gap-2">
                    <span className="text-[16px] font-bold text-[#173328] tabular-nums whitespace-nowrap">
                      {formatPKR(product.price)}
                    </span>

                    {isOut ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ba1a1a]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Out
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ba1a1a] tabular-nums">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {product.stock} left
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-[#424844] tabular-nums">
                        Stock: {product.stock}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Zone (Desktop Persistent Order Ledger) */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col rounded-3xl bg-white border border-[#EFECE6] sticky top-4 max-h-[calc(100vh-108px)] overflow-hidden">
        {renderCartPanelContent()}
      </aside>

      {/* Mobile / Portrait Tablet Sticky Bottom Trigger */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-[#EFECE6]">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="w-full min-h-[54px] px-5 rounded-2xl bg-[#2E4A3E] text-white font-semibold flex items-center justify-between"
        >
          <span className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" />
            <span>
              Order Ticket ({totalItemCount}{' '}
              {totalItemCount === 1 ? 'item' : 'items'})
            </span>
          </span>
          <span className="text-lg font-bold tabular-nums">
            {formatPKR(grandTotal)}
          </span>
        </button>
      </div>

      {/* Mobile / Tablet Order Drawer */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/45 backdrop-blur-[2px]">
          <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-[#DCD9D9] mx-auto" />
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                aria-label="Close order drawer"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-[#F4F0EB] text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderCartPanelContent()}</div>
          </div>
        </div>
      )}

      {/* Custom Bouquet / Item Modal */}
      <CustomItemModal
        isOpen={showCustomModal}
        onAddCustomItem={onAddCustomItem}
        onClose={() => setShowCustomModal(false)}
      />

      {/* Shared Touch Numeric Keypad Modal */}
      <NumericKeypadModal
        isOpen={keypadState.mode !== null}
        title={
          keypadState.mode === 'qty'
            ? `Quantity: ${keypadState.cartItemName || ''}`
            : keypadState.mode === 'discount'
            ? discount.type === 'percent'
              ? 'Percentage Discount'
              : 'Flat Discount (Rs.)'
            : 'Cash Tendered'
        }
        subtitle={
          keypadState.mode === 'qty' && keypadState.maxQty !== undefined
            ? `Available in stock: ${keypadState.maxQty}`
            : keypadState.mode === 'discount'
            ? discount.type === 'percent'
              ? 'Enter discount percentage (0 - 100%)'
              : `Enter flat PKR discount (Max ${formatPKR(subtotal)})`
            : `Grand Total: ${formatPKR(grandTotal)}`
        }
        initialValue={keypadState.initialValue}
        unitPrefix={
          keypadState.mode === 'tender' ||
          (keypadState.mode === 'discount' && discount.type === 'flat')
            ? 'Rs.'
            : undefined
        }
        unitSuffix={
          keypadState.mode === 'discount' && discount.type === 'percent'
            ? '%'
            : undefined
        }
        maxValue={
          keypadState.mode === 'qty'
            ? keypadState.maxQty
            : keypadState.mode === 'discount'
            ? discount.type === 'percent'
              ? 100
              : subtotal
            : undefined
        }
        quickPresets={
          keypadState.mode === 'discount' && discount.type === 'percent'
            ? [
                { label: '5%', value: 5 },
                { label: '10%', value: 10 },
                { label: '15%', value: 15 },
                { label: '20%', value: 20 },
              ]
            : keypadState.mode === 'tender'
            ? [
                { label: 'Exact', value: grandTotal },
                { label: '1,000', value: 1000 },
                { label: '2,000', value: 2000 },
                { label: '5,000', value: 5000 },
              ]
            : undefined
        }
        onConfirm={(val) => {
          if (keypadState.mode === 'qty' && keypadState.cartItemId) {
            onUpdateCartQty(keypadState.cartItemId, Math.floor(val));
          } else if (keypadState.mode === 'discount') {
            onDiscountChange({ ...discount, value: val });
          } else if (keypadState.mode === 'tender') {
            onAmountTenderedChange(val);
          }
          setKeypadState({ mode: null, initialValue: 0 });
        }}
        onClose={() => setKeypadState({ mode: null, initialValue: 0 })}
      />

      {/* Full-Screen Standby / Screen Off Overlay */}
      {isScreenOff && (
        <div
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Screen is off"
        >
          <div className="text-center space-y-6">
            <p className="text-xs font-medium tracking-widest uppercase text-[#525252]">
              Display Standby
            </p>
            <button
              type="button"
              onClick={() => setIsScreenOff(false)}
              className="min-h-[64px] px-8 rounded-2xl bg-[#181818] border border-[#333333] text-[#E5E5E5] font-semibold text-lg inline-flex items-center gap-3 hover:bg-[#242424] active:scale-[0.97] transition-all"
            >
              <Power className="w-5 h-5 text-[#7A9A8B]" />
              <span>Turn Screen On</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
