import {
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_SHOP_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_STAFF,
} from '../data/initialData';
import {
  ActivityLogEntry,
  AdminConfig,
  Invoice,
  PosBackupPayload,
  Product,
  ShopSettings,
  StaffMember,
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'petal_sage_pos_products_v1',
  INVOICES: 'petal_sage_pos_invoices_v1',
  SETTINGS: 'petal_sage_pos_settings_v1',
  INVOICE_SEQ: 'petal_sage_pos_invoice_seq_v1',
  STAFF: 'petal_sage_pos_staff_v1',
  ACTIVE_STAFF_ID: 'petal_sage_pos_active_staff_v1',
  ADMIN_CONFIG: 'petal_sage_pos_admin_config_v1',
  ACTIVITY_LOGS: 'petal_sage_pos_activity_logs_v1',
} as const;

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback to initial catalog if storage is corrupted
  }
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback
  }
  return [];
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}

export function loadSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SHOP_SETTINGS));
      return DEFAULT_SHOP_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_SHOP_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // Fallback
  }
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SHOP_SETTINGS));
  return DEFAULT_SHOP_SETTINGS;
}

export function saveSettings(settings: ShopSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadNextInvoiceSequence(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICE_SEQ);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVOICE_SEQ, '1001');
      return 1001;
    }
    const num = Number(raw);
    if (Number.isFinite(num) && num >= 1) {
      return Math.floor(num);
    }
  } catch {
    // Fallback
  }
  return 1001;
}

export function saveNextInvoiceSequence(seq: number): void {
  localStorage.setItem(STORAGE_KEYS.INVOICE_SEQ, String(seq));
}

export function loadStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback
  }
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  return INITIAL_STAFF;
}

export function saveStaff(staff: StaffMember[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
}

export function loadActiveStaffId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_STAFF_ID);
    if (raw) return raw;
  } catch {
    // Fallback
  }
  return INITIAL_STAFF[0].id;
}

export function saveActiveStaffId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF_ID, id);
}

export function loadAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(DEFAULT_ADMIN_CONFIG));
      return DEFAULT_ADMIN_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_ADMIN_CONFIG,
        ...parsed,
      };
    }
  } catch {
    // Fallback
  }
  localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(DEFAULT_ADMIN_CONFIG));
  return DEFAULT_ADMIN_CONFIG;
}

export function saveAdminConfig(config: AdminConfig): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(config));
}

export function loadActivityLogs(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback
  }
  return [];
}

export function saveActivityLogs(logs: ActivityLogEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs.slice(0, 150)));
}

export function formatInvoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(4, '0')}`;
}

export function buildBackupPayload(
  products: Product[],
  invoices: Invoice[],
  settings: ShopSettings,
  nextInvoiceSequence: number,
  staff?: StaffMember[],
  adminConfig?: AdminConfig,
  activityLogs?: ActivityLogEntry[]
): PosBackupPayload {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    products,
    invoices,
    settings,
    nextInvoiceSequence,
    staff,
    adminConfig,
    activityLogs,
  };
}

export function parseBackupPayload(jsonText: string): PosBackupPayload {
  const data = JSON.parse(jsonText);
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file format.');
  }
  if (!Array.isArray(data.products) || !Array.isArray(data.invoices) || !data.settings) {
    throw new Error('Backup file is missing required products, invoices, or settings data.');
  }
  const validatedProducts: Product[] = data.products.map((p: Partial<Product>, idx: number) => ({
    id: typeof p.id === 'string' && p.id ? p.id : `restored-${Date.now()}-${idx}`,
    name: typeof p.name === 'string' && p.name ? p.name : 'Unnamed Flower Item',
    variant: typeof p.variant === 'string' ? p.variant : '',
    category:
      p.category === 'Bouquets' ||
      p.category === 'Garlands & Events' ||
      p.category === 'Single Stems' ||
      p.category === 'Vases & Plants'
        ? p.category
        : 'Bouquets',
    price: Number.isFinite(Number(p.price)) ? Math.max(0, Number(p.price)) : 0,
    costPrice: Number.isFinite(Number(p.costPrice))
      ? Math.max(0, Number(p.costPrice))
      : undefined,
    stock: Number.isFinite(Number(p.stock)) ? Math.max(0, Math.floor(Number(p.stock))) : 0,
    imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
  }));

  const validatedSettings: ShopSettings = {
    shopName:
      typeof data.settings.shopName === 'string' && data.settings.shopName
        ? data.settings.shopName
        : DEFAULT_SHOP_SETTINGS.shopName,
    shopAddress:
      typeof data.settings.shopAddress === 'string'
        ? data.settings.shopAddress
        : DEFAULT_SHOP_SETTINGS.shopAddress,
    shopPhone:
      typeof data.settings.shopPhone === 'string'
        ? data.settings.shopPhone
        : DEFAULT_SHOP_SETTINGS.shopPhone,
    receiptFooter:
      typeof data.settings.receiptFooter === 'string' && data.settings.receiptFooter
        ? data.settings.receiptFooter
        : DEFAULT_SHOP_SETTINGS.receiptFooter,
    lowStockThreshold: Number.isFinite(Number(data.settings.lowStockThreshold))
      ? Math.max(1, Math.floor(Number(data.settings.lowStockThreshold)))
      : DEFAULT_SHOP_SETTINGS.lowStockThreshold,
  };

  const nextSeq = Number.isFinite(Number(data.nextInvoiceSequence))
    ? Math.max(1, Math.floor(Number(data.nextInvoiceSequence)))
    : 1001 + data.invoices.length;

  return {
    version: 2,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    products: validatedProducts,
    invoices: data.invoices as Invoice[],
    settings: validatedSettings,
    nextInvoiceSequence: nextSeq,
    staff: Array.isArray(data.staff) ? (data.staff as StaffMember[]) : undefined,
    adminConfig:
      data.adminConfig && typeof data.adminConfig === 'object'
        ? ({ ...DEFAULT_ADMIN_CONFIG, ...data.adminConfig } as AdminConfig)
        : undefined,
    activityLogs: Array.isArray(data.activityLogs)
      ? (data.activityLogs as ActivityLogEntry[])
      : undefined,
  };
}
