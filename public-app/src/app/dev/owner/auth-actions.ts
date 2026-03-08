"use server";

import { redirect } from "next/navigation";
import {
  authenticateOwnerConsole,
  clearOwnerConsoleSession,
  createOwnerConsoleSession,
  hasOwnerConsoleCredentialsConfigured,
} from "@/lib/owner-auth";

export async function loginOwnerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!hasOwnerConsoleCredentialsConfigured()) {
    redirect("/dev/owner/login?error=not-configured");
  }

  const authenticated = await authenticateOwnerConsole({ email, password });

  if (!authenticated) {
    redirect("/dev/owner/login?error=invalid");
  }

  await createOwnerConsoleSession(email);
  redirect("/dev/owner");
}

export async function logoutOwnerAction() {
  await clearOwnerConsoleSession();
  redirect("/dev/owner/login");
}
