const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const {
  PrismaClient,
  Prisma,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  OfferType,
  RestaurantContractStatus,
} = require("@prisma/client");

const scrypt = promisify(crypto.scrypt);

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function parseCurrency(value) {
  return Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
}

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

loadEnv();

const prisma = new PrismaClient();

const restaurantData = {
  name: "Bistro da Esquina",
  slug: "bistro-da-esquina",
  whatsapp: "5511988887766",
  adminEmail: "admin@bistro.com",
  adminPassword: "123456",
  adminUserName: "Marina Costa",
  address: "Rua das Acacias, 240 - Vila Mariana, Sao Paulo",
  city: "Sao Paulo",
  state: "SP",
  latitude: -23.5896568,
  longitude: -46.6347093,
  logoUrl:
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80",
  primaryColor: "#0f172a",
  secondaryColor: "#f97316",
  bannerUrl:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80",
  welcomeMessage: "Sabores autorais, operacao agil e uma experiencia pensada para cada pedido.",
  workingHours: "Segunda a Domingo, 11:00 as 23:30",
  deliveryFee: 7.5,
  freeDeliveryRadiusKm: 4,
  minimumOrderValue: 25,
  isOpen: true,
  deliveryActive: true,
  pickupActive: true,
  acceptCash: true,
  acceptPix: true,
  acceptCardOnDelivery: true,
  contractStartsAt: "2026-03-01",
  contractEndsAt: "2026-12-31",
  monthlyPrice: 199.9,
  contractNotes: "Restaurante seedado para ambiente de demonstracao.",
};

const categoriesData = [
  { name: "Pizzas", sortOrder: 1, isActive: true },
  { name: "Pratos principais", sortOrder: 2, isActive: true },
  { name: "Lanches", sortOrder: 3, isActive: true },
  { name: "Saladas", sortOrder: 4, isActive: true },
  { name: "Sobremesas", sortOrder: 5, isActive: true },
  { name: "Bebidas", sortOrder: 6, isActive: true },
];

const productsData = [
  {
    name: "Pizza Burrata",
    description: "Molho artesanal, burrata cremosa, tomate confit e manjericao fresco.",
    price: "R$ 72,00",
    category: "Pizzas",
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Cebola roxa", "Tomate confit", "Molho pesto"],
  },
  {
    name: "Risoto de Camarao",
    description:
      "Arroz arboreo, caldo de legumes, camaroes grelhados e finalizacao com limao siciliano.",
    price: "R$ 64,90",
    category: "Pratos principais",
    imageUrl:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Camaroes", "Raspas de limao", "Finalizacao com parmesao"],
  },
  {
    name: "Burger da Casa",
    description:
      "Pao brioche, burger angus 180g, cheddar, cebola caramelizada e maionese especial.",
    price: "R$ 39,90",
    category: "Lanches",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Cebola caramelizada", "Picles", "Molho especial"],
  },
  {
    name: "Salada Mediterranea",
    description: "Mix de folhas, tomate sweet grape, pepino, feta e molho de ervas.",
    price: "R$ 28,50",
    category: "Saladas",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    isActive: false,
  },
  {
    name: "Cheesecake de Frutas Vermelhas",
    description: "Base crocante, creme leve e calda de frutas vermelhas da casa.",
    price: "R$ 22,00",
    category: "Sobremesas",
    imageUrl:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela especial e manjericao fresco.",
    price: "R$ 54,90",
    category: "Pizzas",
    imageUrl:
      "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Manjericao", "Tomate", "Queijo extra"],
  },
  {
    name: "Refrigerante 2L",
    description: "Bebida gelada para acompanhar o pedido.",
    price: "R$ 12,00",
    category: "Bebidas",
    imageUrl:
      "https://images.unsplash.com/photo-1543253687-c931c8e01820?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    name: "Lasanha Bolonhesa",
    description: "Camadas generosas de massa, molho bolonhesa e queijo gratinado.",
    price: "R$ 44,90",
    category: "Pratos principais",
    imageUrl:
      "https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Queijo gratinado", "Molho extra"],
  },
  {
    name: "Suco Natural",
    description: "Suco preparado na hora com frutas selecionadas.",
    price: "R$ 9,50",
    category: "Bebidas",
    imageUrl:
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    name: "Agua com gas",
    description: "Garrafa individual gelada.",
    price: "R$ 6,00",
    category: "Bebidas",
    imageUrl:
      "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    name: "Batata rustica",
    description: "Batatas assadas com ervas finas e maionese da casa.",
    price: "R$ 18,00",
    category: "Lanches",
    imageUrl:
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Sal de parrilha", "Maionese da casa"],
  },
  {
    name: "Prato executivo",
    description: "Opcao do dia com proteina, acompanhamento e salada.",
    price: "R$ 32,90",
    category: "Pratos principais",
    imageUrl:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Salada", "Arroz", "Feijao"],
  },
  {
    name: "Suco detox",
    description: "Mistura refrescante de frutas e folhas.",
    price: "R$ 11,90",
    category: "Bebidas",
    imageUrl:
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    name: "Yakissoba",
    description: "Macarrao oriental salteado com legumes e molho especial.",
    price: "R$ 41,90",
    category: "Pratos principais",
    imageUrl:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Legumes", "Molho tarê"],
  },
  {
    name: "Temaki salmon",
    description: "Cone de alga recheado com arroz e salmon fresco.",
    price: "R$ 24,90",
    category: "Pratos principais",
    imageUrl:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: ["Cebolinha", "Cream cheese"],
  },
];

