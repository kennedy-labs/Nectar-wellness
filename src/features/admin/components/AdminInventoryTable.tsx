import React from 'react';
import { Plus, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatKES } from '../../../lib/utils';
import { Product } from '../../../types';

interface AdminInventoryTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onAddNew: () => void;
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onToggleActive: (product: Product) => Promise<void>;
}

export const AdminInventoryTable: React.FC<AdminInventoryTableProps> = ({
  products,
  onEditProduct,
  onAddNew,
  onUpdateStock,
  onToggleActive,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-medium text-base text-[#172A22]">
            Inventory & Catalog Management
          </h3>
          <p className="text-xs text-[#5D6B62]">
            Track inventory levels, update stock on hand, and edit remedy specifications.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="bg-[#20392D] hover:bg-[#162920] text-white px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Remedy</span>
        </button>
      </div>

      <div className="border border-[#E6E4DD] rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9F8] border-b border-[#EAE8E1] text-[#556358] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Remedy</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E1] text-[#242E26]">
              {products.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

                return (
                  <tr key={product.id} className="hover:bg-[#FBFBFA] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-[#F0EFEB] shrink-0"
                        />
                        <div>
                          <div className="font-medium text-[#1E2E25]">
                            {product.name}
                          </div>
                          {product.isFeatured && (
                            <span className="text-[10px] text-[#2C4C3D] font-semibold">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#526056]">
                      {product.categoryName}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium tabular-nums text-[#1F372C]">
                      {formatKES(product.price)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#DAD8CF] rounded-md bg-white">
                          <button
                            onClick={() =>
                              onUpdateStock(
                                product.id,
                                Math.max(0, product.stockQuantity - 1)
                              )
                            }
                            className="px-2 py-0.5 text-xs text-[#4F5B52] hover:bg-[#EAE8E1] transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-mono font-medium min-w-6 text-center tabular-nums">
                            {product.stockQuantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateStock(product.id, product.stockQuantity + 1)
                            }
                            className="px-2 py-0.5 text-xs text-[#4F5B52] hover:bg-[#EAE8E1] transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {isOutOfStock ? (
                          <span className="text-[10px] font-semibold text-[#C53030] flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Out</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-semibold text-[#B45309]">
                            Low
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#2E7D32]">
                            OK
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleActive(product)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          product.isActive
                            ? 'bg-[#EBF5EF] text-[#245C38]'
                            : 'bg-[#F2F2F2] text-[#777777]'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onEditProduct(product)}
                        className="p-1.5 rounded-lg text-[#556358] hover:text-[#172A22] hover:bg-[#EFECE5] transition-colors cursor-pointer"
                        title="Edit details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
