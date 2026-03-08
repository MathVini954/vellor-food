import type { Prisma } from "@prisma/client";

export function parseCustomizationConfig(
  rawConfig: unknown,
  fallbackOptions: unknown,
): Prisma.InputJsonValue {
  if (rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig)) {
    const config = rawConfig as {
      mode?: unknown;
      removableIngredients?: unknown;
      additionalGroups?: unknown;
    };

    return {
      mode: config.mode === "build_your_own" ? "build_your_own" : "standard",
      removableIngredients: Array.isArray(config.removableIngredients)
        ? config.removableIngredients
            .map((item) => String(item ?? "").trim())
            .filter(Boolean)
        : [],
      additionalGroups: Array.isArray(config.additionalGroups)
        ? config.additionalGroups
            .map((group) => {
              const nextGroup = group as {
                id?: unknown;
                name?: unknown;
                selectionType?: unknown;
                required?: unknown;
                options?: unknown;
              };

              return {
                id: String(nextGroup.id ?? "").trim(),
                name: String(nextGroup.name ?? "").trim(),
                selectionType: nextGroup.selectionType === "multiple" ? "multiple" : "single",
                required: Boolean(nextGroup.required),
                options: Array.isArray(nextGroup.options)
                  ? nextGroup.options
                      .map((option) => {
                        const nextOption = option as {
                          id?: unknown;
                          name?: unknown;
                          price?: unknown;
                        };

                        return {
                          id: String(nextOption.id ?? "").trim(),
                          name: String(nextOption.name ?? "").trim(),
                          price: String(nextOption.price ?? "R$ 0,00").trim() || "R$ 0,00",
                        };
                      })
                      .filter((option) => option.name.length > 0)
                  : [],
              };
            })
            .filter((group) => group.name.length > 0 && group.options.length > 0)
        : [],
    } satisfies Prisma.InputJsonValue;
  }

  return Array.isArray(fallbackOptions)
    ? fallbackOptions
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    : [];
}
