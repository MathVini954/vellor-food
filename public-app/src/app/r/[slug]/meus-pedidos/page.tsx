import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MyOrdersPageClient } from "@/components/public/my-orders-page-client";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { getPublicExperienceMode } from "@/lib/public-experience";
import { customerCookieName, tableSessionCookieName } from "@/lib/session";
import {
  getCustomerByRestaurantAndId,
  getOrdersByRestaurantAndCustomerId,
  getRestaurantBySlugOrThrow,
  getTableSessionByRestaurantAndId,
} from "@/services/public/restaurants";

export default async function MyOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlugOrThrow(slug);
  const cookieStore = await cookies();
  const publicExperienceMode = await getPublicExperienceMode(slug);
  const customerId = cookieStore.get(customerCookieName(slug))?.value;
  const currentTableSessionId = cookieStore.get(tableSessionCookieName(slug))?.value;

  if (publicExperienceMode === "DINE_IN") {
    if (!currentTableSessionId) {
      redirect(`/r/${slug}`);
    }

    const tableSession = await getTableSessionByRestaurantAndId(restaurant.id, currentTableSessionId);

    if (!tableSession || !tableSession.orders.length) {
      redirect(`/r/${slug}`);
    }

    return (
      <PublicPageShell slug={slug} activeTab="profile" withBottomNav>
        <MyOrdersPageClient
          slug={slug}
          restaurant={restaurant}
          customer={null}
          orders={[]}
          tableSession={tableSession}
          experienceMode={publicExperienceMode}
        />
      </PublicPageShell>
    );
  }

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
      <MyOrdersPageClient
        slug={slug}
        restaurant={restaurant}
        customer={customer}
        orders={orders}
        tableSession={null}
        experienceMode={publicExperienceMode}
      />
    </PublicPageShell>
  );
}
