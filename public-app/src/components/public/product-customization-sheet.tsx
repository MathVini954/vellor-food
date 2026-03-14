"use client";

import { Minus, MinusCircle, Plus, PlusCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getSelectedCustomizationExtraPrice } from "@/lib/product-customization";
import type { MenuProductCard } from "@/types/public";

type ProductCustomizationSheetProps = {
  product: MenuProductCard | null;
  quantity: number;
  selectedOptionIds: string[];
  onIncrementQuantity: () => void;
  onDecrementQuantity: () => void;
  onToggleOption: (groupId: string, optionId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProductCustomizationSheet({
  product,
  quantity,
  selectedOptionIds,
  onIncrementQuantity,
  onDecrementQuantity,
  onToggleOption,
  onClose,
  onConfirm,
}: ProductCustomizationSheetProps) {
  if (!product) {
    return null;
  }

  const extraPrice = getSelectedCustomizationExtraPrice(
    product.customizationConfig,
    selectedOptionIds,
  );
  const unitPrice = product.price + extraPrice;
  const totalPrice = unitPrice * quantity;
  const missingRequiredGroups = product.customizationConfig.additionalGroups.filter((group) => {
    if (!group.required) {
      return false;
    }

    return !group.options.some((option) => selectedOptionIds.includes(option.id));
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/40 backdrop-blur-[2px]">
      <div className="mx-auto flex max-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[34px] bg-[#fff9f4] shadow-[0_-24px_60px_rgba(15,23,42,0.24)]">
        <div className="px-5 pb-3 pt-3">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <div className="relative overflow-hidden rounded-[30px] bg-[#20110f] shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
            <div className="aspect-[16/11] w-full bg-[#20110f]">
              {product.imageUrl ? (
                <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} />
              ) : null}
            </div>

            <button
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur"
              type="button"
              onClick={onClose}
              aria-label="Fechar personalizacao"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {product.customizationConfig.mode === "build_your_own" ? "Monte seu prato" : "Personalizar pedido"}
                </p>
                <h2 className="mt-2 text-[24px] font-bold leading-tight text-slate-900">{product.name}</h2>
              </div>
              <div className="shrink-0 rounded-full bg-[#fff1ef] px-4 py-2 text-sm font-bold text-[#b5302c]">
                {formatCurrency(unitPrice)}
              </div>
            </div>

            {product.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">{product.description}</p>
            ) : null}

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {product.customizationConfig.mode === "build_your_own"
                ? "Escolha os complementos, molhos e adicionais para montar seu pedido."
                : "Ajuste os ingredientes e selecione adicionais antes de adicionar ao carrinho."}
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {product.customizationConfig.removableIngredients.length ? (
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Remover ingredientes
                </p>
                {product.customizationConfig.removableIngredients.map((ingredient) => {
                  const optionId = `remove:${ingredient}`;
                  const selected = selectedOptionIds.includes(optionId);

                  return (
                    <button
                      key={optionId}
                      className={`flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left transition ${
                        selected
                          ? "border border-[#ffd4d1] bg-[#fff3f1] text-[#b5302c]"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                      type="button"
                      onClick={() => onToggleOption(`remove:${ingredient}`, optionId)}
                    >
                      <div>
                        <p className="text-sm font-semibold">Sem {ingredient}</p>
                        <p className="mt-1 text-xs opacity-75">
                          {selected ? "Removido do prato" : "Toque para remover"}
                        </p>
                      </div>
                      {selected ? <MinusCircle size={20} /> : <PlusCircle size={20} />}
                    </button>
                  );
                })}
              </section>
            ) : null}

            {product.customizationConfig.additionalGroups.map((group) => (
              <section key={group.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {group.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {group.required ? "Escolha obrigatoria" : "Escolha opcional"} /{" "}
                      {group.selectionType === "multiple" ? "multipla" : "unica"}
                    </p>
                  </div>
                  {group.required ? (
                    <span className="rounded-full bg-[#fff1ef] px-3 py-1 text-[11px] font-semibold text-[#b5302c]">
                      Obrigatorio
                    </span>
                  ) : null}
                </div>

                {group.options.map((option) => {
                  const selected = selectedOptionIds.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      className={`flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left transition ${
                        selected
                          ? "border border-[#ffd4d1] bg-[#fff3f1] text-[#b5302c]"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                      type="button"
                      onClick={() => onToggleOption(group.id, option.id)}
                    >
                      <div>
                        <p className="text-sm font-semibold">{option.name}</p>
                        <p className="mt-1 text-xs opacity-75">
                          {option.price > 0 ? `Adiciona ${formatCurrency(option.price)}` : "Sem custo adicional"}
                        </p>
                      </div>
                      {selected ? <MinusCircle size={20} /> : <PlusCircle size={20} />}
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white/96 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_36px_rgba(15,23,42,0.08)] backdrop-blur">
          {missingRequiredGroups.length ? (
            <p className="mb-3 text-sm font-medium text-[#b5302c]">
              Escolha {missingRequiredGroups.map((group) => group.name).join(", ")} para continuar.
            </p>
          ) : (
            <p className="mb-3 text-sm text-slate-500">
              Total do item: <span className="font-semibold text-slate-900">{formatCurrency(totalPrice)}</span>
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-[20px] bg-[#111827] px-3 py-2 text-white">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                type="button"
                onClick={onDecrementQuantity}
                aria-label="Diminuir quantidade"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                type="button"
                onClick={onIncrementQuantity}
                aria-label="Aumentar quantidade"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className="flex-1 rounded-[22px] bg-[#e3342f] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(227,52,47,0.24)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              type="button"
              onClick={onConfirm}
              disabled={missingRequiredGroups.length > 0}
            >
              Adicionar / {formatCurrency(totalPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
