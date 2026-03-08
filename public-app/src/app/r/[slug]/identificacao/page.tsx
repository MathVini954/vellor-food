import { cookies } from "next/headers";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { IdentificationPageClient } from "@/components/public/identification-page-client";
import { customerCookieName } from "@/lib/session";
import {
  getCustomerByRestaurantAndId,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function IdentificationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlugOrThrow(slug);
  const cookieStore = await cookies();
  const customerId = cookieStore.get(customerCookieName(slug))?.value;
  const initialCustomer = customerId
    ? await getCustomerByRestaurantAndId(restaurant.id, customerId)
    : null;

  return (
    <PublicPageShell slug={slug}>
      <IdentificationPageClient
        slug={slug}
        restaurant={restaurant}
        initialCustomer={initialCustomer}
      />
    </PublicPageShell>
  );
}
