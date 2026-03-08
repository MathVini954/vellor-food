import { ProductStatusBadge } from "./ProductStatusBadge";
import type { MenuProduct } from "../types/dashboard";

type MenuProductsGridProps = {
  title: string;
  description: string;
  products: MenuProduct[];
  onEdit: (product: MenuProduct) => void;
  onToggleStatus: (productId: string) => void;
  onDelete: (productId: string) => void;
};

export function MenuProductsGrid({
  title,
  description,
  products,
  onEdit,
  onToggleStatus,
  onDelete,
}: MenuProductsGridProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
          {products.length} itens
        </div>
      </div>

      {products.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="panel overflow-hidden rounded-[28px]">
              <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                <img
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  src={product.imageUrl}
                  alt={product.name}
                />
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>

                <p className="min-h-[66px] text-sm leading-6 text-slate-600">{product.description}</p>

                {product.customizationOptions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {product.customizationOptions.slice(0, 3).map((option) => (
                      <span
                        key={`${product.id}-${option}`}
                        className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                      >
                        {option}
                      </span>
                    ))}
                    {product.customizationOptions.length > 3 ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        +{product.customizationOptions.length - 3} opcoes
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-slate-900">{product.price}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {product.category}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    type="button"
                    onClick={() => onEdit(product)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                    type="button"
                    onClick={() => onToggleStatus(product.id)}
                  >
                    {product.status === "Ativo" ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    type="button"
                    onClick={() => onDelete(product.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel flex min-h-[260px] items-center justify-center rounded-[28px] border-dashed text-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nenhum item nesta categoria</h3>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre produtos nesta categoria para organizar o cardapio por pagina.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
