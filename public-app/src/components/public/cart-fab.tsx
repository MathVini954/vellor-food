"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useRestaurantStore } from "./restaurant-store-provider";

export function CartFab() {
  const { slug, itemCount, subtotal, cart, restaurant } = useRestaurantStore();

  if (!cart.length) {
    return null;
  }

  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} itens`;

  return (
    <Link
      href={`/r/${slug}/checkout`}
      className="fixed inset-x-3 bottom-[calc(5.8rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-auto max-w-[430px] items-center justify-between gap-3 rounded-[26px] bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-4 py-3 text-white shadow-[0_22px_40px_rgba(220,38,38,0.32)] transition hover:brightness-105"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/15">
          {restaurant.logoUrl ? (
            <img className="h-full w-full object-cover" src={restaurant.logoUrl} alt={restaurant.name} />
          ) : (
            <ShoppingCart size={20} />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
            {restaurant.isOpen ? "Resumo da sacola" : "Loja fechada no momento"}
          </p>
          <p className="mt-1 truncate text-[24px] font-black leading-none text-white">
            {formatCurrency(subtotal)}
            <span className="ml-2 text-base font-medium text-white/80">/ {itemLabel}</span>
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-[20px] bg-white px-4 py-3 text-sm font-bold text-[#dc2626] shadow-[0_10px_20px_rgba(255,255,255,0.2)]">
        Ver sacola
      </span>
    </Link>
  );
}
