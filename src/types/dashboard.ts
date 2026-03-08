import type { ProductCustomizationConfig } from "../lib/productCustomization";

export type Metric = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "neutral";
};

export type AdminSection =
  | "Dashboard"
  | "Pedidos"
  | "Cardapio"
  | "Ofertas"
  | "Clientes"
  | "Configuracoes";

export type OrderStatus =
  | "Novo"
  | "Aceito"
  | "Em preparo"
  | "Enviado"
  | "Entregue"
  | "Cancelado";

export type OrderItem = {
  name: string;
  quantity: number;
};

export type Order = {
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  total: string;
  status: OrderStatus;
  time: string;
  createdAt: string;
  address: string;
};

export type ProductStatus = "Ativo" | "Inativo";

export type MenuProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  status: ProductStatus;
  imageUrl: string;
  customizationOptions: string[];
  customizationConfig: ProductCustomizationConfig;
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type OfferType =
  | "Desconto em todos os itens"
  | "Desconto em categoria"
  | "Prato do dia"
  | "Promocao especifica";

export type OfferStatus = "Ativa" | "Inativa";

export type Offer = {
  id: string;
  name: string;
  type: OfferType;
  discount: string;
  appliesTo: string;
  startDate: string;
  endDate: string;
  status: OfferStatus;
  productIds: string[];
  categoryIds: string[];
};

export type CustomerOrderHistory = {
  id: string;
  date: string;
  total: string;
  status: OrderStatus | "Entregue";
};

export type CustomerStatus = "Ativo" | "Bloqueado";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  locality: string;
  address: string;
  totalOrders: number;
  lastOrder: string;
  status: CustomerStatus;
  orderHistory: CustomerOrderHistory[];
};

export type RestaurantSettings = {
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

export type AdminSession = {
  restaurantSlug: string;
  restaurantName: string;
  userName: string;
  userEmail: string;
  platformName: string;
  accessToken: string;
};

export type AdminInitialSetup = {
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

export type AdminLoginResult =
  | {
      kind: "session";
      session: AdminSession;
    }
  | {
      kind: "initial-setup";
      setup: AdminInitialSetup;
    };
