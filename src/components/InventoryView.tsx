import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  Edit3,
  Flower2,
  Minus,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import {
  PRESET_FLOWER_IMAGES,
  PRODUCT_CATEGORIES,
  formatPKR,
} from '../data/initialData';
import { NumericKeypadModal } from './NumericKeypadModal';
import { ConfirmModal } from './ConfirmModal';

interface InventoryViewProps {
  products: Product[];
  lowStockThreshold: number;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  lowStockThreshold,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Bouquets');
  const [price, setPrice] = useState<number>(2000);
  const [costPrice, setCostPrice] = useState<number>(1100);
  const [stock, setStock] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState<string>(PRESET_FLOWER_IMAGES[0].url);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Touch Keypad state for quick stock/price edits
  const [keypadTarget, setKeypadTarget] = useState<{
    mode: 'row-stock' | 'row-price' | 'form-price' | 'form-cost' | 'form-stock' | null;
    product?: Product;
    initialValue: number;
  }>({ mode: null, initialValue: 0 });

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= lowStockThreshold).length,
    [products, lowStockThreshold]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (filterMode === 'low' && p.stock > lowStockThreshold) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.variant.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, filterMode, lowStockThreshold]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setVariant('');
    setCategory('Bouquets');
    setPrice(2000);
    setCostPrice(1100);
    setStock(15);
    setImageUrl(PRESET_FLOWER_IMAGES[0].url);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setVariant(product.variant);
    setCategory(product.category);
    setPrice(product.price);
    setCostPrice(product.costPrice ?? Math.round(product.price * 0.58));
    setStock(product.stock);
    setImageUrl(product.imageUrl || PRESET_FLOWER_IMAGES[0].url);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a flower item name.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Price must be greater than Rs. 0.');
      return;
    }
    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        variant: variant.trim(),
        category,
        price: Math.round(price),
        costPrice: Math.max(0, Math.round(costPrice)),
        stock: Math.max(0, Math.floor(stock)),
        imageUrl,
      });
    } else {
      onAddProduct({
        name: name.trim(),
        variant: variant.trim(),
        category,
        price: Math.round(price),
        costPrice: Math.max(0, Math.round(costPrice)),
        stock: Math.max(0, Math.floor(stock)),
        imageUrl,
      });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Summary & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-white p-5 border border-[#EFECE6]">
        <div>
          <h1 className="font-serif text-[26px] font-semibold text-[#173328] leading-tight">
            Flower Inventory &amp; Daily Stock
          </h1>
          <p className="text-sm text-[#424844] mt-1">
            {products.length} catalog items ·{' '}
            <span
              className={
                lowStockCount > 0 ? 'font-bold text-[#ba1a1a]' : 'text-[#424844]'
              }
            >
              {lowStockCount} low-stock alert{lowStockCount === 1 ? '' : 's'} (≤{' '}
              {lowStockThreshold} units)
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="min-h-[52px] px-6 rounded-xl bg-[#2E4A3E] text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#22382F] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add Flower Item</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 flex items-center">
          <Search className="w-5 h-5 text-[#2E4A3E] absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory by name, stem count, or category..."
            className="w-full min-h-[52px] rounded-xl bg-white pl-12 pr-12 text-base text-[#222222] placeholder:text-[#727974] border border-[#EFECE6] focus:border-[#2E4A3E] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear inventory search"
              className="absolute right-1 min-h-[48px] min-w-[48px] flex items-center justify-center text-[#424844]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`min-h-[52px] px-5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-[#2E4A3E] text-white'
                : 'bg-white text-[#222222] border border-[#EFECE6] hover:bg-[#F4F0EB]'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('low')}
            className={`min-h-[52px] px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              filterMode === 'low'
                ? 'bg-[#ba1a1a] text-white'
                : 'bg-white text-[#ba1a1a] border border-[#ffdad6] hover:bg-[#ffdad6]/40'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Inventory Cards / Rows */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#EFECE6] p-10 text-center">
            <p className="font-serif text-xl font-semibold text-[#173328]">
              No inventory items found
            </p>
            <p className="text-sm text-[#424844] mt-1">
              Adjust your search filter or add a new flower product above.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isOut = product.stock <= 0;
            const isLow = product.stock <= lowStockThreshold;

            return (
              <div
                key={product.id}
                className={`rounded-2xl p-4 border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isLow
                    ? 'bg-[#FFF5F5] border-[#ba1a1a]/40'
                    : 'bg-white border-[#EFECE6]'
                }`}
              >
                {/* Item Thumbnail + Identity */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-[#F4F0EB] overflow-hidden shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Flower2 className="w-7 h-7 text-[#7A9A8B]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h3 className="text-base font-bold text-[#222222] truncate">
                        {product.name}
                      </h3>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-0.5 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {isOut ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#424844] mt-0.5 truncate">
                      {product.category}
                      {product.variant ? ` · ${product.variant}` : ''}
                    </p>
                  </div>
                </div>

                {/* Touch Price & Stock Controls */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
                  {/* Tap Price to Edit */}
                  <button
                    type="button"
                    onClick={() =>
                      setKeypadTarget({
                        mode: 'row-price',
                        product,
                        initialValue: product.price,
                      })
                    }
                    className="min-h-[48px] px-4 rounded-xl bg-[#F4F0EB] hover:bg-[#EAE4DC] text-left flex items-center gap-2 transition-colors"
                  >
                    <div>
                      <span className="block text-[11px] font-semibold text-[#424844]">
                        Price
                      </span>
                      <span className="text-base font-bold text-[#173328] tabular-nums">
                        {formatPKR(product.price)}
                      </span>
                    </div>
                    <Calculator className="w-4 h-4 text-[#7A9A8B]" />
                  </button>

                  {/* Quick - / Qty / + Stock Stepper */}
                  <div className="flex items-center bg-[#F4F0EB] rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProduct({
                          ...product,
                          stock: Math.max(0, product.stock - 1),
                        })
                      }
                      aria-label={`Decrease stock for ${product.name}`}
                      className="min-h-[48px] min-w-[48px] rounded-lg bg-white text-[#2E4A3E] flex items-center justify-center hover:bg-[#FAF8F5] active:scale-95 transition-transform"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setKeypadTarget({
                          mode: 'row-stock',
                          product,
                          initialValue: product.stock,
                        })
                      }
                      className={`min-h-[48px] min-w-[74px] px-3 text-center flex flex-col justify-center ${
                        isLow ? 'text-[#ba1a1a]' : 'text-[#173328]'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                        Stock
                      </span>
                      <span className="text-lg font-bold leading-none tabular-nums">
                        {product.stock}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProduct({
                          ...product,
                          stock: product.stock + 1,
                        })
                      }
                      aria-label={`Increase stock for ${product.name}`}
                      className="min-h-[48px] min-w-[48px] rounded-lg bg-white text-[#2E4A3E] flex items-center justify-center hover:bg-[#FAF8F5] active:scale-95 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      aria-label={`Edit ${product.name}`}
                      className="min-h-[48px] min-w-[48px] px-3.5 rounded-xl border border-[#EFECE6] bg-white text-[#2E4A3E] font-semibold text-sm flex items-center gap-1.5 hover:bg-[#F4F0EB]"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      aria-label={`Delete ${product.name}`}
                      className="min-h-[48px] min-w-[48px] rounded-xl border border-[#ffdad6] bg-white text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffdad6]/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Flower Item Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-6 border border-[#EFECE6] max-h-[92vh] overflow-y-auto"
            style={{ boxShadow: '0 12px 36px rgba(46, 74, 62, 0.14)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-serif text-[22px] font-semibold text-[#173328]">
                  {editingProduct ? 'Edit Flower Item' : 'Add New Flower Item'}
                </h2>
                <p className="text-sm text-[#424844]">
                  Saved locally in your browser for offline billing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close form"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-[#F4F0EB] text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                  Item Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError('');
                  }}
                  placeholder="e.g. Lavender & White Rose Bouquet"
                  className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                    Stem Count / Note
                  </label>
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="e.g. 12 Stems · Kraft Wrap"
                    className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-4 text-base text-[#222222] border border-transparent focus:border-[#2E4A3E] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                    Selling Price (Rs.)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setKeypadTarget({ mode: 'form-price', initialValue: price })
                    }
                    className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-3.5 flex items-center justify-between text-left hover:bg-[#EAE4DC]"
                  >
                    <span className="text-base font-bold text-[#173328] tabular-nums">
                      {formatPKR(price)}
                    </span>
                    <Calculator className="w-4 h-4 text-[#2E4A3E]" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                    Cost Price (Rs.)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setKeypadTarget({ mode: 'form-cost', initialValue: costPrice })
                    }
                    className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-3.5 flex items-center justify-between text-left hover:bg-[#EAE4DC]"
                  >
                    <span className="text-base font-bold text-[#424844] tabular-nums">
                      {formatPKR(costPrice)}
                    </span>
                    <Calculator className="w-4 h-4 text-[#7A9A8B]" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-1.5">
                    Stock Qty
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setKeypadTarget({ mode: 'form-stock', initialValue: stock })
                    }
                    className="w-full min-h-[52px] rounded-xl bg-[#F4F0EB] px-3.5 flex items-center justify-between text-left hover:bg-[#EAE4DC]"
                  >
                    <span className="text-base font-bold text-[#173328] tabular-nums">
                      {stock} units
                    </span>
                    <Calculator className="w-4 h-4 text-[#2E4A3E]" />
                  </button>
                </div>
              </div>

              {/* Image Picker (Offline Local Assets or Local Upload) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-[#222222]">
                    Product Photo
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[40px] px-3 rounded-lg bg-[#F4F0EB] text-xs font-semibold text-[#2E4A3E] flex items-center gap-1.5 hover:bg-[#EAE4DC]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo from PC</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_FLOWER_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        imageUrl === img.url
                          ? 'border-[#2E4A3E] scale-105'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-sm font-medium text-[#ba1a1a] bg-[#ffdad6] px-4 py-2.5 rounded-xl">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="min-h-[54px] rounded-xl border border-[#2E4A3E] bg-[#FAF8F5] text-[#2E4A3E] font-semibold text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[54px] rounded-xl bg-[#2E4A3E] text-white font-semibold text-base hover:bg-[#22382F]"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Flower Item?"
        message={`Remove "${deleteTarget?.name || ''}" from your catalog? Past sales invoices will remain intact.`}
        confirmLabel="Delete Item"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteProduct(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Touch Numeric Keypad for Stock & Price */}
      <NumericKeypadModal
        isOpen={keypadTarget.mode !== null}
        title={
          keypadTarget.mode === 'row-price' || keypadTarget.mode === 'form-price'
            ? 'Enter Selling Price (Rs.)'
            : keypadTarget.mode === 'form-cost'
            ? 'Enter Cost Price (Rs.)'
            : 'Update Stock Quantity'
        }
        subtitle={keypadTarget.product?.name}
        initialValue={keypadTarget.initialValue}
        unitPrefix={
          keypadTarget.mode === 'row-price' ||
          keypadTarget.mode === 'form-price' ||
          keypadTarget.mode === 'form-cost'
            ? 'Rs.'
            : undefined
        }
        unitSuffix={
          keypadTarget.mode === 'row-stock' || keypadTarget.mode === 'form-stock'
            ? 'units'
            : undefined
        }
        onConfirm={(val) => {
          if (keypadTarget.mode === 'row-price' && keypadTarget.product) {
            onUpdateProduct({ ...keypadTarget.product, price: Math.round(val) });
          } else if (keypadTarget.mode === 'row-stock' && keypadTarget.product) {
            onUpdateProduct({
              ...keypadTarget.product,
              stock: Math.max(0, Math.floor(val)),
            });
          } else if (keypadTarget.mode === 'form-price') {
            setPrice(Math.round(val));
          } else if (keypadTarget.mode === 'form-cost') {
            setCostPrice(Math.round(val));
          } else if (keypadTarget.mode === 'form-stock') {
            setStock(Math.max(0, Math.floor(val)));
          }
          setKeypadTarget({ mode: null, initialValue: 0 });
        }}
        onClose={() => setKeypadTarget({ mode: null, initialValue: 0 })}
      />
    </div>
  );
};
