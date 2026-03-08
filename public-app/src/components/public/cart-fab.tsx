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

  return (
    <Link
      href={`/r/${slug}/checkout`}
      className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-[26px] bg-slate-950 px-5 py-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.28)] transition hover:bg-slate-800 sm:left-auto sm:right-6 sm:w-[360px]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <ShoppingCart size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold">{itemCount} itens no carrinho</p>
          <p className="text-xs text-slate-300">
            {restaurant.isOpen ? "Pronto para finalizar" : "Loja fechada no momento"}
          </p>
        </div>
      </div>
      <strong className="text-base font-semibold">{formatCurrency(subtotal)}</strong>
    </Link>
  );
}
