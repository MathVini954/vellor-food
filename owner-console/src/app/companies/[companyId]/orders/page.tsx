import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, LayoutDashboard, ReceiptText, Search, Store, UtensilsCrossed } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { hasOwnerConsoleCredentialsConfigured, isOwnerConsoleAuthenticated } from "@/lib/owner-auth";
import {
  formatDateTime,
  formatMoney,
  formatOrderChannel,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  readSearchParam,
} from "@/lib/owner-ui";
import { getManagedCompanyDetail, listManagedCompanyOrders } from "@/services/platform/owner-dashboard";

function matchesFilter(value: string, expected: string) {
  return expected === "ALL" || value === expected;
}

export default async function CompanyOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!hasOwnerConsoleCredentialsConfigured()) {
    redirect("/login?error=not-configured");
  }

  if (!(await isOwnerConsoleAuthenticated())) {
    redirect("/login");
  }

  const { companyId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const search = readSearchParam(resolvedSearchParams.q).trim().toLowerCase();
  const channelFilter = readSearchParam(resolvedSearchParams.channel) || "ALL";
  const statusFilter = readSearchParam(resolvedSearchParams.status) || "ALL";
  const paymentFilter = readSearchParam(resolvedSearchParams.payment) || "ALL";

  const [company, ordersPayload] = await Promise.all([
    getManagedCompanyDetail(companyId),
    listManagedCompanyOrders(companyId),
  ]);

  if (!company || !ordersPayload) {
    notFound();
  }

  const orders = ordersPayload.orders.filter((order) => {
    if (!matchesFilter(order.orderType, channelFilter)) {
      return false;
    }

    if (!matchesFilter(order.status, statusFilter)) {
      return false;
    }

    if (!matchesFilter(order.paymentStatus, paymentFilter)) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      order.id,
      order.customerName,
      order.customerPhone,
      order.tableLabel ?? "",
      order.address ?? "",
      order.neighborhood ?? "",
      ...order.items.map((item) => item.productName),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });

  const onlineOrders = orders.filter((order) => order.orderType !== "DINE_IN");
  const tableOrders = orders.filter((order) => order.orderType === "DINE_IN");
  const paidRevenue = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.total.toNumber(), 0);
  const pendingRevenue = orders
    .filter((order) => order.paymentStatus !== "PAID" && order.status !== "CANCELED")
    .reduce((sum, order) => sum + order.total.toNumber(), 0);

  return (
    <OwnerShell
      activeItem="company"
      eyebrow={`owner / companies / ${company.slug} / orders`}
      title={`Central de pedidos: ${company.name}`}
      description="Visao unificada dos pedidos do tenant, somando online e mesas em uma mesma operacao de acompanhamento dentro do owner."
      actions={
        <>
          <Link
            href={`/companies/${company.companyId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={15} />
            Voltar a empresa
          </Link>
          {company.links.adminUrl ? (
            <a
              href={company.links.adminUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 transition hover:bg-emerald-400/15"
            >
              <LayoutDashboard size={15} />
              Abrir gerencial
            </a>
          ) : null}
          {company.links.publicUrl ? (
            <a
              href={company.links.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              <ExternalLink size={15} />
              Abrir app
            </a>
          ) : null}
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-4">
        <article className="rounded-[28px] border border-sky-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sky-300">
            <ReceiptText size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">pedidos</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{orders.length}</p>
          <p className="mt-2 text-sm text-zinc-500">resultado da filtragem atual</p>
        </article>

        <article className="rounded-[28px] border border-emerald-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-300">
            <Store size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">online</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{onlineOrders.length}</p>
          <p className="mt-2 text-sm text-zinc-500">delivery e retirada</p>
        </article>

        <article className="rounded-[28px] border border-amber-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-300">
            <UtensilsCrossed size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">mesas</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{tableOrders.length}</p>
          <p className="mt-2 text-sm text-zinc-500">pedidos presenciais</p>
        </article>

        <article className="rounded-[28px] border border-fuchsia-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <ReceiptText size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">receita</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{formatMoney(paidRevenue)}</p>
          <p className="mt-2 text-sm text-zinc-500">pago agora / {formatMoney(pendingRevenue)} pendente</p>
        </article>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">filters</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Monitor unificado</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Filtre o fluxo do tenant sem precisar entrar no gerencial para entender o que veio do online e o que veio das mesas.
            </p>
          </div>

          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" method="get">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-zinc-300">
              <Search size={15} className="text-zinc-500" />
              <input
                name="q"
                defaultValue={readSearchParam(resolvedSearchParams.q)}
                placeholder="Buscar cliente, pedido, item, mesa"
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
              />
            </label>

            <select
              name="channel"
              defaultValue={channelFilter}
              className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">Todos os canais</option>
              <option value="DELIVERY">Delivery</option>
              <option value="PICKUP">Retirada</option>
              <option value="DINE_IN">Mesa</option>
            </select>

            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">Todos os status</option>
              <option value="NEW">Novo</option>
              <option value="ACCEPTED">Aceito</option>
              <option value="PREPARING">Em preparo</option>
              <option value="SENT">Enviado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELED">Cancelado</option>
            </select>

            <select
              name="payment"
              defaultValue={paymentFilter}
              className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">Todo pagamento</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="FAILED">Falhou</option>
              <option value="REFUNDED">Estornado</option>
            </select>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        {orders.length ? (
          orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                      {formatOrderChannel(order.orderType)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                      {formatOrderStatus(order.status)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                      {formatPaymentStatus(order.paymentStatus)}
                    </span>
                    {order.tableLabel ? (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-100">
                        {order.tableLabel}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-white">{order.customerName}</h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    {order.id} / {order.customerPhone}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{formatDateTime(order.createdAt)}</p>
                  {order.address || order.neighborhood ? (
                    <p className="mt-3 text-sm text-zinc-400">
                      {order.address ?? order.neighborhood}
                      {order.address && order.neighborhood ? ` • ${order.neighborhood}` : ""}
                    </p>
                  ) : null}
                  {order.notes ? <p className="mt-3 text-sm leading-6 text-zinc-300">{order.notes}</p> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[340px]">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">total</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{formatMoney(order.total)}</p>
                    <p className="mt-1 text-xs text-zinc-500">{order.itemCount} itens no pedido</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">pagamento</p>
                    <p className="mt-3 text-lg font-semibold text-white">{formatPaymentMethod(order.paymentMethod)}</p>
                    <p className="mt-1 text-xs text-zinc-500">{formatPaymentStatus(order.paymentStatus)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-white/8 bg-[#080a10] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.productName}</p>
                        {item.customizations ? (
                          <p className="mt-2 text-xs leading-5 text-zinc-500">{item.customizations}</p>
                        ) : null}
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">{item.quantity}x</span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">{formatMoney(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-black/25 px-4 py-10 text-center text-sm text-zinc-500">
            Nenhum pedido encontrado para os filtros aplicados.
          </div>
        )}
      </section>
    </OwnerShell>
  );
}
