import { CustomerStatusBadge } from "./CustomerStatusBadge";
import type { Customer } from "../types/dashboard";

type CustomersTableProps = {
  customers: Customer[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onViewHistory: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onToggleBlock: (customerId: string) => void;
};

export function CustomersTable({
  customers,
  searchTerm,
  onSearchChange,
  onViewHistory,
  onEditCustomer,
  onToggleBlock,
}: CustomersTableProps) {
  return (
    <section className="panel overflow-hidden rounded-[28px]">
      <div className="border-b border-slate-200 px-5 py-5">
        <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulte a base de clientes, historico de pedidos e bloqueios operacionais.
        </p>
        <div className="mt-4">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            placeholder="Buscar por nome ou telefone"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1020px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">Telefone</th>
              <th className="px-5 py-4">Bairro ou localidade</th>
              <th className="px-5 py-4">Total de pedidos</th>
              <th className="px-5 py-4">Ultimo pedido</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-slate-900">{customer.name}</td>
                <td className="px-5 py-4">{customer.phone}</td>
                <td className="px-5 py-4">{customer.locality}</td>
                <td className="px-5 py-4">{customer.totalOrders}</td>
                <td className="px-5 py-4">{customer.lastOrder}</td>
                <td className="px-5 py-4">
                  <CustomerStatusBadge status={customer.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-[290px] gap-2">
                    <button
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      type="button"
                      onClick={() => onViewHistory(customer)}
                    >
                      Ver historico de pedidos
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      type="button"
                      onClick={() => onEditCustomer(customer)}
                    >
                      Editar cliente
                    </button>
                    <button
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                      type="button"
                      onClick={() => onToggleBlock(customer.id)}
                    >
                      {customer.status === "Bloqueado" ? "Desbloquear cliente" : "Bloquear cliente"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
