import type { OfferStatus } from "../types/dashboard";

type OfferStatusBadgeProps = {
  status: OfferStatus;
};

const statusStyles: Record<OfferStatus, string> = {
  Ativa: "bg-[color:var(--accent-green-soft)] text-[color:var(--accent-green)] ring-1 ring-[rgba(47,108,96,0.12)]",
  Inativa: "bg-white/84 text-[color:var(--text-muted)] ring-1 ring-[color:var(--border-soft)]",
};

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
