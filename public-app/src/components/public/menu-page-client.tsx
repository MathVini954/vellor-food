"use client";

import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { CartFab } from "./cart-fab";
import { ProductCard } from "./product-card";
import { useRestaurantStore } from "./restaurant-store-provider";
import type { MenuCategorySection, PublicRestaurant } from "@/types/public";

type MenuPageClientProps = {
  restaurant: PublicRestaurant;
  categories: MenuCategorySection[];
};

export function MenuPageClient({ restaurant, categories }: MenuPageClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const { subtotal } = useRestaurantStore();

  const filteredCategories = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return categories
      .filter((category) => activeCategoryId === "all" || category.id === activeCategoryId)
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => {
          if (!normalizedQuery) {
            return true;
          }

          return (
            product.name.toLowerCase().includes(normalizedQuery) ||
            product.description?.toLowerCase().includes(normalizedQuery) ||
            category.name.toLowerCase().includes(normalizedQuery)
          );
        }),
      }))
      .filter((category) => category.products.length > 0);
  }, [activeCategoryId, categories, search]);

  return (
    <div className="pb-28">
      <section className="glass-card rounded-[32px] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] bg-slate-100">
            {restaurant.logoUrl ? (
              <img className="h-full w-full object-cover" src={restaurant.logoUrl} alt={restaurant.name} />
            ) : (
              <Store size={24} className="text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-950">{restaurant.name}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  restaurant.isOpen
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {restaurant.isOpen ? "Aberto agora" : "Fechado no momento"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {restaurant.address || "Endereco ainda nao informado pelo restaurante."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Pedido minimo {formatCurrency(restaurant.minimumOrderValue)}</span>
              <span>Taxa {formatCurrency(restaurant.deliveryFee)}</span>
            </div>
          </div>
        </div>

        {!restaurant.isOpen ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            O restaurante esta fechado. Voce pode navegar no cardapio, mas a finalizacao do pedido
            fica bloqueada ate a reabertura.
          </div>
        ) : null}
      </section>

      <div className="glass-card mt-4 rounded-[28px] p-4">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-900 outline-none"
            placeholder="Buscar pratos, categorias ou sabores"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategoryId === "all"
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
            type="button"
            onClick={() => setActiveCategoryId("all")}
          >
            Tudo
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategoryId === category.id
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {filteredCategories.length ? (
          filteredCategories.map((category) => (
            <section key={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{category.name}</h2>
                  <p className="text-sm text-slate-500">{category.products.length} itens disponiveis</p>
                </div>
                <span className="text-sm font-medium text-slate-500">
                  Subtotal atual {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="grid gap-4">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="glass-card rounded-[28px] p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">Nada encontrado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ajuste sua busca ou aguarde o restaurante publicar novos itens no cardapio.
            </p>
          </div>
        )}
      </div>

      <CartFab />
    </div>
  );
}
