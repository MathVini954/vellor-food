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
    <section className="panel overflow-hidden">
      <div className="border-b border-[color:var(--border-soft)] px-5 py-5">
        <p className="section-label">Relacionamento</p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">Clientes</h1>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Consulte a base de clientes, historico de pedidos e bloqueios operacionais.
        </p>
        <div className="mt-4">
          <input
            className="surface-field"
            placeholder="Buscar por nome ou telefone"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1020px] w-full divide-y divide-[color:var(--border-soft)]">
          <thead className="bg-[color:var(--surface-muted)] text-left text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
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
          <tbody className="divide-y divide-[color:var(--border-soft)] bg-white/82 text-sm text-[color:var(--text-muted)]">
            {customers.map((customer) => (
              <tr key={customer.id} className="transition hover:bg-white">
                <td className="px-5 py-4 font-semibold text-[color:var(--text-strong)]">{customer.name}</td>
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
                      className="action-secondary !rounded-xl !px-3 !py-2 !text-xs"
                      type="button"
                      onClick={() => onViewHistory(customer)}
                    >
                      Ver historico de pedidos
                    </button>
                    <button
                      className="action-secondary !rounded-xl !px-3 !py-2 !text-xs"
                      type="button"
                      onClick={() => onEditCustomer(customer)}
                    >
                      Editar cliente
                    </button>
                    <button
                      className="action-danger !rounded-xl !px-3 !py-2 !text-xs"
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
