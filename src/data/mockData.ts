import type {
  Customer,
  MenuProduct,
  Metric,
  Offer,
  Order,
  RestaurantSettings,
} from "../types/dashboard";

export const restaurantProfile = {
  platformName: "MesaPilot",
  restaurantName: "Bistro da Esquina",
  userName: "Marina Costa",
  userEmail: "admin@bistro.com",
  password: "123456",
};

export const dashboardMetrics: Metric[] = [
  { label: "Pedidos de hoje", value: "128", change: "+12% vs ontem", trend: "up" },
  { label: "Pedidos novos", value: "17", change: "5 aguardando aceite", trend: "neutral" },
  { label: "Em preparo", value: "9", change: "3 com prioridade alta", trend: "neutral" },
  { label: "Faturamento do dia", value: "R$ 4.860", change: "+18% vs ontem", trend: "up" },
];

const orderManagementSeed: Array<
  Omit<
    Order,
    | "channel"
    | "channelLabel"
    | "orderTypeLabel"
    | "paymentMethodLabel"
    | "notes"
    | "tableLabel"
    | "tableSessionId"
  >
> = [
  {
    id: "#1058",
    customer: "Ana Paula",
    phone: "(11) 99876-1102",
    items: [
      { name: "Pizza Margherita", quantity: 1 },
      { name: "Refrigerante 2L", quantity: 1 },
    ],
    total: "R$ 62,90",
    status: "Novo",
    time: "10:12",
    createdAt: "2026-03-07T10:12:00.000Z",
    address: "Rua das Flores, 120",
  },
  {
    id: "#1057",
    customer: "Carlos Lima",
    phone: "(11) 99711-4580",
    items: [
      { name: "Lasanha Bolonhesa", quantity: 2 },
      { name: "Suco Natural", quantity: 2 },
    ],
    total: "R$ 89,50",
    status: "Aceito",
    time: "10:05",
    createdAt: "2026-03-07T10:05:00.000Z",
    address: "Av. Central, 580",
  },
  {
    id: "#1056",
    customer: "Fernanda Souza",
    phone: "(11) 99654-2090",
    items: [
      { name: "Risoto de Funghi", quantity: 1 },
      { name: "Agua com gas", quantity: 1 },
    ],
    total: "R$ 44,00",
    status: "Em preparo",
    time: "09:58",
    createdAt: "2026-03-07T09:58:00.000Z",
    address: "Rua Harmonia, 44",
  },
  {
    id: "#1055",
    customer: "Joao Gomes",
    phone: "(11) 99550-3388",
    items: [
      { name: "Hamburguer artesanal", quantity: 2 },
      { name: "Batata rustica", quantity: 1 },
    ],
    total: "R$ 112,30",
    status: "Enviado",
    time: "09:43",
    createdAt: "2026-03-07T09:43:00.000Z",
    address: "Rua do Mercado, 221",
  },
  {
    id: "#1054",
    customer: "Patricia Alves",
    phone: "(11) 99442-1199",
    items: [
      { name: "Prato executivo", quantity: 1 },
      { name: "Suco detox", quantity: 1 },
    ],
    total: "R$ 71,20",
    status: "Entregue",
    time: "09:21",
    createdAt: "2026-03-07T09:21:00.000Z",
    address: "Alameda Verde, 89",
  },
  {
    id: "#1053",
    customer: "Rafael Nunes",
    phone: "(11) 99331-7788",
    items: [
      { name: "Yakissoba", quantity: 1 },
      { name: "Temaki salmon", quantity: 2 },
    ],
    total: "R$ 96,40",
    status: "Cancelado",
    time: "09:05",
    createdAt: "2026-03-07T09:05:00.000Z",
    address: "Travessa Aurora, 17",
  },
];

export const orderManagementData: Order[] = orderManagementSeed.map((order) => ({
  ...order,
  channel: "ONLINE" as const,
  channelLabel: "Online",
  orderTypeLabel: "Entrega",
  paymentMethodLabel: "Pix",
  notes: null,
  tableLabel: null,
  tableSessionId: null,
}));

