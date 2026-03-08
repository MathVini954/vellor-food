const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient, Prisma } = require("@prisma/client");

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

function asCurrency(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function toDecimal(value) {
  return new Prisma.Decimal(value);
}

function buildStandardConfig(categoryName) {
  switch (categoryName) {
    case "Pizzas":
      return {
        mode: "standard",
        removableIngredients: ["Cebola roxa", "Azeitona", "Tomate"],
        additionalGroups: [
          {
            id: "pizza-border",
            name: "Borda recheada",
            selectionType: "single",
            required: false,
            options: [
              { id: "pizza-border-none", name: "Sem borda recheada", price: 0 },
              { id: "pizza-border-catupiry", name: "Catupiry", price: 8 },
              { id: "pizza-border-cheddar", name: "Cheddar", price: 8 },
            ],
          },
          {
            id: "pizza-extra",
            name: "Adicionais",
            selectionType: "multiple",
            required: false,
            options: [
              { id: "pizza-extra-cheese", name: "Queijo extra", price: 6 },
              { id: "pizza-extra-bacon", name: "Bacon crocante", price: 7 },
              { id: "pizza-extra-basil", name: "Manjericao fresco", price: 3 },
            ],
          },
        ],
      };
    case "Pratos principais":
      return {
        mode: "standard",
        removableIngredients: ["Cebola", "Coentro", "Molho da casa"],
        additionalGroups: [
          {
            id: "main-protein",
            name: "Proteina extra",
            selectionType: "single",
            required: false,
            options: [
              { id: "main-protein-none", name: "Sem extra", price: 0 },
              { id: "main-protein-chicken", name: "Frango grelhado", price: 9 },
              { id: "main-protein-beef", name: "Carne grelhada", price: 12 },
              { id: "main-protein-shrimp", name: "Camarao", price: 16 },
            ],
          },
          {
            id: "main-side",
            name: "Acompanhamentos",
            selectionType: "multiple",
            required: false,
            options: [
              { id: "main-side-rice", name: "Arroz soltinho", price: 4 },
              { id: "main-side-potato", name: "Batata rustica", price: 6 },
              { id: "main-side-salad", name: "Salada fresca", price: 5 },
            ],
          },
        ],
      };
    case "Lanches":
      return {
        mode: "standard",
        removableIngredients: ["Cebola", "Picles", "Molho especial"],
        additionalGroups: [
          {
            id: "burger-cheese",
            name: "Queijos",
            selectionType: "single",
            required: false,
            options: [
              { id: "burger-cheese-none", name: "Sem queijo extra", price: 0 },
              { id: "burger-cheese-cheddar", name: "Cheddar extra", price: 5 },
              { id: "burger-cheese-prato", name: "Queijo prato", price: 4 },
            ],
          },
          {
            id: "burger-extra",
            name: "Adicionais",
            selectionType: "multiple",
            required: false,
            options: [
              { id: "burger-extra-bacon", name: "Bacon crocante", price: 6 },
              { id: "burger-extra-egg", name: "Ovo", price: 4 },
              { id: "burger-extra-onion", name: "Cebola crispy", price: 4 },
            ],
          },
        ],
      };
    case "Saladas":
      return {
        mode: "standard",
        removableIngredients: ["Cebola roxa", "Tomate", "Croutons"],
        additionalGroups: [
          {
            id: "salad-protein",
            name: "Proteinas",
            selectionType: "single",
            required: false,
            options: [
              { id: "salad-protein-none", name: "Sem proteina extra", price: 0 },
              { id: "salad-protein-chicken", name: "Frango grelhado", price: 8 },
              { id: "salad-protein-salmon", name: "Salmao", price: 12 },
            ],
          },
          {
            id: "salad-dressing",
            name: "Molhos",
            selectionType: "multiple",
            required: false,
            options: [
              { id: "salad-dressing-herbs", name: "Molho de ervas", price: 2 },
              { id: "salad-dressing-ceasar", name: "Molho caesar", price: 2.5 },
              { id: "salad-dressing-honey", name: "Mostarda e mel", price: 2.5 },
            ],
          },
        ],
      };
    case "Sobremesas":
      return {
        mode: "standard",
        removableIngredients: ["Calda", "Castanhas"],
        additionalGroups: [
          {
            id: "dessert-topping",
            name: "Coberturas",
            selectionType: "multiple",
            required: false,
            options: [
              { id: "dessert-topping-chocolate", name: "Chocolate", price: 3 },
              { id: "dessert-topping-caramel", name: "Caramelo", price: 3 },
              { id: "dessert-topping-berries", name: "Frutas vermelhas", price: 4 },
            ],
          },
        ],
      };
    default:
      return null;
  }
}

function buildYourOwnConfig() {
  return {
    mode: "build_your_own",
    removableIngredients: [],
    additionalGroups: [
      {
        id: "build-base",
        name: "Base",
        selectionType: "single",
        required: true,
        options: [
          { id: "build-base-rice", name: "Arroz soltinho", price: 0 },
          { id: "build-base-brown-rice", name: "Arroz integral", price: 0 },
          { id: "build-base-salad", name: "Mix de folhas", price: 0 },
          { id: "build-base-noodles", name: "Macarrao oriental", price: 2 },
        ],
      },
      {
        id: "build-protein",
        name: "Proteina",
        selectionType: "single",
        required: true,
        options: [
          { id: "build-protein-chicken", name: "Frango grelhado", price: 0 },
          { id: "build-protein-beef", name: "Carne acebolada", price: 4 },
          { id: "build-protein-salmon", name: "Salmao", price: 8 },
          { id: "build-protein-falafel", name: "Falafel", price: 3 },
        ],
      },
      {
        id: "build-complements",
        name: "Complementos",
        selectionType: "multiple",
        required: false,
        options: [
          { id: "build-complements-vegetables", name: "Legumes grelhados", price: 5 },
          { id: "build-complements-egg", name: "Ovo mollet", price: 4 },
          { id: "build-complements-cheese", name: "Queijo coalho", price: 5 },
          { id: "build-complements-potato", name: "Batata rustica", price: 7 },
        ],
      },
      {
        id: "build-sauces",
        name: "Molhos",
        selectionType: "multiple",
        required: false,
        options: [
          { id: "build-sauces-oriental", name: "Molho oriental", price: 2.5 },
          { id: "build-sauces-pesto", name: "Pesto", price: 3 },
          { id: "build-sauces-aioli", name: "Aioli da casa", price: 2.5 },
          { id: "build-sauces-spicy", name: "Molho picante", price: 2 },
        ],
      },
    ],
  };
}

const newProducts = [
  {
    category: "Pizzas",
    name: "Pizza Pepperoni Supreme",
    description: "Molho da casa, pepperoni fatiado, queijo especial e finalizacao com oregano.",
    price: 68.9,
    imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    category: "Pizzas",
    name: "Pizza Quatro Queijos Trufada",
    description: "Blend de queijos nobres, toque trufado e massa artesanal de longa fermentacao.",
    price: 74.9,
    imageUrl: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    category: "Pratos principais",
    name: "Parmegiana de Frango",
    description: "File empanado, molho de tomate encorpado, queijo gratinado e arroz soltinho.",
    price: 47.9,
    imageUrl: "https://images.unsplash.com/photo-1604908554027-16a2a8baa1b6?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    category: "Pratos principais",
    name: "Bowl Fit do Chef",
    description: "Arroz integral, legumes, proteina grelhada e molho leve para o dia a dia.",
    price: 36.9,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    category: "Pratos principais",
    name: "Monte seu prato",
    description: "Escolha base, proteina, complementos e molhos para montar seu pedido do seu jeito.",
    price: 29.9,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    isActive: true,
    customizationOptions: buildYourOwnConfig(),
  },
  {
    category: "Lanches",
    name: "Smash Bacon Duplo",
    description: "Dois discos smash, cheddar, bacon, cebola crispy e molho da casa.",
    price: 42.9,
    imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    category: "Sobremesas",
    name: "Brownie com Sorvete",
    description: "Brownie quente servido com sorvete de creme e calda intensa de chocolate.",
    price: 24.9,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
];

loadEnv();

const prisma = new PrismaClient();

async function deleteRestaurantGraph(restaurantId) {
  await prisma.orderItem.deleteMany({
    where: { order: { restaurantId } },
  });
  await prisma.order.deleteMany({
    where: { restaurantId },
  });
  await prisma.offer.deleteMany({
    where: { restaurantId },
  });
  await prisma.product.deleteMany({
    where: { restaurantId },
  });
  await prisma.category.deleteMany({
    where: { restaurantId },
  });
  await prisma.deliveryArea.deleteMany({
    where: { restaurantId },
  });
  await prisma.customer.deleteMany({
    where: { restaurantId },
  });
  await prisma.restaurantContract.deleteMany({
    where: { restaurantId },
  });
  await prisma.restaurant.delete({
    where: { id: restaurantId },
  });
}

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { adminEmail: "admin@bistro.com" },
    include: {
      categories: true,
      products: true,
    },
  });

  if (!restaurant) {
    throw new Error("Restaurante do admin@bistro.com nao encontrado.");
  }

  const categoryMap = new Map(restaurant.categories.map((category) => [category.name, category]));
  const categoryById = new Map(restaurant.categories.map((category) => [category.id, category]));
  const existingProductsByName = new Map(restaurant.products.map((product) => [product.name, product]));

  await prisma.orderItem.deleteMany({
    where: { order: { restaurantId: restaurant.id } },
  });
  await prisma.order.deleteMany({
    where: { restaurantId: restaurant.id },
  });
  await prisma.customer.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  const julianaRestaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { slug: "juliana-modas" },
        { adminEmail: "juliana@teste.com" },
        { name: { contains: "Juliana", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  if (julianaRestaurant) {
    await deleteRestaurantGraph(julianaRestaurant.id);
  }

  for (const product of restaurant.products) {
    const category = categoryById.get(product.categoryId);

    if (!category || category.name === "Bebidas") {
      continue;
    }

    const nextCustomization = buildStandardConfig(category.name);
    if (!nextCustomization) {
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        isActive: true,
        customizationOptions: nextCustomization,
      },
    });
  }

  const productsToEnsure = newProducts.map((product) => ({
    ...product,
    customizationOptions:
      product.customizationOptions ??
      buildStandardConfig(product.category) ??
      [],
  }));

  for (const product of productsToEnsure) {
    const category = categoryMap.get(product.category);
    if (!category) {
      throw new Error(`Categoria ${product.category} nao encontrada no Bistro da Esquina.`);
    }

    const existing = existingProductsByName.get(product.name);
    const data = {
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: product.name,
      description: product.description,
      price: toDecimal(product.price),
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      customizationOptions: product.customizationOptions,
    };

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data,
      });
    } else {
      const created = await prisma.product.create({ data });
      existingProductsByName.set(created.name, created);
    }
  }

  await prisma.product.updateMany({
    where: {
      restaurantId: restaurant.id,
      categoryId: categoryMap.get("Saladas")?.id,
    },
    data: {
      isActive: true,
    },
  });

  const summary = await prisma.restaurant.findUnique({
    where: { id: restaurant.id },
    select: {
      name: true,
      slug: true,
      products: {
        select: { name: true, category: { select: { name: true, sortOrder: true } } },
      },
      customers: { select: { id: true } },
      orders: { select: { id: true } },
    },
  });

  const orderedProducts = [...summary.products].sort((left, right) => {
    const sortOrderDelta = left.category.sortOrder - right.category.sortOrder;
    return sortOrderDelta === 0 ? left.name.localeCompare(right.name) : sortOrderDelta;
  });

  console.log("Reset do demo concluido.");
  console.log(`Restaurante base: ${summary.name} (${summary.slug})`);
  console.log(`Clientes apos limpeza: ${summary.customers.length}`);
  console.log(`Pedidos apos limpeza: ${summary.orders.length}`);
  console.log(`Produtos ativos no cardapio: ${orderedProducts.length}`);
  console.log("Produtos atuais:");
  orderedProducts.forEach((product) => {
    console.log(`- [${product.category.name}] ${product.name}`);
  });
  console.log(`Juliana removida: ${julianaRestaurant ? "sim" : "nao encontrada"}`);
  console.log(`Login mantido: admin@bistro.com / 123456`);
  console.log(`Novo produto destaque: Monte seu prato (${asCurrency(29.9)})`);
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
