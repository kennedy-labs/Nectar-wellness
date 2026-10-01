import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  AlertTriangle,
  Search,
  CheckCircle2,
  Sparkles,
  Filter,
} from 'lucide-react';
import { formatKES } from '../../../lib/utils';
import { Product } from '../../../types';

interface AdminInventoryTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onAddNew: () => void;
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onToggleActive: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onDuplicateProduct: (product: Product) => Promise<void>;
}

export const AdminInventoryTable: React.FC<AdminInventoryTableProps> = ({
  products,
  onEditProduct,
  onAddNew,
  onUpdateStock,
  onToggleActive,
  onDeleteProduct,
  onDuplicateProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract distinct categories
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.categoryId && p.categoryName) {
        map.set(p.categoryId, p.categoryName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchIng = p.ingredients.some((i) => i.toLowerCase().includes(q));
        return matchName || matchDesc || matchIng;
      }
      return true;
    });
  }, [products, selectedCategory, search]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-medium text-base sm:text-lg text-[#172A22]">
              Remedies & Inventory Control
            </h3>
            <span className="text-xs bg-[#EAF0EC] text-[#213F31] font-mono px-2 py-0.5 rounded-md font-semibold">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-[#5D6B62] mt-0.5">
            Create new apothecary items, update stock on hand, edit remedy formulas, or delete discontinued products.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="bg-[#20392D] hover:bg-[#162920] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Remedy</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A978E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search remedy name, herb, or ingredient..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D] text-[#242A24]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#65756B]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D] text-[#242A24]"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#E4E2DA] rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9F8] border-b border-[#EAE8E1] text-[#556358] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Remedy</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock on Hand</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E1] text-[#242E26]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#748279]">
                    No remedies found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stockQuantity <= 0;
                  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-[#FBFBFA] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/src/assets/images/hero_wellness_botanicals_1790820582973.jpg';
                            }}
                            className="w-11 h-11 rounded-lg object-cover bg-[#F0EFEB] border border-[#E8E6DF] shrink-0"
                          />
                          <div className="space-y-0.5">
                            <div className="font-medium text-[#1E2E25]">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2">
                              {product.isFeatured && (
                                <span className="text-[10px] bg-[#E8EFEA] text-[#1E3E2F] font-semibold px-1.5 py-0.2 rounded">
                                  ★ Featured
                                </span>
                              )}
                              <span className="text-[10px] text-[#718076] font-mono">
                                ID: {product.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#526056]">
                        {product.categoryName}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium tabular-nums text-[#1F372C]">
                        {formatKES(product.price)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-[#DAD8CF] rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              onClick={() =>
                                onUpdateStock(
                                  product.id,
                                  Math.max(0, product.stockQuantity - 1)
                                )
                              }
                              title="Decrease stock"
                              className="px-2.5 py-1 text-xs text-[#4F5B52] hover:bg-[#EAE8E1] transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-mono font-semibold min-w-8 text-center tabular-nums">
                              {product.stockQuantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateStock(product.id, product.stockQuantity + 1)
                              }
                              title="Increase stock"
                              className="px-2.5 py-1 text-xs text-[#4F5B52] hover:bg-[#EAE8E1] transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {isOutOfStock ? (
                            <span className="text-[10px] font-semibold text-[#C53030] flex items-center gap-0.5 bg-[#FDF2F2] px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Out</span>
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-semibold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                              Low ({product.stockQuantity})
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded">
                              OK
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onToggleActive(product)}
                          title="Click to toggle availability"
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            product.isActive
                              ? 'bg-[#EBF5EF] text-[#245C38] hover:bg-[#D8EADB]'
                              : 'bg-[#F2F2F2] text-[#777777] hover:bg-[#E5E5E5]'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicateProduct(product)}
                            className="p-1.5 rounded-lg text-[#556358] hover:text-[#172A22] hover:bg-[#EFECE5] transition-colors cursor-pointer"
                            title="Duplicate as new product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-lg text-[#20392D] hover:bg-[#EAF0EC] transition-colors cursor-pointer"
                            title="Edit remedy details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-[#C53030] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                            title="Delete remedy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDF2F2] text-[#C53030] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display font-medium text-lg text-[#172A22]">
                Delete Herbal Remedy?
              </h3>
              <p className="text-xs text-[#5D6B62] mt-1 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{productToDelete.name}"</strong>? It will be removed immediately from both the catalog and the customer storefront.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs rounded-xl border border-[#D5D3CA] text-[#425046] hover:bg-[#F5F4F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs rounded-xl bg-[#C53030] hover:bg-[#9B2C2C] disabled:opacity-50 text-white font-medium transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
