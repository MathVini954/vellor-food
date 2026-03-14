import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { StatusBadge } from "./StatusBadge";
import type { Customer } from "../types/dashboard";

type CustomerDetailsPanelProps = {
  customer: Customer | null;
};

export function CustomerDetailsPanel({ customer }: CustomerDetailsPanelProps) {
  return (
    <aside className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Detalhes do cliente</p>
          <h2 className="mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
            {customer ? customer.name : "Selecione um cliente"}
          </h2>
        </div>
        {customer ? <CustomerStatusBadge status={customer.status} /> : null}
      </div>

      {customer ? (
        <div className="mt-6 space-y-6">
          <div className="space-y-4 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">Telefone</p>
              <p className="mt-1 font-medium text-[color:var(--text-strong)]">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">Endereco</p>
              <p className="mt-1 font-medium text-[color:var(--text-strong)]">{customer.address}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">Quantidade de pedidos</p>
              <p className="mt-1 font-medium text-[color:var(--text-strong)]">{customer.totalOrders}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[color:var(--text-strong)]">Historico de pedidos</p>
            <div className="mt-3 space-y-3">
              {customer.orderHistory.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[color:var(--border-soft)] bg-white/78 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[color:var(--text-strong)]">{order.id}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{order.date}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[color:var(--text-strong)]">{order.total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--border-soft)] px-4 py-10 text-center text-sm text-[color:var(--text-muted)]">
          Clique em um cliente para ver endereco, contatos e historico de pedidos.
        </div>
      )}
    </aside>
  );
}
