"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RestaurantContractStatus, SaaSProductCode } from "@prisma/client";
import {
  authenticateOwnerConsole,
  clearOwnerConsoleSession,
  createOwnerConsoleSession,
  hasOwnerConsoleCredentialsConfigured,
  requireOwnerConsoleSession,
} from "@/lib/owner-auth";
import {
  createManagedCompany,
  deleteManagedCompany,
  reprocessManagedCompanyProvisioning,
  updateManagedCompanyContract,
} from "@/services/platform/owner-dashboard";

export async function loginOwnerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!hasOwnerConsoleCredentialsConfigured()) {
    redirect("/login?error=not-configured");
  }

  const authenticated = await authenticateOwnerConsole({ email, password });

  if (!authenticated) {
    redirect("/login?error=invalid");
  }

  await createOwnerConsoleSession(email);
  redirect("/");
}

export async function logoutOwnerAction() {
  await clearOwnerConsoleSession();
  redirect("/login");
}

function sanitizeRedirectPath(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith("/")) {
    return "/";
  }

  return normalized.split("#")[0].split("?")[0] || "/";
}

function buildConsoleRedirect(
  basePath: string,
  params?: {
  notice?: string;
  error?: string;
  companyId?: string;
  focus?: "create";
  hash?: string;
},
) {
  const searchParams = new URLSearchParams();

  if (params?.notice) {
    searchParams.set("notice", params.notice);
  }

  if (params?.error) {
    searchParams.set("error", params.error);
  }

  if (params?.companyId) {
    searchParams.set("companyId", params.companyId);
  }

  if (params?.focus) {
    searchParams.set("focus", params.focus);
  }

  const query = searchParams.toString();
  const hash = params?.hash ? `#${params.hash}` : "";
  return query ? `${basePath}?${query}${hash}` : `${basePath}${hash}`;
}

function redirectConsole(
  basePath: string,
  params?: {
  notice?: string;
  error?: string;
  companyId?: string;
  focus?: "create";
  hash?: string;
},
) {
  revalidatePath("/");
  if (basePath !== "/") {
    revalidatePath(basePath);
  }
  redirect(buildConsoleRedirect(basePath, params));
}

function getActionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
}

export async function createCompanyAction(formData: FormData) {
  await requireOwnerConsoleSession();
  const redirectPath = sanitizeRedirectPath(formData.get("redirectTo")?.toString());

  try {
    await createManagedCompany({
      companyName: String(formData.get("companyName") ?? ""),
      primaryContactPhone: String(formData.get("primaryContactPhone") ?? ""),
      adminName: String(formData.get("adminName") ?? ""),
      email: String(formData.get("email") ?? ""),
      temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
      contractStartsAt: String(formData.get("contractStartsAt") ?? ""),
      contractEndsAt: String(formData.get("contractEndsAt") ?? ""),
      monthlyPrice: String(formData.get("monthlyPrice") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "ACTIVE") as RestaurantContractStatus,
      productCode: String(formData.get("productCode") ?? "FOOD") as SaaSProductCode,
      adminEnabled: formData.get("adminEnabled") === "on",
      publicOrderingEnabled: formData.get("publicOrderingEnabled") === "on",
      digitalMenuEnabled: formData.get("digitalMenuEnabled") === "on",
    });
  } catch (error) {
    redirectConsole(redirectPath, {
      error: getActionErrorMessage(error, "Nao foi possivel provisionar a empresa."),
      focus: "create",
      hash: "create-company",
    });
  }

  redirectConsole(redirectPath, {
    notice: "company-created",
    focus: "create",
    hash: "create-company",
  });
}

export async function updateCompanyStatusAction(formData: FormData) {
  await requireOwnerConsoleSession();
  const companyId = String(formData.get("companyId") ?? "");
  const redirectPath = sanitizeRedirectPath(formData.get("redirectTo")?.toString());
  const hash = String(formData.get("hash") ?? "") || `company-${companyId}`;

  try {
    await updateManagedCompanyContract({
      companyId,
      status: String(formData.get("status") ?? "ACTIVE") as RestaurantContractStatus,
      endsAt: String(formData.get("endsAt") ?? ""),
      monthlyPrice: String(formData.get("monthlyPrice") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      productCode: String(formData.get("productCode") ?? "FOOD") as SaaSProductCode,
      adminEnabled: formData.get("adminEnabled") === "on",
      publicOrderingEnabled: formData.get("publicOrderingEnabled") === "on",
      digitalMenuEnabled: formData.get("digitalMenuEnabled") === "on",
    });
  } catch (error) {
    redirectConsole(redirectPath, {
      error: getActionErrorMessage(error, "Nao foi possivel aplicar o contrato."),
      companyId,
      hash,
    });
  }

  redirectConsole(redirectPath, {
    notice: "tenant-reprocessed",
    companyId,
    hash,
  });
}

export async function deleteCompanyAction(formData: FormData) {
  await requireOwnerConsoleSession();
  const companyId = String(formData.get("companyId") ?? "");
  const redirectPath = sanitizeRedirectPath(formData.get("redirectTo")?.toString());

  try {
    await deleteManagedCompany(companyId);
  } catch (error) {
    redirectConsole(redirectPath, {
      error: getActionErrorMessage(error, "Nao foi possivel remover a empresa."),
    });
  }

  redirectConsole("/", {
    notice: "company-deleted",
  });
}

export async function reprocessCompanyProvisionAction(formData: FormData) {
  await requireOwnerConsoleSession();
  const companyId = String(formData.get("companyId") ?? "");
  const redirectPath = sanitizeRedirectPath(formData.get("redirectTo")?.toString());
  const hash = String(formData.get("hash") ?? "") || `company-${companyId}`;

  try {
    await reprocessManagedCompanyProvisioning({
      companyId,
      productCode: String(formData.get("productCode") ?? "FOOD") as SaaSProductCode,
    });
  } catch (error) {
    redirectConsole(redirectPath, {
      error: getActionErrorMessage(error, "Nao foi possivel reprocessar o tenant."),
      companyId,
      hash,
    });
  }

  redirectConsole(redirectPath, {
    notice: "contract-updated",
    companyId,
    hash,
  });
}
