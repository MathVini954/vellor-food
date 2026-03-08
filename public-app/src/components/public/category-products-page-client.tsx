"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Plus, Search } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type {
  MenuCategoryPreview,
  PublicCategoryPageData,
  PublicRestaurant,
} from "@/types/public";
import { TopCartButton } from "./top-cart-button";
import { useRestaurantStore } from "./restaurant-store-provider";

type CategoryProductsPageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  category: PublicCategoryPageData;
  categories: MenuCategoryPreview[];
};

export function CategoryProductsPageClient({
  slug,
  restaurant,
  category,
  categories,
}: CategoryProductsPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { addItem, cart, isFavorite, toggleFavorite } = useRestaurantStore();

  const filteredProducts = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return category.products;
    }

    return category.products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [category.products, search]);

  const cartLookup = useMemo(() => {
    const lookup = new Map<string, number>();

    cart.forEach((item) => {
      lookup.set(item.productId, (lookup.get(item.productId) ?? 0) + item.quantity);
    });

    return lookup;
  }, [cart]);

  useEffect(() => {
    router.prefetch(`/r/${slug}/menu`);
    router.prefetch(`/r/${slug}/checkout`);
    categories.slice(0, 6).forEach((item) => {
      router.prefetch(`/r/${slug}/menu/${item.id}`);
    });
    category.products.slice(0, 6).forEach((product) => {
      router.prefetch(`/r/${slug}/produto/${product.id}`);
    });
  }, [categories, category.products, router, slug]);

  return (
    <div className="px-5 pb-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/r/${slug}/menu`}
            prefetch
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm text-slate-400">{restaurant.name}</p>
            <h1 className="text-[22px] font-bold text-slate-900">Cardapio</h1>
          </div>
        </div>
        <TopCartButton slug={slug} />
      </header>

      <label className="mt-5 flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <Search size={17} className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
          placeholder="Buscar pratos desta categoria"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/r/${slug}/menu/${item.id}`}
            prefetch
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
              item.id === category.id
                ? "bg-[#e3342f] text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <section className="mt-5 space-y-3">
        {filteredProducts.map((product) => {
          const quantity = cartLookup.get(product.id) ?? 0;

          return (
            <article
              key={product.id}
              className="rounded-[24px] bg-white p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start gap-3">
                <Link
                  href={`/r/${slug}/produto/${product.id}`}
                  prefetch
                  className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#f8efe4]"
                >
                  {product.imageUrl ? (
                    <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} />
                  ) : null}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/r/${slug}/produto/${product.id}`} prefetch>
                        <h3 className="truncate text-[15px] font-bold text-slate-900">{product.name}</h3>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                        {product.description || "Prato cadastrado no cardapio do restaurante."}
                      </p>
                    </div>
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                        isFavorite(product.id)
                          ? "border-[#ffd4d1] bg-[#fff1ef] text-[#e3342f]"
                          : "border-slate-200 text-slate-400"
                      }`}
                      type="button"
                      aria-label="Favoritar produto"
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart size={14} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[17px] font-bold text-[#178447]">
                      {formatCurrency(product.price)}
                    </span>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e3342f] text-white"
                      type="button"
                      onClick={() => addItem(product)}
                    >
                      {quantity ? <span className="text-xs font-semibold">{quantity}</span> : <Plus size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!filteredProducts.length ? (
          <div className="rounded-[24px] bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            Nenhum item encontrado nesta categoria.
          </div>
        ) : null}
      </section>
    </div>
  );
}
