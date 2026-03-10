import type { ProductCustomizationConfig } from "@/lib/product-customization";

export type PublicExperienceMode = "ONLINE" | "DINE_IN";

export type PublicDiningTable = {
  id: string;
  identifier: string;
  label: string;
  area: string | null;
  seats: number | null;
};

export type PublicRestaurant = {
  id: string;
  slug: string;
  name: string;
  whatsapp: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  bannerUrl: string | null;
  welcomeMessage: string | null;
  workingHours: string | null;
  deliveryFee: number;
  freeDeliveryRadiusKm: number;
  minimumOrderValue: number;
  isOpen: boolean;
  deliveryActive: boolean;
  pickupActive: boolean;
  acceptCash: boolean;
  acceptPix: boolean;
  acceptCardOnDelivery: boolean;
  publicOrderingEnabled: boolean;
  digitalMenuEnabled: boolean;
  pixKey: string | null;
  diningTables: PublicDiningTable[];
};

export type PublicCustomerSession = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  neighborhood: string | null;
};

export type MenuProductCard = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  customizationOptions: string[];
  customizationConfig: ProductCustomizationConfig;
};

export type MenuCategorySection = {
  id: string;
  name: string;
  sortOrder: number;
  products: MenuProductCard[];
};

export type MenuCategoryPreview = {
  id: string;
  name: string;
  sortOrder: number;
  productCount: number;
  imageUrl: string | null;
};

export type RestaurantDiscoveryData = {
  categories: MenuCategoryPreview[];
  popularProducts: MenuProductCard[];
  recommendedProducts: MenuProductCard[];
  offers: PublicOffer[];
};

export type PublicCategoryPageData = MenuCategoryPreview & {
  products: MenuProductCard[];
};

export type PublicProductDetail = MenuProductCard & {
  restaurantName: string;
  deliveryFee: number;
  freeDeliveryRadiusKm: number;
  minimumOrderValue: number;
  isRestaurantOpen: boolean;
  relatedCategories: MenuCategoryPreview[];
  relatedProducts: MenuProductCard[];
};

export type PublicOffer = {
  id: string;
  name: string;
  type: string;
  discountLabel: string;
  appliesTo: string;
  endDate: string;
  imageUrls: string[];
};

export type CartItem = {
  id: string;
  productId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  extraPrice: number;
  quantity: number;
  customizations: string[];
  selectedOptionIds: string[];
};

export type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";

export type PaymentMethod = "CASH" | "PIX" | "CARD_ON_DELIVERY" | "PAY_ON_PICKUP";

export type CheckoutFormState = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNeighborhood: string;
  tableId: string;
  tableIdentifier: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type DeliveryQuote = {
  distanceKm: number;
  deliveryFee: number;
  qualifiesForFreeDelivery: boolean;
};

export type ConfirmationOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerNeighborhood: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  notes: string | null;
  tableLabel: string | null;
  restaurant: {
    name: string;
    whatsapp: string;
  };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    customizations?: string | null;
  }>;
};

export type PublicOrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "PREPARING"
  | "SENT"
  | "DELIVERED"
  | "CANCELED";

export type PublicOrderSummary = {
  id: string;
  status: PublicOrderStatus;
  statusLabel: string;
  createdAt: string;
  total: number;
  orderType: OrderType;
  paymentMethodLabel: string;
  itemCount: number;
  restaurantName: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
  }>;
};

export type PublicTableSessionOrder = PublicOrderSummary & {
  customerName: string;
  notes: string | null;
};

export type PublicTableSessionSummary = {
  id: string;
  tableId: string;
  tableLabel: string;
  tableIdentifier: string;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED" | "MERGED" | "CANCELED";
  total: number;
  itemCount: number;
  customerCount: number;
  notes: string | null;
  customerNames: string[];
  orders: PublicTableSessionOrder[];
};
