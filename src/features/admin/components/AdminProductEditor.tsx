import React, { useState } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { Category, Product } from '../../../types';

interface AdminProductEditorProps {
  product: Product | null; // null if creating new
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
}

const PRESET_IMAGES = [
  { label: 'Himalayan Shilajit Resin', path: '/src/assets/images/product_shilajit_resin_1790820595253.jpg' },
  { label: 'Kilifi Moringa Leaf Powder', path: '/src/assets/images/product_moringa_powder_1790820605379.jpg' },
  { label: 'Ashwagandha Root Extract', path: '/src/assets/images/product_ashwagandha_tincture_1790820615059.jpg' },
  { label: 'Mau Forest Botanicals & Honey', path: '/src/assets/images/hero_wellness_botanicals_1790820582973.jpg' },
];

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  product,
  categories,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || 'cat_powders');
  const [price, setPrice] = useState(product?.price ? String(product.price) : '1000');
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity ? String(product.stockQuantity) : '20');
  const [description, setDescription] = useState(product?.description || '');
  const [benefitsText, setBenefitsText] = useState(product?.benefits?.join('\n') || '');
  const [ingredientsText, setIngredientsText] = useState(product?.ingredients?.join(', ') || '');
  const [usageInstructions, setUsageInstructions] = useState(product?.usageInstructions || '');
  const [image, setImage] = useState(product?.image || PRESET_IMAGES[0].path);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isActive, setIsActive] = useState(product?.isActive !== false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
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
        categoryName: selectedCat?.name || 'Apothecary',
        price: Number(price) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        description: description.trim(),
        benefits,
        ingredients,
        usageInstructions: usageInstructions.trim(),
        image: image.trim(),
        isFeatured,
        isActive,
      });
      onClose();
    } catch (err) {
      console.error(err);
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
          <h2 className="font-display font-medium text-lg text-[#172A22]">
            {product ? 'Edit Herbal Remedy' : 'Add New Herbal Remedy'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#EFECE5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Remedy Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pure Himalayan Shilajit Resin"
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Price (KSh) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] font-mono tabular-nums text-[#242A24]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Current Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] font-mono tabular-nums text-[#242A24]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Product Image Preset / Path
              </label>
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
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Product Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed herbal description, origin, and formulation details..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Traditional Wellness Benefits (One per line - compliant wording)
              </label>
              <textarea
                rows={3}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder="Traditionally used to support...&#10;Commonly associated with vitality...&#10;Supports natural digestion..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Botanical Ingredients (Comma separated)
              </label>
              <input
                type="text"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="Organic Ashwagandha root, Vegetable glycerine..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#3A463D] mb-1">
                Suggested Usage Instructions
              </label>
              <input
                type="text"
                value={usageInstructions}
                onChange={(e) => setUsageInstructions(e.target.value)}
                placeholder="e.g. Dissolve a pea-sized amount in warm water every morning..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white outline-none focus:border-[#2D4C3D] text-[#242A24]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#28382E]">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded-sm accent-[#20392D]"
                />
                <span>Featured on Homepage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#28382E]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-sm accent-[#20392D]"
                />
                <span>Active (Available for purchase)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE8E1] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4D5A50] hover:bg-[#F2F1EB] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-medium bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Remedy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
