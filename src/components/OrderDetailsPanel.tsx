import { StatusBadge } from "./StatusBadge";
import type { Order } from "../types/dashboard";

type OrderDetailsPanelProps = {
  order: Order | null;
};

export function OrderDetailsPanel({ order }: OrderDetailsPanelProps) {
  return (
    <aside className="panel rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Detalhes do pedido</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {order ? order.id : "Selecione um pedido"}
          </h2>
        </div>
        {order ? <StatusBadge status={order.status} /> : null}
      </div>

      {order ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cliente</p>
              <p className="mt-2 font-semibold text-slate-900">{order.customer}</p>
              <p className="mt-1 text-sm text-slate-600">{order.phone}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Horario</p>
              <p className="mt-2 font-semibold text-slate-900">{order.time}</p>
              <p className="mt-1 text-sm text-slate-600">{order.address}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Itens do pedido</p>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div
                  key={`${order.id}-${item.name}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{item.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.quantity}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-ink p-4 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Total</p>
            <p className="mt-2 text-2xl font-semibold">{order.total}</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
          Clique em "Ver detalhes" para abrir as informacoes do pedido.
        </div>
      )}
    </aside>
  );
}
