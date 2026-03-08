export type CustomizationMode = "standard" | "build_your_own";

export type CustomizationOption = {
  id: string;
  name: string;
  price: string;
};

export type CustomizationGroup = {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  required: boolean;
  options: CustomizationOption[];
};

export type ProductCustomizationConfig = {
  mode: CustomizationMode;
  removableIngredients: string[];
  additionalGroups: CustomizationGroup[];
};

export const emptyCustomizationConfig: ProductCustomizationConfig = {
  mode: "standard",
  removableIngredients: [],
  additionalGroups: [],
};

function normalizePrice(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "R$ 0,00";
}

function normalizeSelectionType(value: unknown): CustomizationGroup["selectionType"] {
  return value === "multiple" ? "multiple" : "single";
}

export function parseCustomizationConfig(value: unknown): ProductCustomizationConfig {
  if (!value) {
    return emptyCustomizationConfig;
  }

  if (Array.isArray(value)) {
    return {
      mode: "standard",
      removableIngredients: value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim()),
      additionalGroups: [],
    };
  }

  if (typeof value !== "object") {
    return emptyCustomizationConfig;
  }

  const raw = value as {
    mode?: unknown;
    removableIngredients?: unknown;
    additionalGroups?: unknown;
  };

  return {
    mode: raw.mode === "build_your_own" ? "build_your_own" : "standard",
    removableIngredients: Array.isArray(raw.removableIngredients)
      ? raw.removableIngredients
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
      : [],
    additionalGroups: Array.isArray(raw.additionalGroups)
      ? raw.additionalGroups
          .filter((group): group is Record<string, unknown> => Boolean(group && typeof group === "object"))
          .map((group, groupIndex) => ({
            id: typeof group.id === "string" && group.id.trim() ? group.id.trim() : `group-${groupIndex + 1}`,
            name: typeof group.name === "string" ? group.name.trim() : "",
            selectionType: normalizeSelectionType(group.selectionType),
            required: Boolean(group.required),
            options: Array.isArray(group.options)
              ? group.options
                  .filter((option): option is Record<string, unknown> => Boolean(option && typeof option === "object"))
                  .map((option, optionIndex) => ({
                    id:
                      typeof option.id === "string" && option.id.trim()
                        ? option.id.trim()
                        : `option-${groupIndex + 1}-${optionIndex + 1}`,
                    name: typeof option.name === "string" ? option.name.trim() : "",
                    price: normalizePrice(option.price),
                  }))
                  .filter((option) => option.name.length > 0)
              : [],
          }))
          .filter((group) => group.name.length > 0 && group.options.length > 0)
      : [],
  };
}

export function summarizeCustomizationConfig(config: ProductCustomizationConfig) {
  return [
    ...config.removableIngredients,
    ...config.additionalGroups.flatMap((group) => group.options.map((option) => option.name)),
  ];
}
