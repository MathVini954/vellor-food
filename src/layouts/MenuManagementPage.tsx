import { useEffect, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { MenuProductsGrid } from "../components/MenuProductsGrid";
import { ProductModal } from "../components/ProductModal";
import type { AdminSection, CategoryOption, FeatureAccess, MenuProduct } from "../types/dashboard";

type MenuManagementPageProps = {
  restaurantName: string;
  userName: string;
  featureAccess: FeatureAccess;
  availableCategories: CategoryOption[];
  initialProducts: MenuProduct[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onSaveProduct: (product: Omit<MenuProduct, "id">, existingId?: string) => Promise<void>;
  onToggleProductStatus: (productId: string, status: MenuProduct["status"]) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
};

export function MenuManagementPage({
  restaurantName,
  userName,
  featureAccess,
  availableCategories,
  initialProducts,
  onLogout,
  onNavigate,
  onSaveProduct,
  onToggleProductStatus,
  onDeleteProduct,
}: MenuManagementPageProps) {
  const [products, setProducts] = useState<MenuProduct[]>(initialProducts);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuProduct | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (
      activeCategoryId !== "all" &&
      !availableCategories.some((category) => category.id === activeCategoryId)
    ) {
      setActiveCategoryId("all");
    }
  }, [activeCategoryId, availableCategories]);

  function handleCreate() {
    setEditingProduct(null);
    setIsModalOpen(true);
  }

  function handleEdit(product: MenuProduct) {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  async function handleToggleStatus(productId: string) {
    const target = products.find((product) => product.id === productId);

    if (!target) {
      return;
    }

    const nextStatus = target.status === "Ativo" ? "Inativo" : "Ativo";

    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, status: nextStatus } : product,
      ),
    );

    await onToggleProductStatus(productId, nextStatus);
  }

  async function handleDelete(productId: string) {
    setProducts((current) => current.filter((product) => product.id !== productId));
    await onDeleteProduct(productId);
  }

  async function handleSave(product: Omit<MenuProduct, "id">, existingId?: string) {
    await onSaveProduct(product, existingId);
  }

  const categoryPages = [
    {
      id: "all",
      name: "Todos",
      count: products.length,
    },
    ...availableCategories.map((category) => ({
      id: category.id,
      name: category.name,
      count: products.filter((product) => product.category === category.name).length,
    })),
  ];

  const activeCategory = categoryPages.find((category) => category.id === activeCategoryId) ?? categoryPages[0];
  const filteredProducts =
    activeCategory.id === "all"
      ? products
      : products.filter((product) => product.category === activeCategory.name);

  return (
    <>
      <AdminShell
        activeSection="Cardapio"
        restaurantName={restaurantName}
        userName={userName}
        featureAccess={featureAccess}
        pageTitle="Cardapio do restaurante"
        pageSubtitle="Gerencie catalogo, categorias e personalizacoes que abastecem o app do cliente."
        onLogout={onLogout}
        onNavigate={onNavigate}
      >
        <section className="panel mb-5 overflow-hidden p-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-2">
              {categoryPages.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    activeCategory.id === category.id
                      ? "bg-[#171b38] text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="text-sm font-semibold">{category.name}</div>
                  <div
                    className={`mt-1 text-xs ${
                      activeCategory.id === category.id ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {category.count} itens
                  </div>
                </button>
              ))}
            </div>

            <button
              className="rounded-2xl bg-[#171b38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1730]"
              type="button"
              onClick={handleCreate}
            >
              + Novo item
            </button>
          </div>
        </section>

        <MenuProductsGrid
          title={activeCategory.id === "all" ? "Todos os itens" : activeCategory.name}
          description={
            activeCategory.id === "all"
              ? "Visao geral completa do cardapio do restaurante."
              : `Itens da categoria ${activeCategory.name} para organizar o cardapio em paginas internas.`
          }
          products={filteredProducts}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      </AdminShell>

      <ProductModal
        isOpen={isModalOpen}
        availableCategories={availableCategories}
        initialProduct={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
