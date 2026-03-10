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

function refreshDashboard() {
  revalidatePath("/");
  redirect("/");
}

export async function createCompanyAction(formData: FormData) {
  await requireOwnerConsoleSession();

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

  refreshDashboard();
}

export async function updateCompanyStatusAction(formData: FormData) {
  await requireOwnerConsoleSession();

  await updateManagedCompanyContract({
    companyId: String(formData.get("companyId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE") as RestaurantContractStatus,
    endsAt: String(formData.get("endsAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    productCode: String(formData.get("productCode") ?? "FOOD") as SaaSProductCode,
    adminEnabled: formData.get("adminEnabled") === "on",
    publicOrderingEnabled: formData.get("publicOrderingEnabled") === "on",
    digitalMenuEnabled: formData.get("digitalMenuEnabled") === "on",
  });

  refreshDashboard();
}

export async function deleteCompanyAction(formData: FormData) {
  await requireOwnerConsoleSession();
  await deleteManagedCompany(String(formData.get("companyId") ?? ""));
  refreshDashboard();
}
