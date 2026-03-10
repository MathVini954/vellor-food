import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { customerCookieName, dineInAccessCookieName, guestCookieName } from "./session";

export async function requirePublicAccess(slug: string) {
  const cookieStore = await cookies();
  const hasCustomer = Boolean(cookieStore.get(customerCookieName(slug)));
  const hasGuest = Boolean(cookieStore.get(guestCookieName(slug)));
  const hasDineInAccess = Boolean(cookieStore.get(dineInAccessCookieName(slug)));

  if (!hasCustomer && !hasGuest && !hasDineInAccess) {
    redirect(`/r/${slug}/identificacao`);
  }
}
