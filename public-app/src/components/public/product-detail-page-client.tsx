"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PublicProductDetail, PublicRestaurant } from "@/types/public";
import { TopCartButton } from "./top-cart-button";
import { useRestaurantStore } from "./restaurant-store-provider";

type ProductDetailPageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  product: PublicProductDetail;
};

export function ProductDetailPageClient({
  slug,
  restaurant,
  product,
}: ProductDetailPageClientProps) {
  const router = useRouter();
  const { addItem, decrementItem, incrementItem, cart, isFavorite, toggleFavorite } = useRestaurantStore();
  const cartQuantity = cart
    .filter((item) => item.productId === product.id)
    .reduce((total, item) => total + item.quantity, 0);
  const categoryHref = `/r/${slug}/menu/${product.categoryId}`;

  useEffect(() => {
    router.prefetch(categoryHref);
    router.prefetch(`/r/${slug}/checkout`);
    product.relatedProducts.slice(0, 4).forEach((relatedProduct) => {
      router.prefetch(`/r/${slug}/produto/${relatedProduct.id}`);
    });
  }, [categoryHref, product.relatedProducts, router, slug]);

  return (
    <>
      <div className="relative">
        <div className="relative aspect-[1/1.08] overflow-hidden bg-[#1f2937]">
          {product.imageUrl ? (
            <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} />
          ) : null}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
            <Link
              href={categoryHref}
              prefetch
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <button
                className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur ${
                  isFavorite(product.id)
                    ? "border-[#ffd4d1] bg-[#fff1ef] text-[#e3342f]"
                    : "border-white/20 bg-black/25 text-white"
                }`}
                type="button"
                aria-label="Favoritar"
                onClick={() => toggleFavorite(product.id)}
              >
                <Heart size={18} fill={isFavorite(product.id) ? "currentColor" : "none"} />
              </button>
              <TopCartButton slug={slug} dark />
            </div>
          </div>
        </div>

        <div className="-mt-8 rounded-t-[34px] bg-[#fff9f4] px-5 pb-32 pt-6 shadow-[0_-18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {product.categoryName}
              </p>
              <h1 className="mt-2 text-[30px] font-bold leading-tight text-slate-900">{product.name}</h1>
              <p className="mt-2 text-sm text-slate-500">{restaurant.name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fff1ef] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#b5302c]">
              {product.isRestaurantOpen ? "Disponivel" : "Loja fechada"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-[#fff1ef] px-3 py-2 font-semibold text-[#e3342f]">
              {product.isRestaurantOpen ? "Aberto agora" : "Fechado no momento"}
            </span>
            <span className="rounded-full bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              {product.deliveryFee === 0
                ? "Entrega base gratis"
                : `Entrega base ${formatCurrency(product.deliveryFee)}`}
            </span>
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Descricao</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {product.description || "Este prato ainda nao possui uma descricao detalhada cadastrada."}
            </p>
          </section>

          {product.customizationOptions.length ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                Personalizacoes disponiveis
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.customizationOptions.map((option) => (
                  <span
                    key={option}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  >
                    Sem {option}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {product.relatedCategories.length ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Explore tambem</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.relatedCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/r/${slug}/menu/${category.id}`}
                    prefetch
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {product.relatedProducts.length ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Mais dessa categoria</h2>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {product.relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    href={`/r/${slug}/produto/${relatedProduct.id}`}
                    prefetch
                    className="min-w-[150px] rounded-[22px] bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                  >
                    <div className="aspect-[1/0.86] overflow-hidden rounded-[18px] bg-[#f8efe4]">
                      {relatedProduct.imageUrl ? (
                        <img
                          className="h-full w-full object-cover"
                          src={relatedProduct.imageUrl}
                          alt={relatedProduct.name}
                        />
                      ) : null}
                    </div>
                    <h3 className="mt-3 line-clamp-1 text-sm font-bold text-slate-900">
                      {relatedProduct.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-[398px] items-center gap-3 rounded-[28px] bg-white px-3 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          {cartQuantity ? (
            <div className="flex items-center gap-2 rounded-[20px] bg-[#111827] px-3 py-2 text-white">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                type="button"
                onClick={() => decrementItem(product.id)}
              >
                <Minus size={16} />
              </button>
              <span className="min-w-5 text-center text-sm font-semibold">{cartQuantity}</span>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                type="button"
                onClick={() =>
                  product.customizationOptions.length ? addItem(product) : incrementItem(product.id)
                }
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <div className="flex h-[54px] items-center rounded-[20px] bg-[#111827] px-5 text-sm font-semibold text-white">
              Pronto para pedir
            </div>
          )}

          <button
            className="flex-1 rounded-[22px] bg-[#e3342f] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(227,52,47,0.28)]"
            type="button"
            onClick={() => addItem(product)}
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </>
  );
}
