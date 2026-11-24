export type ActiveTab = 'pos' | 'inventory' | 'history' | 'admin' | 'settings';

export type ProductCategory =
  | 'Bouquets'
  | 'Garlands & Events'
  | 'Single Stems'
  | 'Vases & Plants';

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer';

export type DiscountType = 'flat' | 'percent';

export interface Product {
  id: string;
  name: string;
  variant: string;
  category: ProductCategory;
  price: number;
  costPrice?: number;
  stock: number;
  imageUrl?: string;
}

export interface CartItem {
  id: string;
  productId: string | null; // null when custom item
  name: string;
  variant: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
  imageUrl?: string;
}

export interface DiscountConfig {
  type: DiscountType;
  value: number;
}

export interface InvoiceItem {
  productId?: string | null;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  total: number;
  isCustom?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string; // ISO string
  customerName: string;
  cashierName?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeDue?: number;
  status?: 'completed' | 'voided';
  voidedAt?: string;
  voidReason?: string;
}

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  receiptFooter: string;
  lowStockThreshold: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Admin' | 'Cashier';
}

export interface AdminConfig {
  adminPin: string;
  lockAdminFeatures: boolean;
  requirePinForDiscount: boolean;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
}

export interface PosBackupPayload {
  version: number;
  exportedAt: string;
  products: Product[];
  invoices: Invoice[];
  settings: ShopSettings;
  nextInvoiceSequence: number;
  staff?: StaffMember[];
  adminConfig?: AdminConfig;
  activityLogs?: ActivityLogEntry[];
}
