import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Copy,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { Category, Product } from '../../../types';

interface AdminProductEditorProps {
  product: Product | null; // null if creating new
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  onDelete?: (productId: string) => Promise<void>;
}

const PRESET_IMAGES = [
  {
    label: 'Himalayan Shilajit Resin (Gold Grade)',
    path: '/src/assets/images/product_shilajit_resin_1790820595253.jpg',
  },
  {
    label: 'Kilifi Moringa Leaf Powder (Organic)',
    path: '/src/assets/images/product_moringa_powder_1790820605379.jpg',
  },
  {
    label: 'Ashwagandha Root Extract (Full Spectrum)',
    path: '/src/assets/images/product_ashwagandha_tincture_1790820615059.jpg',
  },
  {
    label: 'Mau Forest Raw Botanicals & Honey',
    path: '/src/assets/images/hero_wellness_botanicals_1790820582973.jpg',
  },
];

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  product,
  categories,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('1000');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [description, setDescription] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('');
  const [image, setImage] = useState('');
  const [imageMode, setImageMode] = useState<'preset' | 'custom'>('preset');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state whenever the opened product changes
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategoryId(product.categoryId || categories[0]?.id || 'cat_powders');
      setPrice(product.price ? String(product.price) : '1000');
      setStockQuantity(product.stockQuantity !== undefined ? String(product.stockQuantity) : '20');
      setDescription(product.description || '');
      setBenefitsText(product.benefits?.join('\n') || '');
      setIngredientsText(product.ingredients?.join(', ') || '');
      setUsageInstructions(product.usageInstructions || '');
      setImage(product.image || PRESET_IMAGES[0].path);
      const isPreset = PRESET_IMAGES.some((p) => p.path === product.image);
      setImageMode(isPreset ? 'preset' : 'custom');
      setIsFeatured(Boolean(product.isFeatured));
      setIsActive(product.isActive !== false);
    } else {
      // New product defaults
      setName('');
      setCategoryId(categories[0]?.id || 'cat_powders');
      setPrice('1200');
      setStockQuantity('25');
      setDescription('');
      setBenefitsText('Traditionally used to support natural vitality\nCommonly associated with daily wellness');
      setIngredientsText('100% Pure Botanical Extract');
      setUsageInstructions('Take as directed with warm water or herbal infusion.');
      setImage(PRESET_IMAGES[0].path);
      setImageMode('preset');
      setIsFeatured(false);
      setIsActive(true);
    }
    setShowDeleteConfirm(false);
    setErrorMessage('');
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a remedy name.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const benefits = benefitsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const ingredients = ingredientsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave({
        id: product?.id,
        name: name.trim(),
        categoryId,
        categoryName: selectedCat?.name || 'Apothecary Remedy',
        price: Math.max(0, Number(price) || 0),
        stockQuantity: Math.max(0, Number(stockQuantity) || 0),
        description: description.trim(),
        benefits,
        ingredients,
        usageInstructions: usageInstructions.trim(),
        image: image.trim() || PRESET_IMAGES[0].path,
        isFeatured,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save remedy.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(product.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete remedy.');
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      await onSave({
        name: `${name.trim()} (Copy)`,
        categoryId,
        categoryName: selectedCat?.name || 'Apothecary Remedy',
        price: Math.max(0, Number(price) || 0),
        stockQuantity: Math.max(0, Number(stockQuantity) || 0),
        description: description.trim(),
        benefits: benefitsText.split('\n').map((s) => s.trim()).filter(Boolean),
        ingredients: ingredientsText.split(',').map((s) => s.trim()).filter(Boolean),
        usageInstructions: usageInstructions.trim(),
        image: image.trim() || PRESET_IMAGES[0].path,
        isFeatured: false,
        isActive: true,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to duplicate remedy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E6E4DD] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE8E1] flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF1ED] text-[#224032] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-medium text-lg text-[#172A22]">
                {product ? 'Edit Herbal Remedy' : 'Add New Herbal Remedy'}
              </h2>
              <p className="text-[11px] text-[#65736A]">
                {product ? `Managing remedy ID: ${product.id}` : 'Create a new botanical item for customer catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#EFECE5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                Remedy Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pure Himalayan Shilajit Resin"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] text-[#242A24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                  Price (KSh) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] font-mono tabular-nums text-[#242A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                  Stock Units *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] font-mono tabular-nums text-[#242A24]"
                />
              </div>
            </div>

            {/* Image Selection with live preview & custom URL */}
            <div className="sm:col-span-2 space-y-2 p-3.5 bg-[#F9FAF9] rounded-xl border border-[#E3E8E4]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2F3E34] uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#3A624F]" />
                  <span>Product Image</span>
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode('preset');
                      setImage(PRESET_IMAGES[0].path);
                    }}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      imageMode === 'preset'
                        ? 'bg-[#20392D] text-white font-medium'
                        : 'text-[#56655A] hover:bg-[#EAEFEA]'
                    }`}
                  >
                    Preset Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('custom')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      imageMode === 'custom'
                        ? 'bg-[#20392D] text-white font-medium'
                        : 'text-[#56655A] hover:bg-[#EAEFEA]'
                    }`}
                  >
                    Custom URL
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={image}
                  alt="Preview"
                  onError={(e) => {
                    // Fallback to hero
                    (e.target as HTMLImageElement).src = PRESET_IMAGES[0].path;
                  }}
                  className="w-14 h-14 rounded-lg object-cover bg-white border border-[#D5D3CA] shrink-0"
                />

                <div className="flex-1">
                  {imageMode === 'preset' ? (
                    <select
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
                    >
                      {PRESET_IMAGES.map((img) => (
                        <option key={img.path} value={img.path}>
                          {img.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-[#88968C] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/images/herbal-product.jpg"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                Remedy Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed herbal properties, origin, grade, and traditional harvesting context..."
                className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24] leading-relaxed"
              />
            </div>

            {/* Benefits */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                Traditional Wellness Benefits (One per line)
              </label>
              <textarea
                rows={3}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder="Traditionally used to support vitality...&#10;Commonly associated with balanced energy...&#10;Supports natural physical recovery..."
                className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24] leading-relaxed"
              />
              <p className="text-[10px] text-[#6E7D73] mt-1">
                * Regulatory guideline: Please use non-absolute phrasing (e.g. "supports vitality", "traditionally used for").
              </p>
            </div>

            {/* Ingredients */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                Ingredients (Comma separated)
              </label>
              <input
                type="text"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="Organic Ashwagandha root, Vegetable glycerine, Purified spring water..."
                className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            {/* Usage */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2F3E34] uppercase tracking-wide mb-1">
                Suggested Usage Instructions
              </label>
              <input
                type="text"
                value={usageInstructions}
                onChange={(e) => setUsageInstructions(e.target.value)}
                placeholder="e.g. Dissolve pea-sized resin in warm water or milk once daily morning."
                className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#28382E]">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded-sm accent-[#20392D] w-4 h-4 cursor-pointer"
                />
                <span>Featured on Homepage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#28382E]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-sm accent-[#20392D] w-4 h-4 cursor-pointer"
                />
                <span>Active (Available for purchase on storefront)</span>
              </label>
            </div>
          </div>

          {/* Delete Confirmation Box if triggered */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9B1C1C]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <p className="text-xs text-[#7A1F1F]">
                Are you sure you want to permanently remove <strong>"{product?.name}"</strong> from the apothecary catalog? This action cannot be reversed.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="bg-[#C53030] hover:bg-[#9B2C2C] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Remedy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-white border border-[#D5D3CA] text-xs px-3 py-1.5 rounded-lg text-[#334237] hover:bg-[#F2F1ED] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-[#EAE8E1] flex flex-wrap items-center justify-between gap-3">
            <div>
              {product && !showDeleteConfirm && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-[#C53030] hover:bg-[#FDF2F2] px-3 py-2 rounded-lg border border-[#F6D0D0] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Remedy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDuplicate}
                    disabled={saving}
                    className="text-xs text-[#3A4E41] hover:bg-[#F0F4F1] px-3 py-2 rounded-lg border border-[#D3DED6] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate as New</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-4 py-2.5 rounded-xl border border-[#D5D3CA] text-[#425046] hover:bg-[#F5F4F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7E9386] text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : product ? 'Save Changes' : 'Create Remedy'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
