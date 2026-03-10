import type { Prisma } from "@prisma/client";

export const contractStatusStyles = {
  ACTIVE: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
  INACTIVE: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  SUSPENDED: "border-amber-500/30 bg-amber-500/12 text-amber-200",
  CANCELED: "border-rose-500/30 bg-rose-500/12 text-rose-200",
} as const;

export const provisioningStatusStyles = {
  PENDING: "border-sky-500/30 bg-sky-500/12 text-sky-200",
  PROCESSING: "border-indigo-500/30 bg-indigo-500/12 text-indigo-200",
  SUCCEEDED: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
  FAILED: "border-rose-500/30 bg-rose-500/12 text-rose-200",
  CANCELED: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
} as const;

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

export function formatMoney(value: Prisma.Decimal | { toNumber(): number } | number | null | undefined) {
  if (value == null) {
    return "--";
  }

  const amount =
    typeof value === "number"
      ? value
      : "toNumber" in value
        ? value.toNumber()
        : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function formatOrderChannel(orderType: string) {
  if (orderType === "DINE_IN") {
    return "Mesa";
  }

  if (orderType === "PICKUP") {
    return "Retirada";
  }

  return "Online";
}

export function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    NEW: "Novo",
    ACCEPTED: "Aceito",
    PREPARING: "Em preparo",
    SENT: "Enviado",
    DELIVERED: "Entregue",
    CANCELED: "Cancelado",
  };

  return labels[status] ?? status;
}

export function formatPaymentStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    FAILED: "Falhou",
    REFUNDED: "Estornado",
  };

  return labels[status] ?? status;
}

export function formatPaymentMethod(method: string) {
  const labels: Record<string, string> = {
    CASH: "Dinheiro",
    PIX: "Pix",
    CARD_ON_DELIVERY: "Cartao na entrega",
    PAY_ON_PICKUP: "Pagamento no caixa",
  };

  return labels[method] ?? method;
}

export type OwnerFeedback = {
  tone: "success" | "error";
  message: string;
  scope: "global" | "create" | "company";
  companyId: string | null;
};

export function resolveOwnerFeedback(searchParams: Record<string, string | string[] | undefined>) {
  const notice = readSearchParam(searchParams.notice);
  const error = readSearchParam(searchParams.error);
  const companyId = readSearchParam(searchParams.companyId) || null;
  const focus = readSearchParam(searchParams.focus);

  if (error) {
    return {
      tone: "error" as const,
      message: error,
      scope: companyId ? ("company" as const) : focus === "create" ? ("create" as const) : ("global" as const),
      companyId,
    } satisfies OwnerFeedback;
  }

  switch (notice) {
    case "company-created":
      return {
        tone: "success" as const,
        message: "Empresa provisionada com sucesso. O tenant ja esta pronto para operacao inicial.",
        scope: "create" as const,
        companyId: null,
      } satisfies OwnerFeedback;
    case "contract-updated":
      return {
        tone: "success" as const,
        message: "Contrato aplicado. Pacotes, acessos e provisionamento foram reprocessados.",
        scope: "company" as const,
        companyId,
      } satisfies OwnerFeedback;
    case "tenant-reprocessed":
      return {
        tone: "success" as const,
        message: "Tenant resincronizado com sucesso. O owner forçou um novo ciclo de provisionamento.",
        scope: "company" as const,
        companyId,
      } satisfies OwnerFeedback;
    case "company-deleted":
      return {
        tone: "success" as const,
        message: "Empresa removida do registry central.",
        scope: "global" as const,
        companyId: null,
      } satisfies OwnerFeedback;
    default:
      return null;
  }
}
