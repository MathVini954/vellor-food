import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { customerCookieName, guestCookieName } from "./session";

export async function requirePublicAccess(slug: string) {
  const cookieStore = await cookies();
  const hasCustomer = Boolean(cookieStore.get(customerCookieName(slug)));
  const hasGuest = Boolean(cookieStore.get(guestCookieName(slug)));

  if (!hasCustomer && !hasGuest) {
    redirect(`/r/${slug}/identificacao`);
  }
}
