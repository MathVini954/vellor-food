import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RestaurantStoreProvider } from "@/components/public/restaurant-store-provider";
import { customerCookieName } from "@/lib/session";
import {
  getCustomerByRestaurantAndId,
  getRestaurantBySlug,
} from "@/services/public/restaurants";

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
  const initialCustomer = customerId
    ? await getCustomerByRestaurantAndId(restaurant.id, customerId)
    : null;

  return (
    <RestaurantStoreProvider slug={slug} restaurant={restaurant} initialCustomer={initialCustomer}>
      <main className="min-h-screen">{children}</main>
    </RestaurantStoreProvider>
  );
}