const offersData = [
  {
    name: "Burger Night",
    type: OfferType.SPECIFIC_PROMOTION,
    discountLabel: "20% OFF",
    appliesTo: "Burger da Casa",
    productNames: ["Burger da Casa"],
    categoryNames: [],
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    isActive: true,
  },
  {
    name: "Prato do Dia",
    type: OfferType.DISH_OF_THE_DAY,
    discountLabel: "Menu especial",
    appliesTo: "Prato executivo",
    productNames: ["Prato executivo"],
    categoryNames: [],
    startDate: "2026-03-07",
    endDate: "2026-03-31",
    isActive: true,
  },
  {
    name: "Sobremesa premiada",
    type: OfferType.CATEGORY,
    discountLabel: "15% OFF",
    appliesTo: "Categoria: Sobremesas",
    productNames: [],
    categoryNames: ["Sobremesas"],
    startDate: "2026-03-01",
    endDate: "2026-03-21",
    isActive: true,
  },
];

const customersData = [
  {
    name: "Ana Paula",
    phone: "(11) 99876-1102",
    neighborhood: "Vila Mariana",
    address: "Rua das Flores, 120 - Vila Mariana, Sao Paulo",
  },
  {
    name: "Carlos Lima",
    phone: "(11) 99711-4580",
    neighborhood: "Moema",
    address: "Av. Central, 580 - Moema, Sao Paulo",
  },
  {
    name: "Fernanda Souza",
    phone: "(11) 99654-2090",
    neighborhood: "Pinheiros",
    address: "Rua Harmonia, 44 - Pinheiros, Sao Paulo",
  },
  {
    name: "Joao Gomes",
    phone: "(11) 99550-3388",
    neighborhood: "Consolacao",
    address: "Rua do Mercado, 221 - Consolacao, Sao Paulo",
  },
  {
    name: "Patricia Alves",
    phone: "(11) 99442-1199",
    neighborhood: "Santana",
    address: "Alameda Verde, 89 - Santana, Sao Paulo",
  },
];

const orderManagementData = [
  {
    customer: "Ana Paula",
    phone: "(11) 99876-1102",
    items: [
      { name: "Pizza Margherita", quantity: 1 },
      { name: "Refrigerante 2L", quantity: 1 },
    ],
    total: "R$ 62,90",
    status: "NEW",
  },
  {
    customer: "Carlos Lima",
    phone: "(11) 99711-4580",
    items: [
      { name: "Lasanha Bolonhesa", quantity: 2 },
      { name: "Suco Natural", quantity: 2 },
    ],
    total: "R$ 89,50",
    status: "ACCEPTED",
  },
  {
    customer: "Fernanda Souza",
    phone: "(11) 99654-2090",
    items: [
      { name: "Risoto de Camarao", quantity: 1 },
      { name: "Agua com gas", quantity: 1 },
    ],
    total: "R$ 44,00",
    status: "PREPARING",
  },
  {
    customer: "Joao Gomes",
    phone: "(11) 99550-3388",
    items: [
      { name: "Burger da Casa", quantity: 2 },
      { name: "Batata rustica", quantity: 1 },
    ],
    total: "R$ 112,30",
    status: "SENT",
  },
  {
    customer: "Patricia Alves",
    phone: "(11) 99442-1199",
    items: [
      { name: "Prato executivo", quantity: 1 },
      { name: "Suco detox", quantity: 1 },
    ],
    total: "R$ 71,20",
    status: "DELIVERED",
  },
];

