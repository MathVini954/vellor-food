import type { ProductStatus } from "../types/dashboard";

type ProductStatusBadgeProps = {
  status: ProductStatus;
};

const statusStyles: Record<ProductStatus, string> = {
  Ativo: "bg-[color:var(--accent-green-soft)] text-[color:var(--accent-green)] ring-1 ring-[rgba(47,108,96,0.12)]",
  Inativo: "bg-white/84 text-[color:var(--text-muted)] ring-1 ring-[color:var(--border-soft)]",
};

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
