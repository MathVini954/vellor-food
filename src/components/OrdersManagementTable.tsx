import { StatusBadge } from "./StatusBadge";
import type { Order, OrderStatus } from "../types/dashboard";

type OrdersManagementTableProps = {
  title: string;
  description: string;
  orders: Order[];
  emptyStateTitle: string;
  emptyStateDescription: string;
  onAdvanceStatus: (orderId: string) => void | Promise<void>;
  onCancelOrder: (orderId: string) => void | Promise<void>;
  onDeleteOrder: (orderId: string) => void | Promise<void>;
  onViewDetails: (order: Order) => void;
  pendingOrderId?: string | null;
};

const actionLabels: Partial<Record<OrderStatus, string>> = {
  Novo: "Aceitar pedido",
  Aceito: "Marcar como em preparo",
  "Em preparo": "Marcar como enviado",
  Enviado: "Finalizar pedido",
};

export function OrdersManagementTable({
  title,
  description,
  orders,
  emptyStateTitle,
  emptyStateDescription,
  onAdvanceStatus,
  onCancelOrder,
  onDeleteOrder,
  onViewDetails,
  pendingOrderId = null,
}: OrdersManagementTableProps) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[color:var(--border-soft)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Operacao online</p>
          <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{title}</h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">{description}</p>
        </div>
        <div className="panel-muted px-4 py-3 text-sm text-[color:var(--text-muted)]">
          Sincronizacao automatica ativa
        </div>
      </div>

      {orders.length ? (
        <>
          <div className="space-y-4 p-4 xl:hidden">
            {orders.map((order) => {
              const primaryAction = actionLabels[order.status];
              const isFinalized = order.status === "Entregue" || order.status === "Cancelado";
              const isPending = pendingOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className="rounded-[24px] border border-[color:var(--border-soft)] bg-white/84 p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                        Pedido
                      </p>
                      <h3 className="mt-2 break-all text-lg font-semibold text-[color:var(--text-strong)]">
                        {order.id}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-soft)]">Cliente</p>
                      <p className="mt-2 break-words font-semibold text-[color:var(--text-strong)]">{order.customer}</p>
                      <p className="mt-1 break-words text-sm text-[color:var(--text-muted)]">{order.address}</p>
                      <p className="mt-2 break-all text-sm text-[color:var(--text-muted)]">{order.phone}</p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-soft)]">Resumo</p>
                        <span className="text-sm font-semibold text-[color:var(--text-strong)]">{order.time}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.name}`} className="flex items-start justify-between gap-3 text-sm">
                            <span className="min-w-0 flex-1 break-words text-[color:var(--text-muted)]">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm text-[color:var(--text-muted)]">Total</span>
                        <span className="text-base font-semibold text-[color:var(--text-strong)]">{order.total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      className="action-secondary !rounded-xl !px-3 !py-2.5 !text-xs"
                      type="button"
                      disabled={isPending}
                      onClick={() => onViewDetails(order)}
                    >
                      Ver detalhes
                    </button>
                    {primaryAction ? (
                      <button
                        className="action-primary !rounded-xl !px-3 !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        disabled={isPending}
                        onClick={() => onAdvanceStatus(order.id)}
                      >
                        {isPending ? "Processando..." : primaryAction}
                      </button>
                    ) : null}
                    {!isFinalized ? (
                      <button
                        className="action-warning !rounded-xl !px-3 !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        disabled={isPending}
                        onClick={() => onCancelOrder(order.id)}
                      >
                        Cancelar pedido
                      </button>
                    ) : null}
                    <button
                      className="action-danger !rounded-xl !px-3 !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      disabled={isPending}
                      onClick={() => onDeleteOrder(order.id)}
                    >
                      Excluir pedido
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto xl:block">
          <table className="min-w-[1180px] w-full divide-y divide-[color:var(--border-soft)]">
            <thead className="bg-[color:var(--surface-muted)] text-left text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
              <tr>
                <th className="px-5 py-4">Numero do pedido</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Telefone</th>
                <th className="px-5 py-4">Itens</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Horario</th>
                <th className="px-5 py-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border-soft)] bg-white/82 text-sm text-[color:var(--text-muted)]">
              {orders.map((order) => {
                const primaryAction = actionLabels[order.status];
                const isFinalized = order.status === "Entregue" || order.status === "Cancelado";
                const isPending = pendingOrderId === order.id;

                return (
                  <tr key={order.id} className="align-top transition hover:bg-white">
                    <td className="px-5 py-4 font-semibold text-[color:var(--text-strong)]">{order.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-[color:var(--text-strong)]">{order.customer}</div>
                      <div className="mt-1 text-xs text-[color:var(--text-muted)]">{order.address}</div>
                    </td>
                    <td className="px-5 py-4">{order.phone}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.name}`} className="text-sm">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-[color:var(--text-strong)]">{order.total}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">{order.time}</td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[230px] flex-col gap-2">
                        <button
                          className="action-secondary !rounded-xl !px-3 !py-2 !text-xs"
                          type="button"
                          disabled={isPending}
                          onClick={() => onViewDetails(order)}
                        >
                          Ver detalhes
                        </button>
                        {primaryAction ? (
                          <button
                            className="action-primary !rounded-xl !px-3 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            disabled={isPending}
                            onClick={() => onAdvanceStatus(order.id)}
                          >
                            {isPending ? "Processando..." : primaryAction}
                          </button>
                        ) : null}
                        {!isFinalized ? (
                          <button
                            className="action-warning !rounded-xl !px-3 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            disabled={isPending}
                            onClick={() => onCancelOrder(order.id)}
                          >
                            Cancelar pedido
                          </button>
                        ) : null}
                        <button
                          className="action-danger !rounded-xl !px-3 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={isPending}
                          onClick={() => onDeleteOrder(order.id)}
                        >
                          Excluir pedido
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <div className="px-5 py-14 text-center">
          <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{emptyStateTitle}</h3>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">{emptyStateDescription}</p>
        </div>
      )}
    </section>
  );
}
