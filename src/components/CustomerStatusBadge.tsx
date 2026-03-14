import type { CustomerStatus } from "../types/dashboard";

type CustomerStatusBadgeProps = {
  status: CustomerStatus;
};

const statusStyles: Record<CustomerStatus, string> = {
  Ativo: "bg-[color:var(--accent-green-soft)] text-[color:var(--accent-green)] ring-1 ring-[rgba(47,108,96,0.12)]",
  Bloqueado: "bg-[rgba(199,73,90,0.12)] text-[#b3384c] ring-1 ring-[rgba(199,73,90,0.12)]",
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
