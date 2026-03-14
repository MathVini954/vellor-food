"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type {
  PublicCustomerSession,
  PublicExperienceMode,
  PublicOrderSummary,
  PublicRestaurant,
  PublicTableSessionSummary,
} from "@/types/public";
import { TopCartButton } from "./top-cart-button";

type MyOrdersPageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  customer: PublicCustomerSession | null;
  orders: PublicOrderSummary[];
  tableSession: PublicTableSessionSummary | null;
  experienceMode: PublicExperienceMode;
};

const statusStyles: Record<PublicOrderSummary["status"], string> = {
  NEW: "bg-sky-50 text-sky-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  PREPARING: "bg-amber-50 text-amber-700",
  SENT: "bg-violet-50 text-violet-700",
  DELIVERED: "bg-slate-100 text-slate-700",
  CANCELED: "bg-rose-50 text-rose-700",
};

export function MyOrdersPageClient({
  slug,
  restaurant,
  customer,
  orders,
  tableSession,
  experienceMode,
}: MyOrdersPageClientProps) {
  if (experienceMode === "DINE_IN" && tableSession) {
    return (
      <div className="mobile-page mobile-page-top mobile-page-bottom-nav">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/r/${slug}`}
              prefetch={false}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-sm text-slate-400">{restaurant.name}</p>
              <h1 className="text-[22px] font-bold text-slate-900">Comanda da mesa</h1>
            </div>
          </div>
          <TopCartButton slug={slug} />
        </header>

        <section className="mt-6 rounded-[28px] bg-[#111827] px-5 py-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/60">Mesa</p>
          <h2 className="mt-2 text-[26px] font-bold leading-tight">{tableSession.tableLabel}</h2>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Comanda aberta em {new Date(tableSession.openedAt).toLocaleString("pt-BR")} com{" "}
            {tableSession.customerCount} pessoa(s) registrada(s).
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-[22px] bg-white/6 p-4 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Pedidos</p>
              <p className="mt-1 text-sm font-semibold text-white">{tableSession.orders.length}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Itens</p>
              <p className="mt-1 text-sm font-semibold text-white">{tableSession.itemCount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Total</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatCurrency(tableSession.total)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {tableSession.orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[26px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Pedido {order.id}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{order.customerName}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  {formatCurrency(order.total)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <p className="min-w-0 truncate text-slate-700">
                      {item.quantity}x {item.productName}
                    </p>
                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                  </div>
                ))}
              </div>

              {order.notes ? (
                <div className="mt-4 rounded-[18px] border border-[#ffd7d4] bg-[#fff4f2] px-4 py-3 text-xs text-[#b5302c]">
                  Observacao: {order.notes}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
                <span>{order.itemCount} itens</span>
              </div>
            </article>
          ))}
        </section>

        <Link
          href={`/r/${slug}`}
          prefetch={false}
          className="mt-6 flex items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700"
        >
          <ClipboardList size={18} />
          Fazer mais pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="mobile-page mobile-page-top mobile-page-bottom-nav">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/r/${slug}`}
            prefetch={false}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm text-slate-400">{restaurant.name}</p>
            <h1 className="text-[22px] font-bold text-slate-900">Meus pedidos</h1>
          </div>
        </div>
        <TopCartButton slug={slug} />
      </header>

      <section className="mt-6 rounded-[28px] bg-[#111827] px-5 py-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">Acompanhamento</p>
        <h2 className="mt-2 text-[26px] font-bold leading-tight">{customer?.name ?? "Cliente"}</h2>
        <p className="mt-2 text-sm leading-6 text-white/72">
          Acompanhe o status dos seus pedidos mais recentes pelo telefone {customer?.phone ?? "--"}.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-[26px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Pedido {order.id}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{order.restaurantName}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-2 text-xs font-semibold ${statusStyles[order.status]}`}
              >
                {order.statusLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 rounded-[22px] bg-[#f8fafc] p-4 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Itens</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{order.itemCount}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tipo</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {order.orderType === "DELIVERY" ? "Entrega" : "Retirada"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <p className="min-w-0 truncate text-slate-700">
                    {item.quantity}x {item.productName}
                  </p>
                  <ChevronRight size={14} className="shrink-0 text-slate-300" />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
              <span>{order.paymentMethodLabel}</span>
            </div>
          </article>
        ))}
      </section>

      <Link
        href={`/r/${slug}`}
        prefetch={false}
        className="mt-6 flex items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700"
      >
        <ClipboardList size={18} />
        Voltar ao cardapio
      </Link>
    </div>
  );
}
