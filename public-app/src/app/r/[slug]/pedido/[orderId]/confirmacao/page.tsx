import Link from "next/link";
import { CheckCircle2, MessageCircleMore } from "lucide-react";
import { OpenWhatsAppButton } from "@/components/public/open-whatsapp-button";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { formatCurrency } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getOrderConfirmationById } from "@/services/public/restaurants";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const order = await getOrderConfirmationById(slug, orderId);

  if (!order) {
    return (
      <PublicPageShell slug={slug}>
        <div className="px-5 pb-10">
          <section className="rounded-[30px] bg-white px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <h1 className="text-[24px] font-bold text-slate-900">Pedido nao encontrado</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Nao encontramos o pedido informado para este restaurante.
            </p>
            <Link
              href={`/r/${slug}`}
              className="mt-6 inline-flex rounded-[18px] bg-[#e3342f] px-5 py-3 text-sm font-semibold text-white"
            >
              Voltar ao cardapio
            </Link>
          </section>
        </div>
      </PublicPageShell>
    );
  }

  const whatsappUrl = buildWhatsAppUrl(order);
  const whatsappWebUrl = buildWhatsAppUrl(order, "web");
  const isDineInOrder = order.orderType === "DINE_IN";

  return (
    <PublicPageShell slug={slug}>
      <div className="px-5 pb-12 pt-2">
        <section className="rounded-[34px] bg-[#111827] px-7 py-9 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
          <div className="flex items-start gap-4">
            <span className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/18 text-emerald-300">
              <CheckCircle2 size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-emerald-300">Pedido salvo com sucesso</p>
              <h1 className="mt-3 text-[16px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Pedido
              </h1>
              <p className="mt-2 break-all text-[28px] font-bold leading-tight text-white sm:text-[30px]">
                {order.id}
              </p>
              {order.tableLabel ? (
                <p className="mt-3 text-sm font-medium text-white/72">{order.tableLabel}</p>
              ) : null}
            </div>
          </div>

          <p className="mt-6 max-w-[28rem] text-sm leading-7 text-white/75">
            {isDineInOrder
              ? "Seu pedido ja entrou na comanda da mesa e foi enviado para o gerencial do restaurante."
              : "Seu pedido ja foi salvo no sistema do restaurante. Agora so falta confirmar o envio no WhatsApp."}
          </p>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">{order.restaurant.name}</p>
              <h2 className="text-[22px] font-bold text-slate-900">Resumo do pedido</h2>
            </div>
            <span className="rounded-full bg-[#111827] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              {order.paymentMethodLabel}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {item.quantity}x {item.productName}
                  </p>
                  {item.customizations ? (
                    <p className="mt-1 text-xs text-[#b5302c]">{item.customizations}</p>
                  ) : null}
                </div>
                <span className="font-medium text-slate-900">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </section>

        {isDineInOrder ? (
          <Link
            href={`/r/${slug}/meus-pedidos`}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#111827] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]"
          >
            Ver comanda da mesa
          </Link>
        ) : (
          <OpenWhatsAppButton
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(5,150,105,0.24)]"
            appUrl={whatsappUrl}
            webUrl={whatsappWebUrl}
          >
            <MessageCircleMore size={18} />
            Abrir WhatsApp para confirmar pedido
          </OpenWhatsAppButton>
        )}

        <Link
          href={isDineInOrder ? `/r/${slug}` : `/r/${slug}/meus-pedidos`}
          className="mt-4 flex w-full items-center justify-center rounded-[22px] bg-[#111827] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]"
        >
          {isDineInOrder ? "Adicionar mais itens" : "Acompanhar meus pedidos"}
        </Link>

        <Link
          href={`/r/${slug}`}
          className="mt-3 flex w-full items-center justify-center rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700"
        >
          {isDineInOrder ? "Voltar ao cardapio" : "Fazer novo pedido"}
        </Link>
      </div>
    </PublicPageShell>
  );
}
