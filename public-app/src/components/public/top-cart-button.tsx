"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useRestaurantStore } from "./restaurant-store-provider";

type TopCartButtonProps = {
  slug: string;
  dark?: boolean;
};

export function TopCartButton({ slug, dark = false }: TopCartButtonProps) {
  const { itemCount } = useRestaurantStore();

  return (
    <Link
      href={`/r/${slug}/checkout`}
      prefetch={false}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition ${
        dark
          ? "border-white/20 bg-black/25 text-white"
          : "border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
      }`}
    >
      <ShoppingCart size={18} />
      {itemCount ? (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#e3342f] px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
