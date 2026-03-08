import { cookies } from "next/headers";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { CheckoutPageClient } from "@/components/public/checkout-page-client";
import { requirePublicAccess } from "@/lib/public-access";
import { customerCookieName } from "@/lib/session";
import {
  getCustomerByRestaurantAndId,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requirePublicAccess(slug);
  const restaurant = await getRestaurantBySlugOrThrow(slug);
  const cookieStore = await cookies();
  const customerId = cookieStore.get(customerCookieName(slug))?.value;
  const initialCustomer = customerId
    ? await getCustomerByRestaurantAndId(restaurant.id, customerId)
    : null;

  return (
    <PublicPageShell slug={slug}>
      <CheckoutPageClient slug={slug} restaurant={restaurant} initialCustomer={initialCustomer} />
    </PublicPageShell>
  );
}
