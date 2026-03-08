import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { StatusBadge } from "./StatusBadge";
import type { Customer } from "../types/dashboard";

type CustomerDetailsPanelProps = {
  customer: Customer | null;
};

export function CustomerDetailsPanel({ customer }: CustomerDetailsPanelProps) {
  return (
    <aside className="panel rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Detalhes do cliente</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {customer ? customer.name : "Selecione um cliente"}
          </h2>
        </div>
        {customer ? <CustomerStatusBadge status={customer.status} /> : null}
      </div>

      {customer ? (
        <div className="mt-6 space-y-6">
          <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Telefone</p>
              <p className="mt-1 font-medium text-slate-900">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Endereco</p>
              <p className="mt-1 font-medium text-slate-900">{customer.address}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quantidade de pedidos</p>
              <p className="mt-1 font-medium text-slate-900">{customer.totalOrders}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Historico de pedidos</p>
            <div className="mt-3 space-y-3">
              {customer.orderHistory.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{order.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.date}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{order.total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
          Clique em um cliente para ver endereco, contatos e historico de pedidos.
        </div>
      )}
    </aside>
  );
}
