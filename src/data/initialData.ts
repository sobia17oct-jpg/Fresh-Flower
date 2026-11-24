import { AdminConfig, Product, ProductCategory, ShopSettings, StaffMember } from '../types';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Bouquets',
  'Garlands & Events',
  'Single Stems',
  'Vases & Plants',
];

export const PRESET_FLOWER_IMAGES: { label: string; url: string }[] = [
  { label: 'Red Roses Bunch', url: '/src/assets/images/flower_red_roses_1795516875847.jpg' },
  { label: 'White Lily Bouquet', url: '/src/assets/images/flower_white_lilies_1795516876495.jpg' },
  { label: 'Bridal Car Decor', url: '/src/assets/images/flower_bridal_car_1795516877427.jpg' },
  { label: 'Fresh Jasmine Garland', url: '/src/assets/images/flower_jasmine_garland_1795516877140.jpg' },
  { label: 'Ribbed Glass Vase', url: '/src/assets/images/flower_glass_vase_1795516877570.jpg' },
  { label: 'Blush Peony Bouquet', url: '/src/assets/images/flower_pink_peonies_1795516877787.jpg' },
  { label: 'Golden Sunflowers', url: '/src/assets/images/flower_sunflower_bunch_1795516877574.jpg' },
  { label: 'White Orchid Planter', url: '/src/assets/images/flower_orchid_pot_1795516877643.jpg' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-red-roses',
    name: 'Red Roses Bunch',
    variant: '12 Premium Stems',
    category: 'Bouquets',
    price: 2500,
    costPrice: 1400,
    stock: 24,
    imageUrl: '/src/assets/images/flower_red_roses_1795516875847.jpg',
  },
  {
    id: 'prod-white-lilies',
    name: 'White Lily Bouquet',
    variant: '6 Stems · Linen Wrap',
    category: 'Bouquets',
    price: 3800,
    costPrice: 2200,
    stock: 14,
    imageUrl: '/src/assets/images/flower_white_lilies_1795516876495.jpg',
  },
  {
    id: 'prod-pink-peonies',
    name: 'Blush Peony Bouquet',
    variant: '8 Stems · Atelier Wrap',
    category: 'Bouquets',
    price: 4500,
    costPrice: 2700,
    stock: 8,
    imageUrl: '/src/assets/images/flower_pink_peonies_1795516877787.jpg',
  },
  {
    id: 'prod-bridal-car',
    name: 'Bridal Car Decor',
    variant: 'Full Floral Suite',
    category: 'Garlands & Events',
    price: 12500,
    costPrice: 7500,
    stock: 4,
    imageUrl: '/src/assets/images/flower_bridal_car_1795516877427.jpg',
  },
  {
    id: 'prod-jasmine-garland',
    name: 'Fresh Jasmine Garland',
    variant: 'Hand-Woven Motia',
    category: 'Garlands & Events',
    price: 1200,
    costPrice: 650,
    stock: 30,
    imageUrl: '/src/assets/images/flower_jasmine_garland_1795516877140.jpg',
  },
  {
    id: 'prod-sunflower-bunch',
    name: 'Golden Sunflowers',
    variant: '5 Stems · Twine Tied',
    category: 'Single Stems',
    price: 1900,
    costPrice: 1050,
    stock: 18,
    imageUrl: '/src/assets/images/flower_sunflower_bunch_1795516877574.jpg',
  },
  {
    id: 'prod-glass-vase',
    name: 'Ribbed Glass Vase',
    variant: '24cm Clear Crystal',
    category: 'Vases & Plants',
    price: 1850,
    costPrice: 1100,
    stock: 12,
    imageUrl: '/src/assets/images/flower_glass_vase_1795516877570.jpg',
  },
  {
    id: 'prod-white-orchid',
    name: 'White Phalaenopsis Orchid',
    variant: 'Matte Ceramic Pot',
    category: 'Vases & Plants',
    price: 5200,
    costPrice: 3300,
    stock: 3,
    imageUrl: '/src/assets/images/flower_orchid_pot_1795516877643.jpg',
  },
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: 'Petal & Sage Boutique',
  shopAddress: 'Shop 14, Zamzama Commercial Lane 4, Clifton, Karachi',
  shopPhone: '+92 300 4128950',
  receiptFooter: 'Thank you for blooming with us!',
  lowStockThreshold: 5,
};

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'staff-admin', name: 'Owner (Admin)', role: 'Admin' },
  { id: 'staff-cashier-1', name: 'Zara (Counter)', role: 'Cashier' },
];

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  adminPin: '1234',
  lockAdminFeatures: false,
  requirePinForDiscount: false,
};

export function formatPKR(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs.\u00A0${rounded.toLocaleString('en-PK')}`;
}

export function formatPKRPlain(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}
