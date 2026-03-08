"use client";

import { MinusCircle, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { MenuProductCard } from "@/types/public";

type ProductCustomizationSheetProps = {
  product: MenuProductCard | null;
  selectedOptionIds: string[];
  onToggleOption: (groupId: string, optionId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProductCustomizationSheet({
  product,
  selectedOptionIds,
  onToggleOption,
  onClose,
  onConfirm,
}: ProductCustomizationSheetProps) {
  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/35 backdrop-blur-[2px]">
      <div className="w-full rounded-t-[34px] bg-white px-5 pb-8 pt-5 shadow-[0_-20px_50px_rgba(15,23,42,0.22)]">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200" />

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {product.customizationConfig.mode === "build_your_own" ? "Monte seu prato" : "Personalizar pedido"}
          </p>
          <h2 className="mt-2 text-[24px] font-bold text-slate-900">{product.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {product.customizationConfig.mode === "build_your_own"
              ? "Escolha os complementos, molhos e adicionais para montar seu pedido."
              : "Ajuste os ingredientes e selecione adicionais antes de adicionar ao carrinho."}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {product.customizationConfig.removableIngredients.length ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Remover ingredientes
              </p>
              {product.customizationConfig.removableIngredients.map((ingredient) => {
                const optionId = `remove:${ingredient}`;
                const selected = selectedOptionIds.includes(optionId);

                return (
                  <button
                    key={optionId}
                    className={`flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left transition ${
                      selected
                        ? "border border-[#ffd4d1] bg-[#fff3f1] text-[#b5302c]"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
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
            </div>
          ) : null}

          {product.customizationConfig.additionalGroups.map((group) => (
            <div key={group.id} className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {group.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {group.required ? "Escolha obrigatoria" : "Escolha opcional"} •{" "}
                  {group.selectionType === "multiple" ? "multipla" : "unica"}
                </p>
              </div>
              {group.options.map((option) => {
                const selected = selectedOptionIds.includes(option.id);

                return (
                  <button
                    key={option.id}
                    className={`flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left transition ${
                      selected
                        ? "border border-[#ffd4d1] bg-[#fff3f1] text-[#b5302c]"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
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
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-[20px] border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-[1.2] rounded-[20px] bg-[#e3342f] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(227,52,47,0.24)]"
            type="button"
            onClick={onConfirm}
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
