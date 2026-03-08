import { useEffect, useMemo, useState } from "react";
import { FormSelect } from "./FormSelect";
import type { CategoryOption, MenuProduct, Offer, OfferStatus, OfferType } from "../types/dashboard";

type OfferModalProps = {
  isOpen: boolean;
  availableProducts: MenuProduct[];
  availableCategories: CategoryOption[];
  initialOffer?: Offer | null;
  onClose: () => void;
  onSave: (offer: Omit<Offer, "id">, existingId?: string) => void;
};

type OfferFormState = {
  name: string;
  type: OfferType;
  discount: string;
  startDate: string;
  endDate: string;
  status: OfferStatus;
  productIds: string[];
  categoryIds: string[];
};

const offerTypes: OfferType[] = [
  "Desconto em todos os itens",
  "Desconto em categoria",
  "Prato do dia",
  "Promocao especifica",
];

const emptyForm: OfferFormState = {
  name: "",
  type: "Prato do dia",
  discount: "",
  startDate: "",
  endDate: "",
  status: "Ativa",
  productIds: [],
  categoryIds: [],
};

export function OfferModal({
  isOpen,
  availableProducts,
  availableCategories,
  initialOffer,
  onClose,
  onSave,
}: OfferModalProps) {
  const [form, setForm] = useState<OfferFormState>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialOffer) {
      setForm({
        name: initialOffer.name,
        type: initialOffer.type,
        discount: initialOffer.discount,
        startDate: initialOffer.startDate,
        endDate: initialOffer.endDate,
        status: initialOffer.status,
        productIds: initialOffer.productIds,
        categoryIds: initialOffer.categoryIds,
      });
      setError("");
      return;
    }

    setForm(emptyForm);
    setError("");
  }, [initialOffer, isOpen]);

  const appliesTo = useMemo(() => {
    const selectedCategories = availableCategories
      .filter((category) => form.categoryIds.includes(category.id))
      .map((category) => category.name);
    const selectedProducts = availableProducts
      .filter((product) => form.productIds.includes(product.id))
      .map((product) => product.name);

    return [...selectedCategories.map((name) => `Categoria: ${name}`), ...selectedProducts].join(", ");
  }, [availableCategories, availableProducts, form.categoryIds, form.productIds]);

  if (!isOpen) {
    return null;
  }

  function toggleCategory(categoryId: string) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  function toggleProduct(productId: string) {
    setForm((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.productIds.length && !form.categoryIds.length) {
      setError("Selecione ao menos um prato ou categoria para a oferta.");
      return;
    }

    onSave(
      {
        ...form,
        appliesTo,
      },
      initialOffer?.id,
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {initialOffer ? "Editar oferta" : "Nova oferta"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vincule a oferta a pratos e categorias reais do cardapio.
            </p>
          </div>
          <button
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nome da oferta</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Prato especial do dia"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Tipo de oferta</span>
              <FormSelect
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as OfferType }))
                }
              >
                {offerTypes.map((offerType) => (
                  <option key={offerType} value={offerType}>
                    {offerType}
                  </option>
                ))}
              </FormSelect>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Destaque / desconto</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.discount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, discount: event.target.value }))
                }
                placeholder="Ex: 20% OFF ou Menu especial"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Data de inicio</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startDate: event.target.value }))
                }
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Data de fim</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
                required
              />
            </label>

            <label className="block space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">Ativar ou desativar</span>
              <FormSelect
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as OfferStatus,
                  }))
                }
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </FormSelect>
            </label>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Categorias incluidas</h3>
              <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      form.categoryIds.includes(category.id)
                        ? "bg-[#111827] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Pratos incluidos</h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {availableProducts.map((product) => (
                  <button
                    key={product.id}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                      form.productIds.includes(product.id)
                        ? "bg-[#111827] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                  >
                    <span>{product.name}</span>
                    <span className="text-xs opacity-75">{product.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Oferta aplicada em
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {appliesTo || "Selecione categorias e/ou pratos para montar a oferta."}
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              type="submit"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