async function main() {
  const passwordHash = await hashPassword(restaurantData.adminPassword);

  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantData.slug },
    select: { id: true },
  });

  if (existingRestaurant) {
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          restaurantId: existingRestaurant.id,
        },
      },
    });
    await prisma.order.deleteMany({
      where: { restaurantId: existingRestaurant.id },
    });
    await prisma.offer.deleteMany({
      where: { restaurantId: existingRestaurant.id },
    });
    await prisma.product.deleteMany({
      where: { restaurantId: existingRestaurant.id },
    });
    await prisma.category.deleteMany({
      where: { restaurantId: existingRestaurant.id },
    });
    await prisma.deliveryArea.deleteMany({
      where: { restaurantId: existingRestaurant.id },
    });
    await prisma.customer.deleteMany({
      where: { restaurantId: existingRestaurant.id },
    });
    await prisma.restaurant.delete({
      where: { id: existingRestaurant.id },
    });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantData.name,
      slug: restaurantData.slug,
      whatsapp: restaurantData.whatsapp,
      adminEmail: restaurantData.adminEmail,
      adminPassword: passwordHash,
      adminPasswordTemporary: false,
      adminUserName: restaurantData.adminUserName,
      onboardingCompleted: true,
      address: restaurantData.address,
      city: restaurantData.city,
      state: restaurantData.state,
      latitude: new Prisma.Decimal(restaurantData.latitude),
      longitude: new Prisma.Decimal(restaurantData.longitude),
      logoUrl: restaurantData.logoUrl,
      primaryColor: restaurantData.primaryColor,
      secondaryColor: restaurantData.secondaryColor,
      bannerUrl: restaurantData.bannerUrl,
      welcomeMessage: restaurantData.welcomeMessage,
      workingHours: restaurantData.workingHours,
      deliveryFee: new Prisma.Decimal(restaurantData.deliveryFee),
      freeDeliveryRadiusKm: new Prisma.Decimal(restaurantData.freeDeliveryRadiusKm),
      minimumOrderValue: new Prisma.Decimal(restaurantData.minimumOrderValue),
      isOpen: restaurantData.isOpen,
      deliveryActive: restaurantData.deliveryActive,
      pickupActive: restaurantData.pickupActive,
      acceptCash: restaurantData.acceptCash,
      acceptPix: restaurantData.acceptPix,
      acceptCardOnDelivery: restaurantData.acceptCardOnDelivery,
      contract: {
        create: {
          status: RestaurantContractStatus.ACTIVE,
          startsAt: new Date(`${restaurantData.contractStartsAt}T12:00:00.000Z`),
          endsAt: new Date(`${restaurantData.contractEndsAt}T23:59:59.999Z`),
          monthlyPrice: new Prisma.Decimal(restaurantData.monthlyPrice),
          notes: restaurantData.contractNotes,
        },
      },
    },
  });

  const categoryMap = new Map();
  for (const category of categoriesData) {
    const created = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
    });
    categoryMap.set(category.name, created);
  }

  const productMap = new Map();
  for (const product of productsData) {
    const category = categoryMap.get(product.category);
    const created = await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(parseCurrency(product.price)),
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        customizationOptions: product.customizationOptions ?? [],
      },
    });
    productMap.set(product.name, created);
  }

  const customerMap = new Map();
  for (const customer of customersData) {
    const created = await prisma.customer.create({
      data: {
        restaurantId: restaurant.id,
        name: customer.name,
        phone: normalizePhone(customer.phone),
        neighborhood: customer.neighborhood,
        address: customer.address,
        isBlocked: false,
      },
    });
    customerMap.set(customer.name, created);
    customerMap.set(normalizePhone(customer.phone), created);
  }

  for (const order of orderManagementData) {
    let customer = customerMap.get(normalizePhone(order.phone));
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          restaurantId: restaurant.id,
          name: order.customer,
          phone: normalizePhone(order.phone),
        },
      });
      customerMap.set(normalizePhone(order.phone), customer);
    }

    const subtotal = parseCurrency(order.total);
    const createdOrder = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerNeighborhood: customer.neighborhood,
        subtotal: new Prisma.Decimal(subtotal),
        deliveryFee: new Prisma.Decimal(0),
        total: new Prisma.Decimal(subtotal),
        status: OrderStatus[order.status],
        orderType: "DELIVERY",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus:
          order.status === "DELIVERED" ? PaymentStatus.PAID : PaymentStatus.PENDING,
        notes: null,
      },
    });

    const perItemValue = subtotal / order.items.length;
    for (const item of order.items) {
      const linkedProduct =
        productMap.get(item.name) ||
        [...productMap.values()][0];

      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: linkedProduct.id,
          productName: item.name,
          unitPrice: new Prisma.Decimal(perItemValue / item.quantity),
          quantity: item.quantity,
          totalPrice: new Prisma.Decimal(perItemValue),
        },
      });
    }
  }

  for (const offer of offersData) {
    await prisma.offer.create({
      data: {
        restaurantId: restaurant.id,
        name: offer.name,
        type: offer.type,
        discountLabel: offer.discountLabel,
        appliesTo: offer.appliesTo,
        productIds: offer.productNames.map((name) => productMap.get(name).id),
        categoryIds: offer.categoryNames.map((name) => categoryMap.get(name).id),
        startDate: new Date(`${offer.startDate}T12:00:00.000Z`),
        endDate: new Date(`${offer.endDate}T23:59:59.999Z`),
        isActive: offer.isActive,
      },
    });
  }

  console.log("Seed concluido com sucesso.");
  console.log(`Slug pronto: ${restaurant.slug}`);
  console.log(`Login admin: ${restaurantData.adminEmail} / ${restaurantData.adminPassword}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
