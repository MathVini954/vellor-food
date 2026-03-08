"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RestaurantContractStatus } from "@prisma/client";
import { assertDevOwnerToken } from "@/lib/dev-owner";
import {
  createManagedCompany,
  deleteManagedCompany,
  updateManagedCompanyContract,
} from "@/services/platform/owner-dashboard";

function redirectBack(token: string) {
  revalidatePath("/dev/owner");
  redirect(`/dev/owner?token=${encodeURIComponent(token)}`);
}

export async function createCompanyAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  assertDevOwnerToken(token);

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
  });

  redirectBack(token);
}

export async function updateCompanyStatusAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  assertDevOwnerToken(token);

  await updateManagedCompanyContract({
    restaurantId: String(formData.get("restaurantId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE") as RestaurantContractStatus,
    endsAt: String(formData.get("endsAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  redirectBack(token);
}

export async function deleteCompanyAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  assertDevOwnerToken(token);

  await deleteManagedCompany(String(formData.get("restaurantId") ?? ""));

  redirectBack(token);
}
