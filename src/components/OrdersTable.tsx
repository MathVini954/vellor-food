import { StatusBadge } from "./StatusBadge";
import type { Order } from "../types/dashboard";

type OrdersTableProps = {
  orders: Order[];
};

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <section className="panel overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pedidos recentes</h2>
          <p className="text-sm text-slate-500">Monitoramento inicial com dados mockados.</p>
        </div>
        <button
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          type="button"
        >
          Ver todos
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Pedido</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Horario</th>
              <th className="px-5 py-4">Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-slate-900">{order.id}</td>
                <td className="px-5 py-4">{order.customer}</td>
                <td className="px-5 py-4">{order.total}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4">{order.time}</td>
                <td className="px-5 py-4">
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    type="button"
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