export const menuProductsData: MenuProduct[] = [
  {
    id: "prod-01",
    name: "Pizza Burrata",
    description: "Molho artesanal, burrata cremosa, tomate confit e manjericao fresco.",
    price: "R$ 72,00",
    category: "Pizzas",
    status: "Ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    customizationOptions: ["Cebola roxa", "Tomate confit"],
    customizationConfig: {
      mode: "standard",
      removableIngredients: ["Cebola roxa", "Tomate confit"],
      additionalGroups: [
        {
          id: "group-molhos-pizza",
          name: "Molhos",
          selectionType: "multiple",
          required: false,
          options: [
            { id: "molho-pesto", name: "Molho pesto", price: "R$ 3,00" },
            { id: "molho-picante", name: "Molho picante", price: "R$ 2,50" },
          ],
        },
      ],
    },
  },
  {
    id: "prod-02",
    name: "Risoto de Camarao",
    description: "Arroz arboreo, caldo de legumes, camaroes grelhados e finalizacao com limao siciliano.",
    price: "R$ 64,90",
    category: "Pratos principais",
    status: "Ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    customizationOptions: ["Camarao", "Parmesao"],
    customizationConfig: {
      mode: "build_your_own",
      removableIngredients: [],
      additionalGroups: [
        {
          id: "base-risoto",
          name: "Base do prato",
          selectionType: "single",
          required: true,
          options: [
            { id: "arroz-arboreo", name: "Arroz arboreo", price: "R$ 0,00" },
            { id: "massa-fresca", name: "Massa fresca", price: "R$ 4,00" },
          ],
        },
        {
          id: "extras-risoto",
          name: "Adicionais",
          selectionType: "multiple",
          required: false,
          options: [
            { id: "camarao-extra", name: "Camarao extra", price: "R$ 12,00" },
            { id: "parmesao-extra", name: "Parmesao", price: "R$ 3,50" },
          ],
        },
      ],
    },
  },
  {
    id: "prod-03",
    name: "Burger da Casa",
    description: "Pao brioche, burger angus 180g, cheddar, cebola caramelizada e maionese especial.",
    price: "R$ 39,90",
    category: "Lanches",
    status: "Ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    customizationOptions: ["Cebola caramelizada", "Molho especial"],
    customizationConfig: {
      mode: "standard",
      removableIngredients: ["Cebola caramelizada"],
      additionalGroups: [
        {
          id: "molhos-burger",
          name: "Molhos",
          selectionType: "multiple",
          required: false,
          options: [
            { id: "molho-especial", name: "Molho especial", price: "R$ 0,00" },
            { id: "barbecue", name: "Barbecue", price: "R$ 2,00" },
          ],
        },
      ],
    },
  },
  {
    id: "prod-04",
    name: "Salada Mediterranea",
    description: "Mix de folhas, tomate sweet grape, pepino, feta e molho de ervas.",
    price: "R$ 28,50",
    category: "Saladas",
    status: "Inativo",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    customizationOptions: [],
    customizationConfig: {
      mode: "standard",
      removableIngredients: [],
      additionalGroups: [],
    },
  },
  {
    id: "prod-05",
    name: "Cheesecake de Frutas Vermelhas",
    description: "Base crocante, creme leve e calda de frutas vermelhas da casa.",
    price: "R$ 22,00",
    category: "Sobremesas",
    status: "Ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
    customizationOptions: [],
    customizationConfig: {
      mode: "standard",
      removableIngredients: [],
      additionalGroups: [],
    },
  },
];

export const offersData: Offer[] = [
  {
    id: "offer-01",
    name: "Semana da Casa",
    type: "Desconto em todos os itens",
    discount: "15%",
    appliesTo: "Todo o cardapio",
    startDate: "2026-03-07",
    endDate: "2026-03-14",
    status: "Ativa",
    productIds: [],
    categoryIds: ["cat-all"],
  },
  {
    id: "offer-02",
    name: "Massas com desconto",
    type: "Desconto em categoria",
    discount: "20%",
    appliesTo: "Categoria: Massas",
    startDate: "2026-03-08",
    endDate: "2026-03-20",
    status: "Ativa",
    productIds: [],
    categoryIds: ["cat-massas"],
  },
  {
    id: "offer-03",
    name: "Risoto do Chef",
    type: "Prato do dia",
    discount: "Preco especial",
    appliesTo: "Risoto de camarao",
    startDate: "2026-03-07",
    endDate: "2026-03-07",
    status: "Ativa",
    productIds: ["prod-02"],
    categoryIds: [],
  },
  {
    id: "offer-04",
    name: "Combo Burger + Fritas",
    type: "Promocao especifica",
    discount: "R$ 12 OFF",
    appliesTo: "Burger da Casa + Batata rustica",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    status: "Inativa",
    productIds: ["prod-03"],
    categoryIds: [],
  },
];

