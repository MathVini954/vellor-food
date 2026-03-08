import type {
  AdminLoginResult,
  AdminSession,
  CategoryOption,
  Customer,
  MenuProduct,
  Metric,
  Offer,
  Order,
  OrderStatus,
  RestaurantSettings,
} from "../types/dashboard";
export type { AdminSession } from "../types/dashboard";

const ADMIN_API_BASE_URL =
  (import.meta.env.VITE_ADMIN_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:3000/api/admin";

const AUTH_INVALID_EVENT = "admin-auth-invalid";

export type AdminBootstrap = {
  session: AdminSession;
  metrics: Metric[];
  categories: CategoryOption[];
  orders: Order[];
  products: MenuProduct[];
  offers: Offer[];
  customers: Customer[];
  settings: RestaurantSettings;
};

export type CreateRestaurantPayload = {
  restaurantName: string;
  whatsapp: string;
  adminName: string;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
};

export type CompleteInitialSetupPayload = {
  companyName: string;
  adminName: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  password: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
    }

    throw new Error(payload.error || "Erro ao comunicar com a API administrativa.");
  }

  return payload as T;
}

export function getAdminAuthInvalidEventName() {
  return AUTH_INVALID_EVENT;
}

export async function loginAdmin(credentials: { email: string; password: string }) {
  return request<AdminLoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function createAdminRestaurant(payload: CreateRestaurantPayload) {
  const response = await request<AdminLoginResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.kind !== "session") {
    throw new Error("Fluxo invalido para cadastro publico.");
  }

  return response.session;
}

export async function completeAdminInitialSetup(
  setupToken: string,
  payload: CompleteInitialSetupPayload,
) {
  const response = await request<AdminLoginResult>("/auth/initial-setup", {
    method: "POST",
    body: JSON.stringify({
      setupToken,
      ...payload,
    }),
  });

  if (response.kind !== "session") {
    throw new Error("A API nao retornou uma sessao apos o setup inicial.");
  }

  return response.session;
}

export async function logoutAdmin() {
  return request<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export async function getAdminBootstrap(slug: string) {
  return request<AdminBootstrap>(`/restaurants/${slug}/bootstrap`);
}

export async function updateAdminOrderStatus(
  slug: string,
  orderId: string,
  status: OrderStatus,
) {
  return request(`/restaurants/${slug}/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminOrder(slug: string, orderId: string) {
  return request(`/restaurants/${slug}/orders/${orderId}`, {
    method: "DELETE",
  });
}

export async function createAdminProduct(
  slug: string,
  product: Omit<MenuProduct, "id">,
) {
  return request(`/restaurants/${slug}/products`, {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateAdminProduct(
  slug: string,
  productId: string,
  product: Omit<MenuProduct, "id">,
) {
  return request(`/restaurants/${slug}/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
}

export async function deleteAdminProduct(slug: string, productId: string) {
  return request(`/restaurants/${slug}/products/${productId}`, {
    method: "DELETE",
  });
}

export async function createAdminOffer(
  slug: string,
  offer: Omit<Offer, "id">,
) {
  return request(`/restaurants/${slug}/offers`, {
    method: "POST",
    body: JSON.stringify(offer),
  });
}

export async function updateAdminOffer(
  slug: string,
  offerId: string,
  offer: Omit<Offer, "id">,
) {
  return request(`/restaurants/${slug}/offers/${offerId}`, {
    method: "PATCH",
    body: JSON.stringify(offer),
  });
}

export async function updateAdminCustomerBlock(
  slug: string,
  customerId: string,
  blocked: boolean,
) {
  return request(`/restaurants/${slug}/customers/${customerId}/block`, {
    method: "PATCH",
    body: JSON.stringify({ blocked }),
  });
}

export async function saveAdminSettings(slug: string, settings: RestaurantSettings) {
  return request(`/restaurants/${slug}/settings`, {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}

export async function importNeighborhoodsByCity(slug: string, city: string, state: string) {
  return request<{ neighborhoods: string[] }>(
    `/restaurants/${slug}/settings/neighborhoods?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
  );
}
