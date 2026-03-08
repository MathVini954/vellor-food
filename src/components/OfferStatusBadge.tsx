import type { OfferStatus } from "../types/dashboard";

type OfferStatusBadgeProps = {
  status: OfferStatus;
};

const statusStyles: Record<OfferStatus, string> = {
  Ativa: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  Inativa: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
