import type { OrderStatus } from "../types/dashboard";

type StatusBadgeProps = {
  status: OrderStatus;
};

const statusStyles: Record<OrderStatus, string> = {
  Novo: "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] ring-1 ring-[rgba(183,93,62,0.12)]",
  Aceito: "bg-[rgba(56,94,157,0.12)] text-[#35558b] ring-1 ring-[rgba(56,94,157,0.12)]",
  "Em preparo": "bg-[rgba(217,146,43,0.14)] text-[#9d6119] ring-1 ring-[rgba(217,146,43,0.16)]",
  Enviado: "bg-[rgba(91,79,171,0.12)] text-[#51439f] ring-1 ring-[rgba(91,79,171,0.12)]",
  Entregue: "bg-[color:var(--accent-green-soft)] text-[color:var(--accent-green)] ring-1 ring-[rgba(47,108,96,0.12)]",
  Cancelado: "bg-[rgba(199,73,90,0.12)] text-[#b3384c] ring-1 ring-[rgba(199,73,90,0.12)]",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
