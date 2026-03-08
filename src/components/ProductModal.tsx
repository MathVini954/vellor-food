import { useEffect, useState } from "react";
import { FormSelect } from "./FormSelect";
import type { CategoryOption, MenuProduct, ProductStatus } from "../types/dashboard";
import {
  type CustomizationGroup,
  type ProductCustomizationConfig,
} from "../lib/productCustomization";

function normalizeOptionPrice(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || "R$ 0,00";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  }

  return "R$ 0,00";
}

type ProductModalProps = {
  isOpen: boolean;
  availableCategories: CategoryOption[];
  initialProduct?: MenuProduct | null;
  onClose: () => void;
  onSave: (product: Omit<MenuProduct, "id">, existingId?: string) => void;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  newCategory: string;
  imageUrl: string;
  status: ProductStatus;
  customizationMode: ProductCustomizationConfig["mode"];
  removableIngredients: string;
  additionalGroups: CustomizationGroup[];
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  newCategory: "",
  imageUrl: "",
  status: "Ativo",
  customizationMode: "standard",
  removableIngredients: "",
  additionalGroups: [],
};

export function ProductModal({
  isOpen,
  availableCategories,
  initialProduct,
  onClose,
  onSave,
}: ProductModalProps) {
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const hasInvalidBlobImage = form.imageUrl.startsWith("blob:");

  useEffect(() => {
    if (initialProduct) {
      setSubmitError("");
      setIsSaving(false);
      setForm({
        name: initialProduct.name,
        description: initialProduct.description,
        price: initialProduct.price,
        category: initialProduct.category,
        newCategory: "",
        imageUrl: initialProduct.imageUrl.startsWith("blob:") ? "" : initialProduct.imageUrl,
        status: initialProduct.status,
        customizationMode: initialProduct.customizationConfig.mode,
        removableIngredients: initialProduct.customizationConfig.removableIngredients.join("\n"),
        additionalGroups: initialProduct.customizationConfig.additionalGroups.map((group) => ({
          ...group,
          options: group.options.map((option) => ({
            ...option,
            price: normalizeOptionPrice(option.price),
          })),
        })),
      });
      if (initialProduct.imageUrl.startsWith("blob:")) {
        setSubmitError(
          "A imagem atual estava salva apenas localmente. Reenvie a imagem para ela aparecer no app mobile.",
        );
      }
      return;
    }

    setForm({
      ...emptyForm,
      category: availableCategories[0]?.name ?? "",
    });
    setSubmitError("");
    setIsSaving(false);
  }, [initialProduct, isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const resolvedCategory =
      form.category === "__new__" ? form.newCategory.trim() : form.category.trim();

    if (!form.imageUrl.trim() || hasInvalidBlobImage) {
      setSubmitError("Envie uma imagem valida ou informe uma URL publica para o prato.");
      return;
    }

    setIsSaving(true);

    try {
      await onSave(
        {
          ...form,
          category: resolvedCategory,
          customizationOptions: [
            ...form.removableIngredients
              .split("\n")
              .map((option) => option.trim())
              .filter(Boolean),
            ...form.additionalGroups.flatMap((group) => group.options.map((option) => option.name)),
          ],
          customizationConfig: {
            mode: form.customizationMode,
            removableIngredients: form.removableIngredients
              .split("\n")
              .map((option) => option.trim())
              .filter(Boolean),
            additionalGroups: form.additionalGroups
              .map((group) => ({
                ...group,
                name: group.name.trim(),
                options: group.options
                  .map((option) => ({
                    ...option,
                    name: option.name.trim(),
                    price: normalizeOptionPrice(option.price),
                  }))
                  .filter((option) => option.name.length > 0),
              }))
              .filter((group) => group.name.length > 0 && group.options.length > 0),
          },
        },
        initialProduct?.id,
      );
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Nao foi possivel salvar o item do cardapio.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setForm((current) => ({ ...current, imageUrl: result }));
      }
    };

    reader.readAsDataURL(file);
  }

  function addAdditionalGroup() {
    setForm((current) => ({
      ...current,
      additionalGroups: [
        ...current.additionalGroups,
        {
          id: `group-${Date.now()}`,
          name: "",
          selectionType: "multiple",
          required: false,
          options: [
            {
              id: `option-${Date.now()}`,
              name: "",
              price: "R$ 0,00",
            },
          ],
        },
      ],
    }));
  }

  function updateGroup(groupId: string, updater: (group: CustomizationGroup) => CustomizationGroup) {
    setForm((current) => ({
      ...current,
      additionalGroups: current.additionalGroups.map((group) =>
        group.id === groupId ? updater(group) : group,
      ),
    }));
  }

  function removeGroup(groupId: string) {
    setForm((current) => ({
      ...current,
      additionalGroups: current.additionalGroups.filter((group) => group.id !== groupId),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {initialProduct ? "Editar produto" : "Novo item"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Preencha os dados para publicar ou atualizar um item do cardapio.
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
          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nome do prato</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: File mignon ao molho"
                required
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Descricao</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Descreva os ingredientes e diferenciais do prato"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Preco</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                placeholder="R$ 0,00"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Categoria</span>
              <FormSelect
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value="__new__">Criar nova categoria</option>
              </FormSelect>
            </label>

            {form.category === "__new__" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nova categoria</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                  value={form.newCategory}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, newCategory: event.target.value }))
                  }
                  placeholder="Ex: Massas artesanais"
                  required
                />
              </label>
            ) : null}

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Tipo de personalizacao</span>
              <FormSelect
                value={form.customizationMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customizationMode: event.target.value as ProductCustomizationConfig["mode"],
                  }))
                }
              >
                <option value="standard">Produto padrao</option>
                <option value="build_your_own">Monte seu prato</option>
              </FormSelect>
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Ingredientes removiveis
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.removableIngredients}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    removableIngredients: event.target.value,
                  }))
                }
                placeholder={"Um ingrediente por linha\nEx: Cebola\nTomate\nPicles"}
              />
              <p className="text-xs text-slate-500">
                Esses itens vao aparecer no mobile como opcoes para remover do prato.
              </p>
            </label>

            <div className="space-y-4 sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-700">Grupos de adicionais</span>
                  <p className="mt-1 text-xs text-slate-500">
                    Crie molhos, extras, acompanhamentos e opcoes para montar o prato.
                  </p>
                </div>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  type="button"
                  onClick={addAdditionalGroup}
                >
                  + Novo grupo
                </button>
              </div>

              <div className="space-y-4">
                {form.additionalGroups.map((group) => (
                  <div key={group.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Nome do grupo</span>
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400"
                          value={group.name}
                          onChange={(event) =>
                            updateGroup(group.id, (current) => ({ ...current, name: event.target.value }))
                          }
                          placeholder="Ex: Molhos, adicionais, acompanhamentos"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Tipo de escolha</span>
                        <FormSelect
                          value={group.selectionType}
                          onChange={(event) =>
                            updateGroup(group.id, (current) => ({
                              ...current,
                              selectionType: event.target.value as CustomizationGroup["selectionType"],
                            }))
                          }
                        >
                          <option value="multiple">Multipla</option>
                          <option value="single">Unica</option>
                        </FormSelect>
                      </label>

                      <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <span className="text-sm font-medium text-slate-700">Obrigatorio</span>
                        <input
                          type="checkbox"
                          checked={group.required}
                          onChange={(event) =>
                            updateGroup(group.id, (current) => ({
                              ...current,
                              required: event.target.checked,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.options.map((option) => (
                        <div key={option.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                          <input
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                            value={option.name}
                            onChange={(event) =>
                              updateGroup(group.id, (current) => ({
                                ...current,
                                options: current.options.map((item) =>
                                  item.id === option.id ? { ...item, name: event.target.value } : item,
                                ),
                              }))
                            }
                            placeholder="Nome da opcao"
                          />
                          <input
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                            value={option.price}
                            onChange={(event) =>
                              updateGroup(group.id, (current) => ({
                                ...current,
                                options: current.options.map((item) =>
                                  item.id === option.id ? { ...item, price: event.target.value } : item,
                                ),
                              }))
                            }
                            placeholder="R$ 0,00"
                          />
                          <button
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                            type="button"
                            onClick={() =>
                              updateGroup(group.id, (current) => ({
                                ...current,
                                options: current.options.filter((item) => item.id !== option.id),
                              }))
                            }
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        type="button"
                        onClick={() =>
                          updateGroup(group.id, (current) => ({
                            ...current,
                            options: [
                              ...current.options,
                              {
                                id: `option-${Date.now()}-${current.options.length + 1}`,
                                name: "",
                                price: "R$ 0,00",
                              },
                            ],
                          }))
                        }
                      >
                        + Nova opcao
                      </button>
                      <button
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                        type="button"
                        onClick={() => removeGroup(group.id)}
                      >
                        Excluir grupo
                      </button>
                    </div>
                  </div>
                ))}

                {!form.additionalGroups.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Nenhum grupo criado. Adicione grupos para molhos, adicionais ou o fluxo de monte seu prato.
                  </div>
                ) : null}
              </div>
            </div>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Upload de imagem</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-900"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <p className="text-xs text-slate-500">
                O upload agora salva a imagem no formato compativel com o app mobile.
              </p>
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">URL da imagem</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
                placeholder="Cole a URL da imagem do prato"
                required
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Disponivel ou indisponivel</span>
              <FormSelect
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as ProductStatus,
                  }))
                }
              >
                <option value="Ativo">Disponivel</option>
                <option value="Inativo">Indisponivel</option>
              </FormSelect>
            </label>
          </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
