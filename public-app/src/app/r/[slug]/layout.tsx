import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RestaurantStoreProvider } from "@/components/public/restaurant-store-provider";
import { getPublicExperienceMode } from "@/lib/public-experience";
import { customerCookieName } from "@/lib/session";
import {
  getCustomerByRestaurantAndId,
  getRestaurantBySlug,
  getTableSessionByRestaurantAndId,
} from "@/services/public/restaurants";
import { tableSessionCookieName } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RestaurantLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const cookieStore = await cookies();
  const customerId = cookieStore.get(customerCookieName(slug))?.value;
  const publicExperienceMode = await getPublicExperienceMode(slug);
  const tableSessionId = cookieStore.get(tableSessionCookieName(slug))?.value;
  const initialCustomer = customerId
    ? await getCustomerByRestaurantAndId(restaurant.id, customerId)
    : null;
  const initialTableSession =
    tableSessionId && publicExperienceMode === "DINE_IN"
      ? await getTableSessionByRestaurantAndId(restaurant.id, tableSessionId)
      : null;

  return (
    <RestaurantStoreProvider
      key={`${slug}:${publicExperienceMode}`}
      slug={slug}
      restaurant={restaurant}
      initialCustomer={initialCustomer}
      initialTableSession={initialTableSession}
      experienceMode={publicExperienceMode}
    >
      <main className="min-h-screen">{children}</main>
    </RestaurantStoreProvider>
  );
}
