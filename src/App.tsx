import { useEffect, useState } from "react";
import type {
  AdminInitialSetup,
  AdminSection,
  Offer,
  OrderStatus,
  RestaurantSettings,
} from "./types/dashboard";
import {
  completeAdminInitialSetup,
  createAdminRestaurant,
  createAdminOffer,
  createAdminProduct,
  deleteAdminOrder,
  deleteAdminProduct,
  getAdminBootstrap,
  loginAdmin,
  saveAdminSettings,
  setAdminAccessToken,
  updateAdminCustomerBlock,
  updateAdminOffer,
  updateAdminOrderStatus,
  updateAdminProduct,
  getAdminAuthInvalidEventName,
  type AdminBootstrap,
  type AdminSession,
} from "./services/adminApi";
import { CreateRestaurantPage } from "./layouts/CreateRestaurantPage";
import { LoginPage } from "./layouts/LoginPage";
import { CustomersManagementPage } from "./layouts/CustomersManagementPage";
import { HomeDashboardPage } from "./layouts/HomeDashboardPage";
import { InitialSetupPage } from "./layouts/InitialSetupPage";
import { MenuManagementPage } from "./layouts/MenuManagementPage";
import { OffersManagementPage } from "./layouts/OffersManagementPage";
import { OrdersManagementPage } from "./layouts/OrdersManagementPage";
import { SettingsPage } from "./layouts/SettingsPage";

const AUTH_STORAGE_KEY = "restaurant-auth-session";
const FALLBACK_PLATFORM_NAME = "MesaPilot Gestao";
const PUBLIC_SIGNUP_ENABLED = import.meta.env.VITE_ALLOW_PUBLIC_RESTAURANT_SIGNUP === "true";
const INITIAL_SETUP_PATH = "/primeiro-acesso";

const adminRoutes = {
  Dashboard: "/admin/dashboard",
  Pedidos: "/admin/pedidos",
  Cardapio: "/admin/cardapio",
  Ofertas: "/admin/ofertas",
  Clientes: "/admin/clientes",
  Configuracoes: "/admin/configuracoes",
} as const satisfies Record<AdminSection, string>;

function getSectionFromPath(pathname: string): AdminSection | null {
  const matchedRoute = (Object.entries(adminRoutes) as [AdminSection, string][]).find(
    ([, route]) => route === pathname,
  );

  return matchedRoute?.[0] ?? null;
}

function readStoredSession(): AdminSession | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

function persistSession(session: AdminSession | null) {
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#081321_0%,_#07111d_100%)] px-4">
      <section className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/95 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </section>
    </main>
  );
}

