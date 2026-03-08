"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import type { MenuCategoryPreview, PublicRestaurant } from "@/types/public";
import { TopCartButton } from "./top-cart-button";

type MenuCategoriesPageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  categories: MenuCategoryPreview[];
};

export function MenuCategoriesPageClient({
  slug,
  restaurant,
  categories,
}: MenuCategoriesPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery));
  }, [categories, search]);

  useEffect(() => {
    router.prefetch(`/r/${slug}`);
    router.prefetch(`/r/${slug}/checkout`);
    categories.slice(0, 6).forEach((category) => {
      router.prefetch(`/r/${slug}/menu/${category.id}`);
    });
  }, [categories, router, slug]);

  return (
    <div className="px-5 pb-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/r/${slug}`}
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

      <section className="mt-6">
        <h2 className="text-[24px] font-bold leading-tight text-slate-900">Escolha sua categoria</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Explore as categorias reais publicadas pelo restaurante.
        </p>
      </section>

      <label className="mt-5 flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <Search size={17} className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
          placeholder="Buscar categoria"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Categorias</h3>
          <span className="text-xs font-medium text-slate-400">{filteredCategories.length} secoes</span>
        </div>

        {filteredCategories.map((category) => (
          <Link
            key={category.id}
            href={`/r/${slug}/menu/${category.id}`}
            prefetch
            className="flex items-center gap-4 rounded-[24px] bg-white p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
          >
            <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#f8efe4]">
              {category.imageUrl ? (
                <img className="h-full w-full object-cover" src={category.imageUrl} alt={category.name} />
              ) : (
                <span className="text-sm font-semibold text-[#e3342f]">
                  {category.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-[22px] font-bold text-slate-900">{category.name}</h4>
              <p className="mt-1 text-sm text-slate-500">{category.productCount} itens</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ChevronRight size={18} />
            </span>
          </Link>
        ))}

        {!filteredCategories.length ? (
          <div className="rounded-[24px] bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            Nenhuma categoria encontrada para esta busca.
          </div>
        ) : null}
      </section>
    </div>
  );
}
