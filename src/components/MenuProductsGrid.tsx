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
          <p className="section-label">Catalogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">{description}</p>
        </div>
        <div className="rounded-full border border-[color:var(--border-soft)] bg-white/82 px-3 py-1.5 text-xs font-medium text-[color:var(--text-muted)]">
          {products.length} itens
        </div>
      </div>

      {products.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="panel overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden bg-[color:var(--surface-muted)]">
                <img
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  src={product.imageUrl}
                  alt={product.name}
                />
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{product.name}</h2>
                    <p className="mt-1 text-sm text-[color:var(--text-muted)]">{product.category}</p>
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>

                <p className="min-h-[66px] text-sm leading-6 text-[color:var(--text-muted)]">{product.description}</p>

                {product.customizationOptions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {product.customizationOptions.slice(0, 3).map((option) => (
                      <span
                        key={`${product.id}-${option}`}
                        className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-medium text-[color:var(--accent-strong)]"
                      >
                        {option}
                      </span>
                    ))}
                    {product.customizationOptions.length > 3 ? (
                      <span className="rounded-full bg-white/84 px-3 py-1 text-xs font-medium text-[color:var(--text-muted)]">
                        +{product.customizationOptions.length - 3} opcoes
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-[color:var(--text-strong)]">{product.price}</span>
                  <span className="rounded-full bg-white/84 px-3 py-1 text-xs font-medium text-[color:var(--text-muted)]">
                    {product.category}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button className="action-secondary !px-3 !py-2.5" type="button" onClick={() => onEdit(product)}>
                    Editar
                  </button>
                  <button className="action-warning !px-3 !py-2.5" type="button" onClick={() => onToggleStatus(product.id)}>
                    {product.status === "Ativo" ? "Desativar" : "Ativar"}
                  </button>
                  <button className="action-danger !px-3 !py-2.5" type="button" onClick={() => onDelete(product.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel flex min-h-[260px] items-center justify-center border-dashed text-center">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">Nenhum item nesta categoria</h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Cadastre produtos nesta categoria para organizar o cardapio por pagina.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
