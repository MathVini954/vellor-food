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
    <section className="panel overflow-hidden rounded-[28px]">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Sincronizacao automatica ativa
        </div>
      </div>

      {orders.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
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
            <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
              {orders.map((order) => {
                const primaryAction = actionLabels[order.status];
                const isFinalized = order.status === "Entregue" || order.status === "Cancelado";
                const isPending = pendingOrderId === order.id;

                return (
                  <tr key={order.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">{order.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{order.customer}</div>
                      <div className="mt-1 text-xs text-slate-500">{order.address}</div>
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
                    <td className="px-5 py-4 font-medium text-slate-900">{order.total}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">{order.time}</td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[230px] flex-col gap-2">
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          type="button"
                          disabled={isPending}
                          onClick={() => onViewDetails(order)}
                        >
                          Ver detalhes
                        </button>
                        {primaryAction ? (
                          <button
                            className="rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            disabled={isPending}
                            onClick={() => onAdvanceStatus(order.id)}
                          >
                            {isPending ? "Processando..." : primaryAction}
                          </button>
                        ) : null}
                        {!isFinalized ? (
                          <button
                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            disabled={isPending}
                            onClick={() => onCancelOrder(order.id)}
                          >
                            Cancelar pedido
                          </button>
                        ) : null}
                        <button
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
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
      ) : (
        <div className="px-5 py-14 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{emptyStateTitle}</h3>
          <p className="mt-2 text-sm text-slate-500">{emptyStateDescription}</p>
        </div>
      )}
    </section>
  );
}
