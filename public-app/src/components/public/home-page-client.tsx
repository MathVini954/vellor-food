"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Heart, Plus, Search, SlidersHorizontal } from "lucide-react";
import type {
  MenuCategorySection,
  MenuProductCard,
  PublicRestaurant,
  RestaurantDiscoveryData,
} from "@/types/public";
import { TopCartButton } from "./top-cart-button";
import { useRestaurantStore } from "./restaurant-store-provider";

type HomePageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  discovery: RestaurantDiscoveryData;
  categories: MenuCategorySection[];
};

function getFirstName(name: string | null | undefined) {
  if (!name) {
    return "cliente";
  }

  return name.split(" ")[0] || "cliente";
}

function matchesSearch(product: MenuProductCard, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return (
    product.name.toLowerCase().includes(normalizedQuery) ||
    product.categoryName.toLowerCase().includes(normalizedQuery) ||
    product.description?.toLowerCase().includes(normalizedQuery)
  );
}

export function HomePageClient({
  slug,
  restaurant,
  discovery,
  categories,
}: HomePageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const { customer, addItem, cart, isFavorite, toggleFavorite } = useRestaurantStore();
  const customerName = getFirstName(customer?.name);

  const allProducts = useMemo(
    () => categories.flatMap((category) => category.products),
    [categories],
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return allProducts.filter((product) => matchesSearch(product, normalizedQuery));
  }, [allProducts, search]);

  const cartLookup = useMemo(() => {
    const lookup = new Map<string, number>();

    cart.forEach((item) => {
      lookup.set(item.productId, (lookup.get(item.productId) ?? 0) + item.quantity);
    });

    return lookup;
  }, [cart]);
  const hasSearch = search.trim().length > 0;
  const activeOffer =
    discovery.offers.length > 0 ? discovery.offers[activeOfferIndex % discovery.offers.length] : null;
  const offerPrimaryColor = restaurant.primaryColor || "#111827";
  const offerSecondaryColor = restaurant.secondaryColor || "#e3342f";

  useEffect(() => {
    if (discovery.offers.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveOfferIndex((current) => (current + 1) % discovery.offers.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [discovery.offers.length]);

  useEffect(() => {
    router.prefetch(`/r/${slug}/menu`);
    router.prefetch(`/r/${slug}/checkout`);
    discovery.categories.slice(0, 4).forEach((category) => {
      router.prefetch(`/r/${slug}/menu/${category.id}`);
    });
    discovery.popularProducts.slice(0, 4).forEach((product) => {
      router.prefetch(`/r/${slug}/produto/${product.id}`);
    });
  }, [discovery.categories, discovery.popularProducts, router, slug]);

  return (
    <div className="mobile-page mobile-page-top mobile-page-bottom-nav">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#fff1ef] shadow-[0_12px_24px_rgba(228,52,47,0.16)]">
            {restaurant.logoUrl ? (
              <img className="h-full w-full object-cover" src={restaurant.logoUrl} alt={restaurant.name} />
            ) : (
              <span className="text-base font-semibold text-[#e3342f]">
                {restaurant.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold text-slate-900">
              Ola, <span className="text-[#e3342f]">{customerName}</span>
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              O que vai sair hoje em {restaurant.name}?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TopCartButton slug={slug} />
        </div>
      </header>

      <div className="mt-5 flex items-center gap-3">
        <label className="flex flex-1 items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <Search size={17} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-900 outline-none"
            placeholder="Buscar pratos e categorias"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <Link
          href={`/r/${slug}/menu`}
          prefetch
          className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
          aria-label="Abrir menu"
        >
          <SlidersHorizontal size={18} />
        </Link>
      </div>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Categorias</h2>
            <p className="mt-1 text-xs text-slate-500">
              {restaurant.welcomeMessage || "Categorias reais do seu restaurante"}
            </p>
          </div>
          <Link
            href={`/r/${slug}/menu`}
            prefetch
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#e3342f]"
          >
            Ver cardapio
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {discovery.categories.map((category) => (
            <Link
              key={category.id}
              href={`/r/${slug}/menu/${category.id}`}
              prefetch
              className="min-w-[74px] rounded-[18px] bg-white p-2 text-center shadow-[0_16px_30px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#fff4ef]">
                {category.imageUrl ? (
                  <img className="h-full w-full object-cover" src={category.imageUrl} alt={category.name} />
                ) : (
                  <span className="text-xs font-semibold text-[#e3342f]">
                    {category.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-[11px] font-semibold text-slate-900">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {activeOffer ? (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ofertas em destaque</h2>
              <p className="mt-1 text-xs text-slate-500">Campanhas publicadas pelo restaurante</p>
            </div>
          </div>

          <article className="mt-4 overflow-hidden rounded-[30px] bg-[#111827] text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
            <div className="relative min-h-[280px]">
              {activeOffer.imageUrls.length ? (
                <img
                  className="absolute inset-0 h-full w-full object-cover"
                  src={activeOffer.imageUrls[0]}
                  alt={activeOffer.name}
                />
              ) : null}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(145deg, ${offerPrimaryColor}d9 0%, ${offerPrimaryColor}94 34%, ${offerSecondaryColor}b8 100%)`,
                  backdropFilter: "blur(8px)",
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.28))]" />
              <div className="relative flex min-h-[280px] flex-col justify-between px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                    {activeOffer.type === "DISH_OF_THE_DAY" ? "Especial do dia" : "Oferta ativa"}
                  </span>
                  <span className="rounded-full border border-white/18 bg-black/18 px-3 py-2 text-[11px] font-medium text-white/80 backdrop-blur-md">
                    Valida ate {activeOffer.endDate}
                  </span>
                </div>

                <div>
                  <div className="inline-flex rounded-[24px] border border-white/14 bg-black/14 px-3 py-2 backdrop-blur-md">
                    <span className="text-2xl font-bold leading-none text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                      {activeOffer.discountLabel}
                    </span>
                  </div>
                </div>

                <div className="max-w-[290px]">
                  <h3 className="text-[34px] font-black leading-[1.02] tracking-[-0.03em] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.34)]">
                    {activeOffer.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/88">
                    {activeOffer.appliesTo}
                  </p>
                </div>
              </div>
            </div>
            {discovery.offers.length > 1 ? (
              <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/10 px-5 py-4 backdrop-blur-md">
                {discovery.offers.map((offer, index) => (
                  <button
                    key={offer.id}
                    aria-label={`Abrir oferta ${offer.name}`}
                    className={`h-2.5 rounded-full transition ${
                      index === activeOfferIndex ? "w-8 bg-white" : "w-2.5 bg-white/35"
                    }`}
                    type="button"
                    onClick={() => setActiveOfferIndex(index)}
                  />
                ))}
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      {searchResults.length ? (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Resultados da busca</h2>
              <p className="mt-1 text-xs text-slate-500">{searchResults.length} itens encontrados</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {searchResults.map((product) => {
              const quantity = cartLookup.get(product.id) ?? 0;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                >
                  <Link href={`/r/${slug}/produto/${product.id}`} prefetch>
                    <div className="aspect-[1/1] overflow-hidden rounded-[20px] bg-[#f7efe7]">
                      {product.imageUrl ? (
                        <img
                          className="h-full w-full object-cover"
                          src={product.imageUrl}
                          alt={product.name}
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="px-1 pb-1 pt-3">
                    <p className="truncate text-[11px] font-medium text-slate-400">{product.categoryName}</p>
                    <Link href={`/r/${slug}/produto/${product.id}`} prefetch className="mt-1 block">
                      <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{product.name}</h3>
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          isFavorite(product.id)
                            ? "border-[#ffd4d1] bg-[#fff1ef] text-[#e3342f]"
                            : "border-slate-200 text-slate-400"
                        }`}
                        type="button"
                        onClick={() => toggleFavorite(product.id)}
                        aria-label="Favoritar produto"
                      >
                        <Heart size={15} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                      </button>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e3342f] text-white"
                        type="button"
                        onClick={() => addItem(product)}
                      >
                        {quantity ? <span className="text-xs font-semibold">{quantity}</span> : <Plus size={16} />}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : hasSearch ? (
        <section className="mt-7 rounded-[28px] bg-white px-5 py-8 text-center shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-bold text-slate-900">Nada encontrado</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Tente buscar por outro prato, sabor ou categoria.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Mais pedidos</h2>
                <p className="mt-1 text-xs text-slate-500">Baseado nos itens mais vendidos do restaurante</p>
              </div>
              <Link
                href={`/r/${slug}/menu`}
                prefetch
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#e3342f]"
              >
                Ver tudo
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
              {discovery.popularProducts.map((product) => {
                const quantity = cartLookup.get(product.id) ?? 0;

                return (
                  <article
                    key={product.id}
                    className="min-w-[178px] rounded-[26px] bg-white p-2 shadow-[0_20px_38px_rgba(15,23,42,0.08)]"
                  >
                    <Link href={`/r/${slug}/produto/${product.id}`} prefetch>
                      <div className="aspect-[1/0.88] overflow-hidden rounded-[22px] bg-[#f8efe4]">
                        {product.imageUrl ? (
                          <img
                            className="h-full w-full object-cover"
                            src={product.imageUrl}
                            alt={product.name}
                          />
                        ) : null}
                      </div>
                    </Link>
                    <div className="px-1 pb-1 pt-3">
                      <p className="truncate text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        {product.categoryName}
                      </p>
                      <Link href={`/r/${slug}/produto/${product.id}`} prefetch className="mt-1 block">
                        <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900">{product.name}</h3>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                        {product.description || "Prato cadastrado no cardapio do restaurante."}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                            isFavorite(product.id)
                              ? "border-[#ffd4d1] bg-[#fff1ef] text-[#e3342f]"
                              : "border-slate-200 text-slate-400"
                          }`}
                          type="button"
                          onClick={() => toggleFavorite(product.id)}
                          aria-label="Favoritar produto"
                        >
                          <Heart size={15} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                        </button>
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e3342f] text-white"
                          type="button"
                          onClick={() => addItem(product)}
                        >
                          {quantity ? <span className="text-xs font-semibold">{quantity}</span> : <Plus size={14} />}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Sugestoes para voce</h2>
                <p className="mt-1 text-xs text-slate-500">Selecao viva do cardapio real</p>
              </div>
              <Link
                href={`/r/${slug}/menu`}
                prefetch
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#e3342f]"
              >
                Ver tudo
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {discovery.recommendedProducts.map((product) => {
                const quantity = cartLookup.get(product.id) ?? 0;

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                  >
                    <Link href={`/r/${slug}/produto/${product.id}`} prefetch>
                      <div className="aspect-[1/0.9] overflow-hidden rounded-[20px] bg-[#f8efe4]">
                        {product.imageUrl ? (
                          <img
                            className="h-full w-full object-cover"
                            src={product.imageUrl}
                            alt={product.name}
                          />
                        ) : null}
                      </div>
                    </Link>
                    <div className="px-1 pb-1 pt-3">
                      <p className="truncate text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        {product.categoryName}
                      </p>
                      <Link href={`/r/${slug}/produto/${product.id}`} prefetch className="mt-1 block">
                        <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{product.name}</h3>
                      </Link>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                            isFavorite(product.id)
                              ? "border-[#ffd4d1] bg-[#fff1ef] text-[#e3342f]"
                              : "border-slate-200 text-slate-400"
                          }`}
                          type="button"
                          onClick={() => toggleFavorite(product.id)}
                          aria-label="Favoritar produto"
                        >
                          <Heart size={15} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                        </button>
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e3342f] text-white"
                          type="button"
                          onClick={() => addItem(product)}
                        >
                          {quantity ? <span className="text-xs font-semibold">{quantity}</span> : <Plus size={16} />}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
