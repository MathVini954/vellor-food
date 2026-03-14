import { StatusBadge } from "./StatusBadge";
import type { Order } from "../types/dashboard";

type OrderDetailsPanelProps = {
  order: Order | null;
};

export function OrderDetailsPanel({ order }: OrderDetailsPanelProps) {
  return (
    <aside className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Detalhes do pedido</p>
          <h2 className="mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
            {order ? order.id : "Selecione um pedido"}
          </h2>
        </div>
        {order ? <StatusBadge status={order.status} /> : null}
      </div>

      {order ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="panel-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">Cliente</p>
              <p className="mt-2 font-semibold text-[color:var(--text-strong)]">{order.customer}</p>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">{order.phone}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">Horario</p>
              <p className="mt-2 font-semibold text-[color:var(--text-strong)]">{order.time}</p>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">{order.address}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[color:var(--text-strong)]">Itens do pedido</p>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div
                  key={`${order.id}-${item.name}`}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--border-soft)] bg-white/78 px-4 py-3"
                >
                  <span className="text-sm text-[color:var(--text-muted)]">{item.name}</span>
                  <span className="text-sm font-semibold text-[color:var(--text-strong)]">{item.quantity}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(135deg,#d38664,#b75d3e)] p-4 text-white shadow-[0_18px_34px_rgba(183,93,62,0.22)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Total</p>
            <p className="mt-2 text-2xl font-semibold">{order.total}</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--border-soft)] px-4 py-10 text-center text-sm text-[color:var(--text-muted)]">
          Clique em "Ver detalhes" para abrir as informacoes do pedido.
        </div>
      )}
    </aside>
  );
}
