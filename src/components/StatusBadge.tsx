import type { OrderStatus } from "../types/dashboard";

type StatusBadgeProps = {
  status: OrderStatus;
};

const statusStyles: Record<OrderStatus, string> = {
  Novo: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  Aceito: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  "Em preparo": "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  Enviado: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  Entregue: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  Cancelado: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
