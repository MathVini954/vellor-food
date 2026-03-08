import type { CustomerStatus } from "../types/dashboard";

type CustomerStatusBadgeProps = {
  status: CustomerStatus;
};

const statusStyles: Record<CustomerStatus, string> = {
  Ativo: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  Bloqueado: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
