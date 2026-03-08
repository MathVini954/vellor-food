import type { ProductStatus } from "../types/dashboard";

type ProductStatusBadgeProps = {
  status: ProductStatus;
};

const statusStyles: Record<ProductStatus, string> = {
  Ativo: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  Inativo: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
