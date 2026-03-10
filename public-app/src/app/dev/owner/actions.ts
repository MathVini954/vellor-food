"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RestaurantContractStatus } from "@prisma/client";
import {
  assertOwnerConsoleMutationAccess,
  hasOwnerConsoleCredentialsConfigured,
} from "@/lib/owner-auth";
import {
  createManagedCompany,
  deleteManagedCompany,
  updateManagedCompanyContract,
} from "@/services/platform/owner-dashboard";

function redirectBack(legacyToken?: string) {
  revalidatePath("/dev/owner");

  if (!hasOwnerConsoleCredentialsConfigured() && legacyToken) {
    redirect(`/dev/owner?token=${encodeURIComponent(legacyToken)}`);
  }

  redirect("/dev/owner");
}

export async function createCompanyAction(formData: FormData) {
  const legacyToken = String(formData.get("token") ?? "");
  await assertOwnerConsoleMutationAccess(legacyToken);

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
    adminEnabled: formData.get("adminEnabled") === "on",
    publicOrderingEnabled: formData.get("publicOrderingEnabled") === "on",
    digitalMenuEnabled: formData.get("digitalMenuEnabled") === "on",
  });

  redirectBack(legacyToken);
}

export async function updateCompanyStatusAction(formData: FormData) {
  const legacyToken = String(formData.get("token") ?? "");
  await assertOwnerConsoleMutationAccess(legacyToken);

  await updateManagedCompanyContract({
    restaurantId: String(formData.get("restaurantId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE") as RestaurantContractStatus,
    endsAt: String(formData.get("endsAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    adminEnabled: formData.get("adminEnabled") === "on",
    publicOrderingEnabled: formData.get("publicOrderingEnabled") === "on",
    digitalMenuEnabled: formData.get("digitalMenuEnabled") === "on",
  });

  redirectBack(legacyToken);
}

export async function deleteCompanyAction(formData: FormData) {
  const legacyToken = String(formData.get("token") ?? "");
  await assertOwnerConsoleMutationAccess(legacyToken);

  await deleteManagedCompany(String(formData.get("restaurantId") ?? ""));

  redirectBack(legacyToken);
}
