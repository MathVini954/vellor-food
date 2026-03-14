"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  cartStorageKey,
  customerStorageKey,
  favoritesStorageKey,
  guestStorageKey,
  tableSessionStorageKey,
} from "@/lib/session";
import type {
  CartItem,
  MenuProductCard,
  PublicCustomerSession,
  PublicExperienceMode,
  PublicRestaurant,
  PublicTableSessionSummary,
} from "@/types/public";
import {
  findCustomizationOption,
  getSelectedCustomizationExtraPrice,
  hasProductCustomizationConfig,
  type ProductCustomizationConfig,
} from "@/lib/product-customization";
import { ProductCustomizationSheet } from "./product-customization-sheet";

type RestaurantStoreContextValue = {
  slug: string;
  restaurant: PublicRestaurant;
  experienceMode: PublicExperienceMode;
  cart: CartItem[];
  favorites: string[];
  customer: PublicCustomerSession | null;
  tableSession: PublicTableSessionSummary | null;
  guestAllowed: boolean;
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  customizerProduct: MenuProductCard | null;
  customizerQuantity: number;
  selectedOptionIds: string[];
  addItem: (product: MenuProductCard) => void;
  openCustomizer: (product: MenuProductCard) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  incrementCartItem: (cartItemId: string) => void;
  decrementCartItem: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: PublicCustomerSession | null) => void;
  setTableSession: (tableSession: PublicTableSessionSummary | null) => void;
  setGuestAllowed: (value: boolean) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  closeCustomizer: () => void;
  incrementCustomizerQuantity: () => void;
  decrementCustomizerQuantity: () => void;
  toggleCustomizationOption: (groupId: string, optionId: string) => void;
  confirmCustomization: () => void;
};

const RestaurantStoreContext = createContext<RestaurantStoreContextValue | null>(null);

type RestaurantStoreProviderProps = {
  slug: string;
  restaurant: PublicRestaurant;
  initialCustomer: PublicCustomerSession | null;
  initialTableSession: PublicTableSessionSummary | null;
  experienceMode: PublicExperienceMode;
  children: ReactNode;
};

function buildCartItemId(productId: string, selectedOptionIds: string[]) {
  const customizationKey = [...selectedOptionIds].sort().join("|");
  return `${productId}::${customizationKey || "padrao"}`;
}

function normalizeSavedCart(rawCart: unknown): CartItem[] {
  if (!Array.isArray(rawCart)) {
    return [];
  }

  return rawCart
    .filter((item): item is Partial<CartItem> & { productId: string; quantity: number } => {
      return Boolean(item && typeof item === "object" && "productId" in item && "quantity" in item);
    })
    .map((item) => {
      const customizations = Array.isArray(item.customizations)
        ? item.customizations.filter((value): value is string => typeof value === "string")
        : [];

      return {
        id:
          typeof item.id === "string" && item.id.length > 0
            ? item.id
            : buildCartItemId(item.productId, customizations),
        productId: item.productId,
        categoryId: String(item.categoryId ?? ""),
        categoryName: String(item.categoryName ?? ""),
        name: String(item.name ?? ""),
        description: item.description ? String(item.description) : null,
        imageUrl: item.imageUrl ? String(item.imageUrl) : null,
        price: Number(item.price ?? 0),
        extraPrice: Number(item.extraPrice ?? 0),
        quantity: Number(item.quantity ?? 0),
        customizations,
        selectedOptionIds: Array.isArray(item.selectedOptionIds)
          ? item.selectedOptionIds.filter((value): value is string => typeof value === "string")
          : [],
      };
    })
    .filter((item) => item.quantity > 0);
}

function readStoredJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function RestaurantStoreProvider({
  slug,
  restaurant,
  initialCustomer,
  initialTableSession,
  experienceMode,
  children,
}: RestaurantStoreProviderProps) {
  const hydrated = true;
  const [cart, setCart] = useState<CartItem[]>(() =>
    normalizeSavedCart(readStoredJson<unknown>(cartStorageKey(slug))),
  );
  const [favorites, setFavorites] = useState<string[]>(() => {
    const storedFavorites = readStoredJson<unknown>(favoritesStorageKey(slug));

    return Array.isArray(storedFavorites)
      ? storedFavorites.filter((value): value is string => typeof value === "string")
      : [];
  });
  const [customer, setCustomerState] = useState<PublicCustomerSession | null>(
    () => readStoredJson<PublicCustomerSession>(customerStorageKey(slug)) ?? initialCustomer,
  );
  const [tableSession, setTableSession] = useState<PublicTableSessionSummary | null>(
    () => readStoredJson<PublicTableSessionSummary>(tableSessionStorageKey(slug)) ?? initialTableSession,
  );
  const [guestAllowed, setGuestAllowed] = useState(() => {
    const storedCustomer = readStoredJson<PublicCustomerSession>(customerStorageKey(slug));
    const storedGuestAllowed = readStoredJson<boolean>(guestStorageKey(slug));

    return (
      Boolean(storedCustomer ?? initialCustomer) ||
      storedGuestAllowed === true ||
      experienceMode === "DINE_IN"
    );
  });
  const [customizerProduct, setCustomizerProduct] = useState<MenuProductCard | null>(null);
  const [customizerQuantity, setCustomizerQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(cartStorageKey(slug), JSON.stringify(cart));
  }, [cart, hydrated, slug]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(favoritesStorageKey(slug), JSON.stringify(favorites));
  }, [favorites, hydrated, slug]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (tableSession) {
      window.localStorage.setItem(tableSessionStorageKey(slug), JSON.stringify(tableSession));
      return;
    }

    window.localStorage.removeItem(tableSessionStorageKey(slug));
  }, [hydrated, slug, tableSession]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (customer) {
      window.localStorage.setItem(customerStorageKey(slug), JSON.stringify(customer));
      window.localStorage.removeItem(guestStorageKey(slug));
      return;
    }

    window.localStorage.removeItem(customerStorageKey(slug));
  }, [customer, hydrated, slug]);

  useEffect(() => {
    if (!hydrated || customer) {
      return;
    }

    window.localStorage.setItem(guestStorageKey(slug), String(guestAllowed));
  }, [customer, guestAllowed, hydrated, slug]);

  useEffect(() => {
    if (typeof document === "undefined" || !customizerProduct) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [customizerProduct]);

  function setCustomer(customerValue: PublicCustomerSession | null) {
    setCustomerState(customerValue);

    if (customerValue) {
      setGuestAllowed(true);
    }
  }

  function buildSelectedSummary(product: MenuProductCard, optionIds: string[]) {
    const removableLabels = product.customizationConfig.removableIngredients
      .filter((ingredient) => optionIds.includes(`remove:${ingredient}`))
      .map((ingredient) => `Sem ${ingredient}`);
    const additionalLabels = optionIds
      .map((optionId) => findCustomizationOption(product.customizationConfig, optionId))
      .filter(Boolean)
      .map((entry) =>
        entry!.option.price > 0
          ? `${entry!.group.name}: ${entry!.option.name} (+R$ ${entry!.option.price.toFixed(2).replace(".", ",")})`
          : `${entry!.group.name}: ${entry!.option.name}`,
      );

    return [...removableLabels, ...additionalLabels];
  }

  function commitItem(product: MenuProductCard, optionIds: string[], quantity = 1) {
    const normalizedOptionIds = [...optionIds].sort();
    const customizations = buildSelectedSummary(product, normalizedOptionIds);
    const extraPrice = getSelectedCustomizationExtraPrice(
      product.customizationConfig,
      normalizedOptionIds,
    );
    const cartItemId = buildCartItemId(product.id, normalizedOptionIds);

    setCart((current) => {
      const existingItem = current.find((item) => item.id === cartItemId);

      if (existingItem) {
        return current.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [
        ...current,
        {
          id: cartItemId,
          productId: product.id,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          price: product.price,
          extraPrice,
          quantity,
          customizations,
          selectedOptionIds: normalizedOptionIds,
        },
      ];
    });
  }

  function openCustomizer(product: MenuProductCard) {
    setCustomizerProduct(product);
    setCustomizerQuantity(1);
    setSelectedOptionIds([]);
  }

  function addItem(product: MenuProductCard) {
    if (hasProductCustomizationConfig(product.customizationConfig)) {
      openCustomizer(product);
      return;
    }

    commitItem(product, [], 1);
  }

  function incrementItem(productId: string) {
    setCart((current) => {
      const targetIndex = current.findIndex((item) => item.productId === productId);

      if (targetIndex === -1) {
        return current;
      }

      return current.map((item, index) =>
        index === targetIndex ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  }

  function decrementItem(productId: string) {
    setCart((current) => {
      const targetIndex = current.findIndex((item) => item.productId === productId);

      if (targetIndex === -1) {
        return current;
      }

      return current
        .map((item, index) =>
          index === targetIndex ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0);
    });
  }

  function incrementCartItem(cartItemId: string) {
    setCart((current) =>
      current.map((item) =>
        item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  function decrementCartItem(cartItemId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(cartItemId: string) {
    setCart((current) => current.filter((item) => item.id !== cartItemId));
  }

  function clearCart() {
    setCart([]);
  }

  function isFavorite(productId: string) {
    return favorites.includes(productId);
  }

  function toggleFavorite(productId: string) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId],
    );
  }

  function closeCustomizer() {
    setCustomizerProduct(null);
    setCustomizerQuantity(1);
    setSelectedOptionIds([]);
  }

  function incrementCustomizerQuantity() {
    setCustomizerQuantity((current) => current + 1);
  }

  function decrementCustomizerQuantity() {
    setCustomizerQuantity((current) => Math.max(1, current - 1));
  }

  function toggleCustomizationOption(groupId: string, optionId: string) {
    if (!customizerProduct) {
      return;
    }

    if (groupId.startsWith("remove:")) {
      setSelectedOptionIds((current) =>
        current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId],
      );
      return;
    }

    const group = customizerProduct.customizationConfig.additionalGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    setSelectedOptionIds((current) => {
      if (group.selectionType === "single") {
        const next = current.filter((item) => !group.options.some((option) => option.id === item));
        return current.includes(optionId) ? next : [...next, optionId];
      }

      return current.includes(optionId)
        ? current.filter((item) => item !== optionId)
        : [...current, optionId];
    });
  }

  function confirmCustomization() {
    if (!customizerProduct) {
      return;
    }

    commitItem(customizerProduct, selectedOptionIds, customizerQuantity);
    closeCustomizer();
  }

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + (item.price + item.extraPrice) * item.quantity,
    0,
  );

  const value: RestaurantStoreContextValue = {
    slug,
    restaurant,
    experienceMode,
    cart,
    favorites,
    customer,
    tableSession,
    guestAllowed,
    hydrated,
    itemCount,
    subtotal,
    customizerProduct,
    customizerQuantity,
    selectedOptionIds,
    addItem,
    openCustomizer,
    incrementItem,
    decrementItem,
    incrementCartItem,
    decrementCartItem,
    removeItem,
    clearCart,
    setCustomer,
    setTableSession,
    setGuestAllowed,
    isFavorite,
    toggleFavorite,
    closeCustomizer,
    incrementCustomizerQuantity,
    decrementCustomizerQuantity,
    toggleCustomizationOption,
    confirmCustomization,
  };

  return (
    <RestaurantStoreContext.Provider value={value}>
      {children}
      <ProductCustomizationSheet
        product={customizerProduct}
        quantity={customizerQuantity}
        selectedOptionIds={selectedOptionIds}
        onIncrementQuantity={incrementCustomizerQuantity}
        onDecrementQuantity={decrementCustomizerQuantity}
        onToggleOption={toggleCustomizationOption}
        onClose={closeCustomizer}
        onConfirm={confirmCustomization}
      />
    </RestaurantStoreContext.Provider>
  );
}

export function useRestaurantStore() {
  const context = useContext(RestaurantStoreContext);

  if (!context) {
    throw new Error("useRestaurantStore must be used within RestaurantStoreProvider");
  }

  return context;
}
