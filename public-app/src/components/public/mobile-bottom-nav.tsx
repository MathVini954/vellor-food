"use client";

import Link from "next/link";
import clsx from "clsx";
import { Home, ShoppingCart, UserRound, UtensilsCrossed } from "lucide-react";
import { useRestaurantStore } from "./restaurant-store-provider";

type MobileBottomNavProps = {
  slug: string;
  activeTab: "home" | "menu" | "cart" | "profile";
};

const items = [
  {
    id: "home",
    label: "Inicio",
    icon: Home,
  },
  {
    id: "menu",
    label: "Cardapio",
    icon: UtensilsCrossed,
  },
  {
    id: "cart",
    label: "Carrinho",
    icon: ShoppingCart,
  },
  {
    id: "profile",
    label: "Perfil",
    icon: UserRound,
  },
] as const;

export function MobileBottomNav({ slug, activeTab }: MobileBottomNavProps) {
  const { experienceMode, itemCount, customer, tableSession } = useRestaurantStore();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
      <nav className="pointer-events-auto flex w-full max-w-[430px] items-center justify-between rounded-t-[28px] border-t border-slate-200 bg-white px-5 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        {items.map((item) => {
          const Icon = item.icon;
          const href =
            item.id === "home"
              ? `/r/${slug}`
              : item.id === "menu"
                ? `/r/${slug}/menu`
                : item.id === "cart"
                  ? `/r/${slug}/checkout`
                  : experienceMode === "DINE_IN"
                    ? tableSession
                      ? `/r/${slug}/meus-pedidos`
                      : `/r/${slug}/checkout`
                    : customer
                      ? `/r/${slug}/meus-pedidos`
                      : `/r/${slug}/identificacao`;

          return (
            <Link
              key={item.id}
              href={href}
              prefetch={false}
              className={clsx(
                "relative flex min-w-[58px] flex-col items-center gap-1 px-1 py-1 text-[10px] font-medium transition",
                activeTab === item.id ? "text-[#e3342f]" : "text-slate-400",
              )}
            >
              <span
                className={clsx(
                  "relative flex h-6 w-6 items-center justify-center transition",
                  activeTab === item.id ? "text-[#e3342f]" : "text-slate-400",
                )}
              >
                <Icon size={17} strokeWidth={2.1} />
                {item.id === "cart" && itemCount ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#e3342f] px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white">
                    {itemCount}
                  </span>
                ) : null}
              </span>
              <span className={clsx(activeTab === item.id && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
