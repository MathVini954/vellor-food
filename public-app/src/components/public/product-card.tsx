"use client";

import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { hasProductCustomizationConfig } from "@/lib/product-customization";
import { useRestaurantStore } from "./restaurant-store-provider";
import type { MenuProductCard } from "@/types/public";

type ProductCardProps = {
  product: MenuProductCard;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, incrementItem, decrementItem, cart } = useRestaurantStore();
  const isCustomizable = hasProductCustomizationConfig(product.customizationConfig);
  const cartQuantity = cart
    .filter((item) => item.productId === product.id)
    .reduce((total, item) => total + item.quantity, 0);

  return (
    <article className="glass-card overflow-hidden rounded-[28px]">
      <div className="aspect-[16/11] w-full bg-slate-100">
        {product.imageUrl ? (
          <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
            Sem imagem
          </div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">{product.name}</h3>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              {product.categoryName}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {product.description || "Sem descricao cadastrada."}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <strong className="text-xl font-semibold text-slate-950">
            {formatCurrency(product.price)}
          </strong>

          {cartQuantity ? (
            <div className="flex items-center gap-2 rounded-full bg-slate-950 px-2 py-1 text-white">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
                type="button"
                onClick={() => decrementItem(product.id)}
              >
                <Minus size={16} />
              </button>
              <span className="min-w-6 text-center text-sm font-semibold">{cartQuantity}</span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
                type="button"
                onClick={() =>
                  isCustomizable ? addItem(product) : incrementItem(product.id)
                }
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="button"
              onClick={() => addItem(product)}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
