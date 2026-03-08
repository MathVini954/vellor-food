import type { ProductCustomizationConfig } from "@/lib/product-customization";

export type AdminMetric = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "neutral";
};

export type AdminOrderStatus =
  | "Novo"
  | "Aceito"
  | "Em preparo"
  | "Enviado"
  | "Entregue"
  | "Cancelado";

export type AdminOrder = {
  id: string;
  customer: string;
  phone: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: string;
  status: AdminOrderStatus;
  time: string;
  createdAt: string;
  address: string;
};

export type AdminMenuProductStatus = "Ativo" | "Inativo";

export type AdminMenuProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  status: AdminMenuProductStatus;
  imageUrl: string;
  customizationOptions: string[];
  customizationConfig: ProductCustomizationConfig;
};

export type AdminCategoryOption = {
  id: string;
  name: string;
};

export type AdminOfferType =
  | "Desconto em todos os itens"
  | "Desconto em categoria"
  | "Prato do dia"
  | "Promocao especifica";

export type AdminOfferStatus = "Ativa" | "Inativa";

export type AdminOffer = {
  id: string;
  name: string;
  type: AdminOfferType;
  discount: string;
  appliesTo: string;
  startDate: string;
  endDate: string;
  status: AdminOfferStatus;
  productIds: string[];
  categoryIds: string[];
};

export type AdminCustomerStatus = "Ativo" | "Bloqueado";

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  locality: string;
  address: string;
  totalOrders: number;
  lastOrder: string;
  status: AdminCustomerStatus;
  orderHistory: Array<{
    id: string;
    date: string;
    total: string;
    status: AdminOrderStatus;
  }>;
};

export type AdminRestaurantSettings = {
  restaurant: {
    name: string;
    logo: string;
    whatsapp: string;
    address: string;
    city: string;
    state: string;
  };
  operation: {
    workingHours: string;
    minimumOrder: string;
    deliveryFee: string;
    freeDeliveryRadiusKm: string;
    deliveryActive: boolean;
    pickupActive: boolean;
  };
  payment: {
    cash: boolean;
    pix: boolean;
    cardOnDelivery: boolean;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    banner: string;
    welcomeMessage: string;
  };
};

export type AdminSessionPayload = {
  restaurantSlug: string;
  restaurantName: string;
  userName: string;
  userEmail: string;
  platformName: string;
  accessToken: string;
};

export type AdminInitialSetupPayload = {
  setupToken: string;
  restaurantSlug: string;
  companyName: string;
  adminName: string;
  adminEmail: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
};

export type AdminLoginPayload =
  | {
      kind: "session";
      session: AdminSessionPayload;
    }
  | {
      kind: "initial-setup";
      setup: AdminInitialSetupPayload;
    };

export type AdminBootstrapPayload = {
  session: AdminSessionPayload;
  metrics: AdminMetric[];
  categories: AdminCategoryOption[];
  orders: AdminOrder[];
  products: AdminMenuProduct[];
  offers: AdminOffer[];
  customers: AdminCustomer[];
  settings: AdminRestaurantSettings;
};
