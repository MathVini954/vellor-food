"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartStorageKey,
  customerStorageKey,
  favoritesStorageKey,
  guestStorageKey,
} from "@/lib/session";
import type {
  CartItem,
  MenuProductCard,
  PublicCustomerSession,
  PublicRestaurant,
} from "@/types/public";
import {
  findCustomizationOption,
  type ProductCustomizationConfig,
} from "@/lib/product-customization";
import { ProductCustomizationSheet } from "./product-customization-sheet";

type RestaurantStoreContextValue = {
  slug: string;
  restaurant: PublicRestaurant;
  cart: CartItem[];
  favorites: string[];
  customer: PublicCustomerSession | null;
  guestAllowed: boolean;
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  customizerProduct: MenuProductCard | null;
  selectedOptionIds: string[];
  addItem: (product: MenuProductCard) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  incrementCartItem: (cartItemId: string) => void;
  decrementCartItem: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: PublicCustomerSession | null) => void;
  setGuestAllowed: (value: boolean) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  closeCustomizer: () => void;
  toggleCustomizationOption: (groupId: string, optionId: string) => void;
  confirmCustomization: () => void;
};

const RestaurantStoreContext = createContext<RestaurantStoreContextValue | null>(null);

type RestaurantStoreProviderProps = {
  slug: string;
  restaurant: PublicRestaurant;
  initialCustomer: PublicCustomerSession | null;
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

export function RestaurantStoreProvider({
  slug,
  restaurant,
  initialCustomer,
  children,
}: RestaurantStoreProviderProps) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customer, setCustomer] = useState<PublicCustomerSession | null>(initialCustomer);
  const [guestAllowed, setGuestAllowed] = useState(Boolean(initialCustomer));
  const [customizerProduct, setCustomizerProduct] = useState<MenuProductCard | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(cartStorageKey(slug));
    const savedCustomer = window.localStorage.getItem(customerStorageKey(slug));
    const savedGuest = window.localStorage.getItem(guestStorageKey(slug));
    const savedFavorites = window.localStorage.getItem(favoritesStorageKey(slug));

    if (savedCart) {
      setCart(normalizeSavedCart(JSON.parse(savedCart)));
    }

    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    } else if (initialCustomer) {
      setCustomer(initialCustomer);
    }

    if (savedGuest) {
      setGuestAllowed(savedGuest === "true");
    } else if (initialCustomer) {
      setGuestAllowed(true);
    }

    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    setHydrated(true);
  }, [initialCustomer, slug]);

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

    if (customer) {
      window.localStorage.setItem(customerStorageKey(slug), JSON.stringify(customer));
      window.localStorage.removeItem(guestStorageKey(slug));
      setGuestAllowed(true);
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

  function buildExtraPrice(config: ProductCustomizationConfig, optionIds: string[]) {
    return optionIds.reduce((total, optionId) => {
      const found = findCustomizationOption(config, optionId);
      return total + (found?.option.price ?? 0);
    }, 0);
  }

  function commitItem(product: MenuProductCard, optionIds: string[]) {
    const normalizedOptionIds = [...optionIds].sort();
    const customizations = buildSelectedSummary(product, normalizedOptionIds);
    const extraPrice = buildExtraPrice(product.customizationConfig, normalizedOptionIds);
    const cartItemId = buildCartItemId(product.id, normalizedOptionIds);

    setCart((current) => {
      const existingItem = current.find((item) => item.id === cartItemId);

      if (existingItem) {
        return current.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item,
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
          quantity: 1,
          customizations,
          selectedOptionIds: normalizedOptionIds,
        },
      ];
    });
  }

  function addItem(product: MenuProductCard) {
    if (
      product.customizationConfig.removableIngredients.length ||
      product.customizationConfig.additionalGroups.length
    ) {
      setCustomizerProduct(product);
      setSelectedOptionIds([]);
      return;
    }

    commitItem(product, []);
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
    setSelectedOptionIds([]);
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

    commitItem(customizerProduct, selectedOptionIds);
    closeCustomizer();
  }

  const value = useMemo<RestaurantStoreContextValue>(() => {
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce(
      (total, item) => total + (item.price + item.extraPrice) * item.quantity,
      0,
    );

    return {
      slug,
      restaurant,
      cart,
      favorites,
      customer,
      guestAllowed,
      hydrated,
      itemCount,
      subtotal,
      customizerProduct,
      selectedOptionIds,
      addItem,
      incrementItem,
      decrementItem,
      incrementCartItem,
      decrementCartItem,
      removeItem,
      clearCart,
      setCustomer,
      setGuestAllowed,
      isFavorite,
      toggleFavorite,
      closeCustomizer,
      toggleCustomizationOption,
      confirmCustomization,
    };
  }, [
    slug,
    restaurant,
    cart,
    favorites,
    customer,
    guestAllowed,
    hydrated,
    customizerProduct,
    selectedOptionIds,
  ]);

  return (
    <RestaurantStoreContext.Provider value={value}>
      {children}
      <ProductCustomizationSheet
        product={customizerProduct}
        selectedOptionIds={selectedOptionIds}
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