export const customersData: Customer[] = [
  {
    id: "cust-01",
    name: "Ana Paula",
    phone: "(11) 99876-1102",
    locality: "Vila Mariana",
    address: "Rua das Flores, 120 - Vila Mariana, Sao Paulo",
    totalOrders: 18,
    lastOrder: "2026-03-07 10:12",
    status: "Ativo",
    orderHistory: [
      { id: "#1058", date: "2026-03-07 10:12", total: "R$ 62,90", status: "Novo" },
      { id: "#1042", date: "2026-03-03 19:40", total: "R$ 79,50", status: "Entregue" },
      { id: "#1034", date: "2026-02-25 12:18", total: "R$ 51,00", status: "Entregue" },
    ],
  },
  {
    id: "cust-02",
    name: "Carlos Lima",
    phone: "(11) 99711-4580",
    locality: "Moema",
    address: "Av. Central, 580 - Moema, Sao Paulo",
    totalOrders: 9,
    lastOrder: "2026-03-07 10:05",
    status: "Ativo",
    orderHistory: [
      { id: "#1057", date: "2026-03-07 10:05", total: "R$ 89,50", status: "Aceito" },
      { id: "#1031", date: "2026-02-20 20:10", total: "R$ 42,90", status: "Entregue" },
    ],
  },
  {
    id: "cust-03",
    name: "Fernanda Souza",
    phone: "(11) 99654-2090",
    locality: "Pinheiros",
    address: "Rua Harmonia, 44 - Pinheiros, Sao Paulo",
    totalOrders: 14,
    lastOrder: "2026-03-07 09:58",
    status: "Ativo",
    orderHistory: [
      { id: "#1056", date: "2026-03-07 09:58", total: "R$ 44,00", status: "Em preparo" },
      { id: "#1029", date: "2026-02-18 13:22", total: "R$ 38,70", status: "Entregue" },
      { id: "#1019", date: "2026-02-05 21:04", total: "R$ 67,30", status: "Entregue" },
    ],
  },
  {
    id: "cust-04",
    name: "Joao Gomes",
    phone: "(11) 99550-3388",
    locality: "Consolacao",
    address: "Rua do Mercado, 221 - Consolacao, Sao Paulo",
    totalOrders: 5,
    lastOrder: "2026-03-07 09:43",
    status: "Bloqueado",
    orderHistory: [
      { id: "#1055", date: "2026-03-07 09:43", total: "R$ 112,30", status: "Enviado" },
      { id: "#1008", date: "2026-01-29 18:11", total: "R$ 59,90", status: "Cancelado" },
    ],
  },
  {
    id: "cust-05",
    name: "Patricia Alves",
    phone: "(11) 99442-1199",
    locality: "Santana",
    address: "Alameda Verde, 89 - Santana, Sao Paulo",
    totalOrders: 22,
    lastOrder: "2026-03-07 09:21",
    status: "Ativo",
    orderHistory: [
      { id: "#1054", date: "2026-03-07 09:21", total: "R$ 71,20", status: "Entregue" },
      { id: "#1040", date: "2026-03-02 14:30", total: "R$ 45,50", status: "Entregue" },
      { id: "#1032", date: "2026-02-22 12:50", total: "R$ 80,00", status: "Entregue" },
    ],
  },
];

export const restaurantSettingsData: RestaurantSettings = {
  restaurant: {
    name: "Bistro da Esquina",
    logo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80",
    whatsapp: "(11) 98888-7766",
    address: "Rua das Acacias, 240 - Vila Mariana, Sao Paulo",
    city: "Sao Paulo",
    state: "SP",
  },
  operation: {
    workingHours: "Seg a Dom, 11:00 as 23:00",
    minimumOrder: "R$ 25,00",
    deliveryFee: "R$ 7,50",
    freeDeliveryRadiusKm: "4,0",
    deliveryActive: true,
    pickupActive: true,
  },
  payment: {
    cash: true,
    pix: true,
    cardOnDelivery: true,
  },
  appearance: {
    primaryColor: "#0f172a",
    secondaryColor: "#f97316",
    banner:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    welcomeMessage: "Bem-vindo ao Bistro da Esquina. Sabores artesanais entregues com agilidade.",
  },
};
