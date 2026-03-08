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
      className="fixed inset-x-3 bottom-[calc(5.8rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-auto max-w-[430px] items-center justify-between gap-2.5 rounded-[22px] bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-3 py-2.5 text-white shadow-[0_22px_40px_rgba(220,38,38,0.32)] transition hover:brightness-105 sm:gap-3 sm:rounded-[24px] sm:px-4 sm:py-3"
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/15 sm:h-11 sm:w-11">
          {restaurant.logoUrl ? (
            <img className="h-full w-full object-cover" src={restaurant.logoUrl} alt={restaurant.name} />
          ) : (
            <ShoppingCart size={16} className="sm:h-[18px] sm:w-[18px]" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[8px] font-medium uppercase tracking-[0.12em] text-white/72 sm:text-[9px] sm:tracking-[0.14em]">
            {restaurant.isOpen ? "Resumo da sacola" : "Loja fechada no momento"}
          </p>
          <p className="mt-1 truncate text-[15px] font-bold leading-none text-white sm:text-[17px]">
            {formatCurrency(subtotal)}
            <span className="ml-1.5 text-[10px] font-medium text-white/80 sm:ml-2 sm:text-[12px]">/ {itemLabel}</span>
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-[16px] bg-white px-3 py-2 text-[11px] font-semibold text-[#dc2626] shadow-[0_10px_20px_rgba(255,255,255,0.2)] sm:rounded-[18px] sm:px-4 sm:py-2.5 sm:text-[12px]">
        Ver sacola
      </span>
    </Link>
  );
}
