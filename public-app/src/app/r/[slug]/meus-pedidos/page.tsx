import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MyOrdersPageClient } from "@/components/public/my-orders-page-client";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { customerCookieName } from "@/lib/session";
import {
  getCustomerByRestaurantAndId,
  getOrdersByRestaurantAndCustomerId,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function MyOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlugOrThrow(slug);
  const cookieStore = await cookies();
  const customerId = cookieStore.get(customerCookieName(slug))?.value;

  if (!customerId) {
    redirect(`/r/${slug}/identificacao`);
  }

  const customer = await getCustomerByRestaurantAndId(restaurant.id, customerId);

  if (!customer) {
    redirect(`/r/${slug}/identificacao`);
  }

  const orders = await getOrdersByRestaurantAndCustomerId(restaurant.id, customer.id);

  if (!orders.length) {
    redirect(`/r/${slug}`);
  }

  return (
    <PublicPageShell slug={slug} activeTab="profile" withBottomNav>
      <MyOrdersPageClient slug={slug} restaurant={restaurant} customer={customer} orders={orders} />
    </PublicPageShell>
  );
}
