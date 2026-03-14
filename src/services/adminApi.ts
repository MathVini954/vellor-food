import type {
  AdminLoginResult,
  AdminSession,
  CategoryOption,
  Customer,
  DiningTable,
  FeatureAccess,
  MenuProduct,
  Metric,
  Offer,
  Order,
  OrderStatus,
  RestaurantSettings,
  TableSession,
} from "../types/dashboard";
export type { AdminSession } from "../types/dashboard";

function resolveAdminApiBaseUrl() {
  const explicitBaseUrl = (import.meta.env.VITE_ADMIN_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (typeof window === "undefined") {
    return "http://localhost:3000/api/admin";
  }

  const { origin, hostname, port } = window.location;

  if (hostname === "vellor-admin.vercel.app") {
    return "https://vellor-food.vercel.app/api/admin";
  }

  if (hostname === "localhost" && port !== "3000") {
    return "http://localhost:3000/api/admin";
  }

  return `${origin}/api/admin`;
}

const ADMIN_API_BASE_URL = resolveAdminApiBaseUrl();

const AUTH_INVALID_EVENT = "admin-auth-invalid";

export type AdminBootstrap = {
  session: AdminSession;
  metrics: Metric[];
  categories: CategoryOption[];
  orders: Order[];
  tableOrders: Order[];
  diningTables: DiningTable[];
  tableSessions: TableSession[];
  featureAccess: FeatureAccess;
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

const EMPTY_SETTINGS: RestaurantSettings = {
  restaurant: {
    name: "",
    logo: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
  },
  operation: {
    workingHours: "",
    minimumOrder: "R$ 0,00",
    deliveryFee: "R$ 0,00",
    freeDeliveryRadiusKm: "0,0",
    deliveryActive: false,
    pickupActive: false,
  },
  payment: {
    cash: false,
    pix: false,
    cardOnDelivery: false,
  },
  appearance: {
    primaryColor: "#0f172a",
    secondaryColor: "#f97316",
    banner: "",
    welcomeMessage: "",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function resolveFeatureAccessUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const explicitPublicAppBaseUrl = (import.meta.env.VITE_PUBLIC_APP_BASE_URL as string | undefined)?.replace(/\/$/, "");
  const derivedPublicAppBaseUrl = ADMIN_API_BASE_URL.replace(/\/api\/admin$/, "");
  const publicAppBaseUrl = explicitPublicAppBaseUrl || derivedPublicAppBaseUrl;

  if (normalized.startsWith("/")) {
    return `${publicAppBaseUrl}${normalized}`;
  }

  return normalized;
}

function normalizeBootstrap(payload: unknown): AdminBootstrap {
  if (!isRecord(payload)) {
    throw new Error("Resposta invalida da API administrativa.");
  }

  const session = isRecord(payload.session) ? payload.session : null;

  if (!session || typeof session.restaurantSlug !== "string" || !session.restaurantSlug) {
    throw new Error("Resposta invalida da API administrativa.");
  }

  const featureAccess = isRecord(payload.featureAccess) ? payload.featureAccess : {};

  return {
    session: {
      restaurantSlug: session.restaurantSlug,
      restaurantName:
        typeof session.restaurantName === "string" ? session.restaurantName : "Restaurante",
      userName: typeof session.userName === "string" ? session.userName : "Gerente",
      userEmail: typeof session.userEmail === "string" ? session.userEmail : "",
      platformName:
        typeof session.platformName === "string" ? session.platformName : "MesaPilot Gestao",
    },
    metrics: asArray<Metric>(payload.metrics),
    categories: asArray<CategoryOption>(payload.categories),
    orders: asArray<Order>(payload.orders),
    tableOrders: asArray<Order>(payload.tableOrders),
    diningTables: asArray<DiningTable>(payload.diningTables),
    tableSessions: asArray<TableSession>(payload.tableSessions),
    featureAccess: {
      adminEnabled: featureAccess.adminEnabled !== false,
      publicOrderingEnabled: featureAccess.publicOrderingEnabled !== false,
      digitalMenuEnabled: featureAccess.digitalMenuEnabled === true,
      digitalMenuUrl: resolveFeatureAccessUrl(featureAccess.digitalMenuUrl),
    },
    products: asArray<MenuProduct>(payload.products),
    offers: asArray<Offer>(payload.offers),
    customers: asArray<Customer>(payload.customers),
    settings: isRecord(payload.settings) ? (payload.settings as RestaurantSettings) : EMPTY_SETTINGS,
  };
}

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
  const payload = await request<unknown>(`/restaurants/${slug}/bootstrap`);
  return normalizeBootstrap(payload);
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

export async function saveDiningTables(
  slug: string,
  tables: Array<{
    id?: string;
    identifier: string;
    label: string;
    area: string;
    seats: number | null;
    isActive: boolean;
  }>,
) {
  return request<{ tables: DiningTable[] }>(`/restaurants/${slug}/tables`, {
    method: "PUT",
    body: JSON.stringify({ tables }),
  });
}

export async function closeDiningTableSession(slug: string, sessionId: string) {
  return request(`/restaurants/${slug}/table-sessions/${sessionId}/close`, {
    method: "POST",
  });
}

export async function transferDiningTableSession(
  slug: string,
  sessionId: string,
  targetTableId: string,
) {
  return request(`/restaurants/${slug}/table-sessions/${sessionId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ targetTableId }),
  });
}

export async function mergeDiningTableSession(
  slug: string,
  sessionId: string,
  targetSessionId: string,
) {
  return request(`/restaurants/${slug}/table-sessions/${sessionId}/merge`, {
    method: "POST",
    body: JSON.stringify({ targetSessionId }),
  });
}

export async function importNeighborhoodsByCity(slug: string, city: string, state: string) {
  return request<{ neighborhoods: string[] }>(
    `/restaurants/${slug}/settings/neighborhoods?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
  );
}