function ErrorState({
  title,
  description,
  onRetry,
  onLogout,
}: {
  title: string;
  description: string;
  onRetry: () => void;
  onLogout: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#081321_0%,_#07111d_100%)] px-4">
      <section className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/95 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            type="button"
            onClick={onRetry}
          >
            Tentar novamente
          </button>
          <button
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={onLogout}
          >
            Sair
          </button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => readStoredSession());
  const [pendingInitialSetup, setPendingInitialSetup] = useState<AdminInitialSetup | null>(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredSession()));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    setAdminAccessToken(session?.accessToken ?? null);
  }, [session]);

  useEffect(() => {
    function handleAuthInvalid() {
      handleLogout();
    }

    const eventName = getAdminAuthInvalidEventName();
    window.addEventListener(eventName, handleAuthInvalid);
    return () => window.removeEventListener(eventName, handleAuthInvalid);
  }, [session]);

  useEffect(() => {
    if (!session && pendingInitialSetup && pathname !== INITIAL_SETUP_PATH) {
      window.history.replaceState({}, "", INITIAL_SETUP_PATH);
      setPathname(INITIAL_SETUP_PATH);
      return;
    }

    if (!session && !pendingInitialSetup && (pathname.startsWith("/admin") || pathname === INITIAL_SETUP_PATH)) {
      window.history.replaceState({}, "", "/");
      setPathname("/");
      return;
    }

    if (session && !getSectionFromPath(pathname)) {
      window.history.replaceState({}, "", adminRoutes.Dashboard);
      setPathname(adminRoutes.Dashboard);
    }
  }, [session, pendingInitialSetup, pathname]);

  function navigateToSection(section: AdminSection) {
    const targetPath = adminRoutes[section];

    if (pathname === targetPath) {
      return;
    }

    window.history.pushState({}, "", targetPath);
    setPathname(targetPath);
  }

  async function loadBootstrap(options?: { silent?: boolean }) {
    if (!session) {
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const payload = await getAdminBootstrap(session.restaurantSlug);
      setBootstrap(payload);
      setSession(payload.session);
      persistSession(payload.session);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Falha ao carregar o painel.");
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!session) {
      setBootstrap(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function syncNow() {
      if (cancelled) {
        return;
      }

      await loadBootstrap();
    }

    syncNow();

    const intervalId = window.setInterval(() => {
      void loadBootstrap({ silent: true });
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [session?.restaurantSlug]);

  async function handleLogin(credentials: { email: string; password: string }) {
    try {
      const result = await loginAdmin(credentials);

      if (result.kind === "initial-setup") {
        persistSession(null);
        setSession(null);
        setPendingInitialSetup(result.setup);
        setBootstrap(null);
        setLoadError("");
        window.history.pushState({}, "", INITIAL_SETUP_PATH);
        setPathname(INITIAL_SETUP_PATH);
        return true;
      }

      setPendingInitialSetup(null);
      setSession(result.session);
      persistSession(result.session);
      setBootstrap(null);
      setLoadError("");
      window.history.pushState({}, "", adminRoutes.Dashboard);
      setPathname(adminRoutes.Dashboard);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCreateRestaurant(payload: Parameters<typeof createAdminRestaurant>[0]) {
    try {
      const nextSession = await createAdminRestaurant(payload);
      setPendingInitialSetup(null);
      setSession(nextSession);
      persistSession(nextSession);
      setBootstrap(null);
      setLoadError("");
      window.history.pushState({}, "", adminRoutes.Dashboard);
      setPathname(adminRoutes.Dashboard);
      return true;
    } catch {
      return false;
    }
  }

  function handleLogout() {
    persistSession(null);
    setSession(null);
    setPendingInitialSetup(null);
    setBootstrap(null);
    setLoadError("");
    window.history.pushState({}, "", "/");
    setPathname("/");
  }

  async function handleCompleteInitialSetup(
    payload: Parameters<typeof completeAdminInitialSetup>[1],
  ) {
    if (!pendingInitialSetup) {
      return "A sessao de setup inicial expirou. Faca login novamente.";
    }

    try {
      const nextSession = await completeAdminInitialSetup(pendingInitialSetup.setupToken, payload);
      setPendingInitialSetup(null);
      setSession(nextSession);
      persistSession(nextSession);
      setBootstrap(null);
      setLoadError("");
      window.history.pushState({}, "", adminRoutes.Dashboard);
      setPathname(adminRoutes.Dashboard);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Nao foi possivel concluir o cadastro inicial.";
    }
  }

  async function handleAdvanceOrderStatus(orderId: string, status: OrderStatus) {
    if (!session) {
      return;
    }

    await updateAdminOrderStatus(session.restaurantSlug, orderId, status);
    await loadBootstrap({ silent: true });
  }

  async function handleCancelOrder(orderId: string) {
    if (!session) {
      return;
    }

    await updateAdminOrderStatus(session.restaurantSlug, orderId, "Cancelado");
    await loadBootstrap({ silent: true });
  }

  async function handleDeleteOrder(orderId: string) {
    if (!session) {
      return;
    }

    await deleteAdminOrder(session.restaurantSlug, orderId);
    await loadBootstrap({ silent: true });
  }

  async function handleSaveProduct(product: Omit<AdminBootstrap["products"][number], "id">, existingId?: string) {
    if (!session) {
      return;
    }

    if (existingId) {
      await updateAdminProduct(session.restaurantSlug, existingId, product);
    } else {
      await createAdminProduct(session.restaurantSlug, product);
    }

    await loadBootstrap({ silent: true });
  }

  async function handleToggleProductStatus(productId: string, status: AdminBootstrap["products"][number]["status"]) {
    if (!session) {
      return;
    }

    const product = bootstrap?.products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    await updateAdminProduct(session.restaurantSlug, productId, {
      ...product,
      status,
    });
    await loadBootstrap({ silent: true });
  }

  async function handleDeleteProduct(productId: string) {
    if (!session) {
      return;
    }

    await deleteAdminProduct(session.restaurantSlug, productId);
    await loadBootstrap({ silent: true });
  }

  async function handleSaveOffer(offer: Omit<Offer, "id">, existingId?: string) {
    if (!session) {
      return;
    }

    if (existingId) {
      await updateAdminOffer(session.restaurantSlug, existingId, offer);
    } else {
      await createAdminOffer(session.restaurantSlug, offer);
    }

    await loadBootstrap({ silent: true });
  }

  async function handleToggleOfferStatus(offerId: string, status: Offer["status"]) {
    if (!session) {
      return;
    }

    const offer = bootstrap?.offers.find((item) => item.id === offerId);

    if (!offer) {
      return;
    }

    await updateAdminOffer(session.restaurantSlug, offerId, {
      ...offer,
      status,
    });
    await loadBootstrap({ silent: true });
  }

  async function handleToggleCustomerBlock(customerId: string, status: AdminBootstrap["customers"][number]["status"]) {
    if (!session) {
      return;
    }

    await updateAdminCustomerBlock(session.restaurantSlug, customerId, status === "Bloqueado");
    await loadBootstrap({ silent: true });
  }

  async function handleSaveSettings(settings: RestaurantSettings) {
    if (!session) {
      return;
    }

    await saveAdminSettings(session.restaurantSlug, settings);
    await loadBootstrap({ silent: true });
  }

  if (!session && pendingInitialSetup) {
    return (
      <InitialSetupPage
        setup={pendingInitialSetup}
        onSubmit={handleCompleteInitialSetup}
        onBackToLogin={handleLogout}
      />
    );
  }

  if (!session) {
    if (PUBLIC_SIGNUP_ENABLED && pathname === "/criar-restaurante") {
      return (
        <CreateRestaurantPage
          platformName={FALLBACK_PLATFORM_NAME}
          onBackToLogin={() => {
            window.history.pushState({}, "", "/");
            setPathname("/");
          }}
          onCreateRestaurant={handleCreateRestaurant}
        />
      );
    }

    return (
        <LoginPage
          platformName={FALLBACK_PLATFORM_NAME}
          onLogin={handleLogin}
          onCreateRestaurant={
            PUBLIC_SIGNUP_ENABLED
              ? () => {
                  window.history.pushState({}, "", "/criar-restaurante");
                  setPathname("/criar-restaurante");
                }
              : undefined
          }
        />
      );
  }

  if (isLoading && !bootstrap) {
    return (
      <LoadingState
        title="Conectando o painel ao banco"
        description="Carregando pedidos, clientes, cardapio, ofertas e configuracoes do restaurante."
      />
    );
  }

  if (loadError && !bootstrap) {
    return (
      <ErrorState
        title="Nao foi possivel conectar o painel"
        description={loadError}
        onRetry={() => {
          void loadBootstrap();
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (!bootstrap) {
    return null;
  }

  const currentSection = getSectionFromPath(pathname) ?? "Dashboard";
  const { restaurantName, userName, platformName } = bootstrap.session;
  void platformName;

  switch (currentSection) {
    case "Pedidos":
      return (
        <OrdersManagementPage
          restaurantName={restaurantName}
          userName={userName}
          initialOrders={bootstrap.orders}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onAdvanceStatus={handleAdvanceOrderStatus}
          onCancelOrder={handleCancelOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      );
    case "Cardapio":
      return (
        <MenuManagementPage
          restaurantName={restaurantName}
          userName={userName}
          availableCategories={bootstrap.categories}
          initialProducts={bootstrap.products}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveProduct={handleSaveProduct}
          onToggleProductStatus={handleToggleProductStatus}
          onDeleteProduct={handleDeleteProduct}
        />
      );
    case "Ofertas":
      return (
        <OffersManagementPage
          restaurantName={restaurantName}
          userName={userName}
          availableProducts={bootstrap.products}
          availableCategories={bootstrap.categories}
          initialOffers={bootstrap.offers}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveOffer={handleSaveOffer}
          onToggleOfferStatus={handleToggleOfferStatus}
        />
      );
    case "Clientes":
      return (
        <CustomersManagementPage
          restaurantName={restaurantName}
          userName={userName}
          initialCustomers={bootstrap.customers}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onToggleCustomerBlock={handleToggleCustomerBlock}
        />
      );
    case "Configuracoes":
      return (
        <SettingsPage
          restaurantSlug={session.restaurantSlug}
          restaurantName={restaurantName}
          userName={userName}
          initialSettings={bootstrap.settings}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveSettings={handleSaveSettings}
        />
      );
    case "Dashboard":
    default:
      return (
        <HomeDashboardPage
          restaurantName={restaurantName}
          userName={userName}
          metrics={bootstrap.metrics}
          orders={bootstrap.orders}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
        />
      );
  }
}
