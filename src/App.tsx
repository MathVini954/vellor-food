import { useEffect, useRef, useState } from "react";
import { AdminLayoutContext } from "./components/AdminLayoutContext";
import type {
  AdminInitialSetup,
  AdminNotification,
  AdminSection,
  Offer,
  OrderStatus,
  RestaurantSettings,
  AdminUnreadSignals,
} from "./types/dashboard";
import {
  closeDiningTableSession,
  completeAdminInitialSetup,
  createAdminRestaurant,
  createAdminOffer,
  createAdminProduct,
  deleteAdminOrder,
  deleteAdminProduct,
  getAdminBootstrap,
  loginAdmin,
  mergeDiningTableSession,
  logoutAdmin,
  saveDiningTables,
  saveAdminSettings,
  transferDiningTableSession,
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
import { TablesManagementPage } from "./layouts/TablesManagementPage";

const AUTH_STORAGE_KEY = "restaurant-auth-session";
const FALLBACK_PLATFORM_NAME = "MesaPilot Gestao";
const PUBLIC_SIGNUP_ENABLED = import.meta.env.VITE_ALLOW_PUBLIC_RESTAURANT_SIGNUP === "true";
const INITIAL_SETUP_PATH = "/primeiro-acesso";

const adminRouteSegments = {
  Dashboard: "dashboard",
  PedidosOnline: "pedidos-online",
  Mesas: "mesas",
  Cardapio: "cardapio",
  Ofertas: "ofertas",
  Clientes: "clientes",
  Configuracoes: "configuracoes",
} as const satisfies Record<AdminSection, string>;

const legacyAdminRoutes = Object.fromEntries(
  (Object.entries(adminRouteSegments) as [AdminSection, string][]).map(([section, segment]) => [
    section,
    `/admin/${segment}`,
  ]),
) as Record<AdminSection, string>;

function buildAdminRoute(section: AdminSection, restaurantSlug: string) {
  return `/admin/${encodeURIComponent(restaurantSlug)}/${adminRouteSegments[section]}`;
}

function getSectionFromPath(pathname: string): { section: AdminSection; restaurantSlug: string | null } | null {
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  const adminMatch = currentPath.match(/^\/admin\/([^/]+)\/([^/]+)$/);

  if (adminMatch) {
    const [, restaurantSlug, sectionSegment] = adminMatch;
    const matchedRoute = (Object.entries(adminRouteSegments) as [AdminSection, string][]).find(
      ([, segment]) => segment === sectionSegment,
    );

    if (matchedRoute) {
      return {
        section: matchedRoute[0],
        restaurantSlug: decodeURIComponent(restaurantSlug),
      };
    }
  }

  const matchedLegacyRoute = (Object.entries(legacyAdminRoutes) as [AdminSection, string][]).find(
    ([, route]) => route === currentPath,
  );

  if (!matchedLegacyRoute) {
    return null;
  }

  return {
    section: matchedLegacyRoute[0],
    restaurantSlug: null,
  };
}

function readStoredSession(): AdminSession | null {
  const legacyRaw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (legacyRaw) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);

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
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <section className="w-full max-w-lg rounded-[32px] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] p-8 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
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
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <section className="w-full max-w-lg rounded-[32px] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] p-8 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="action-primary" type="button" onClick={onRetry}>
            Tentar novamente
          </button>
          <button className="action-secondary" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </section>
    </main>
  );
}

function FloatingNotifications({
  notifications,
}: {
  notifications: AdminNotification[];
}) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-[360px] flex-col gap-3 sm:right-6 sm:top-6">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="iphone-toast overflow-hidden rounded-[30px] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-5 py-4 shadow-[var(--shadow-float)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[14px] text-white ${
                  notification.accent === "tables"
                    ? "bg-[linear-gradient(135deg,#2f6c60,#58a08f)]"
                    : "bg-[linear-gradient(135deg,#d38664,#b75d3e)]"
                }`}
              >
                {notification.accent === "tables" ? <ToastTableIcon /> : <ToastBagIcon />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                  {notification.accent === "tables" ? "MesaPilot Mesas" : "MesaPilot Pedidos"}
                </p>
                <p className="mt-1 text-xs font-medium text-[color:var(--text-muted)]">
                  Agora / {formatToastTime(notification.createdAt)}
                </p>
              </div>
            </div>
            <div className="h-1.5 w-12 rounded-full bg-black/6" />
          </div>

          <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{notification.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
            {normalizeNotificationText(notification.body)}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatToastTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeNotificationText(value: string) {
  return value.replace(/\s*\/\s*/g, " / ");
}

function ToastBagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 9h10l-.8 9.2a2 2 0 0 1-2 1.8H9.8a2 2 0 0 1-2-1.8L7 9Zm3-2a2 2 0 1 1 4 0" strokeLinecap="round" />
    </svg>
  );
}

function ToastTableIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm4 6v4m8-4v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => readStoredSession());
  const [pendingInitialSetup, setPendingInitialSetup] = useState<AdminInitialSetup | null>(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredSession()));
  const [loadError, setLoadError] = useState("");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<AdminNotification[]>([]);
  const [unreadSignals, setUnreadSignals] = useState<AdminUnreadSignals>({ online: 0, tables: 0 });
  const seenOrderIdsRef = useRef<{ online: Set<string>; tables: Set<string> }>({
    online: new Set(),
    tables: new Set(),
  });

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

    if (session) {
      const currentRoute = getSectionFromPath(pathname);

      if (!currentRoute) {
        const dashboardPath = buildAdminRoute("Dashboard", session.restaurantSlug);
        window.history.replaceState({}, "", dashboardPath);
        setPathname(dashboardPath);
        return;
      }

      const nextPath =
        currentRoute.restaurantSlug === session.restaurantSlug
          ? null
          : buildAdminRoute(currentRoute.section, session.restaurantSlug);

      if (nextPath && nextPath !== pathname) {
        window.history.replaceState({}, "", nextPath);
        setPathname(nextPath);
      }
    }
  }, [session, pendingInitialSetup, pathname]);

  function navigateToSection(section: AdminSection) {
    if (!session) {
      return;
    }

    if (section === "PedidosOnline") {
      setUnreadSignals((current) => ({ ...current, online: 0 }));
      setNotifications((current) =>
        current.map((notification) =>
          notification.accent === "online" ? { ...notification, isRead: true } : notification,
        ),
      );
    }

    if (section === "Mesas") {
      setUnreadSignals((current) => ({ ...current, tables: 0 }));
      setNotifications((current) =>
        current.map((notification) =>
          notification.accent === "tables" ? { ...notification, isRead: true } : notification,
        ),
      );
    }

    const targetPath = buildAdminRoute(section, session.restaurantSlug);

    if (pathname === targetPath) {
      return;
    }

    window.history.pushState({}, "", targetPath);
    setPathname(targetPath);
  }

  function handleOpenNotifications() {
    setUnreadSignals({ online: 0, tables: 0 });
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
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
      const isInitialSync = !bootstrap;
      const currentSection = getSectionFromPath(pathname)?.section ?? "Dashboard";
      const nextOnlineIds = new Set(payload.orders.map((order) => order.id));
      const nextTableIds = new Set(payload.tableOrders.map((order) => order.id));

      if (isInitialSync) {
        seenOrderIdsRef.current = {
          online: nextOnlineIds,
          tables: nextTableIds,
        };
      } else {
        const newOnlineOrders = payload.orders.filter(
          (order) => !seenOrderIdsRef.current.online.has(order.id),
        );
        const newTableOrders = payload.tableOrders.filter(
          (order) => !seenOrderIdsRef.current.tables.has(order.id),
        );

        if (newOnlineOrders.length || newTableOrders.length) {
          const createdAt = new Date().toISOString();
          const nextNotifications: AdminNotification[] = [
            ...newOnlineOrders.map((order) => ({
              id: `online-${order.id}`,
              title: `Novo pedido online ${order.id}`,
              body: `${order.customer} / ${order.total}`,
              accent: "online" as const,
              createdAt,
              isRead: currentSection === "PedidosOnline",
            })),
            ...newTableOrders.map((order) => ({
              id: `table-${order.id}`,
              title: `${order.tableLabel ?? "Mesa"} recebeu novo pedido`,
              body: `${order.customer} / ${order.total}`,
              accent: "tables" as const,
              createdAt,
              isRead: currentSection === "Mesas",
            })),
          ];

          setToastNotifications((current) => [...nextNotifications, ...current].slice(0, 3));
          setNotifications((current) => [...nextNotifications, ...current].slice(0, 10));
          window.setTimeout(() => {
            setToastNotifications((current) =>
              current.filter(
                (notification) =>
                  !nextNotifications.some((candidate) => candidate.id === notification.id),
              ),
            );
          }, 4200);

          setUnreadSignals((current) => ({
            online:
              currentSection === "PedidosOnline" ? current.online : current.online + newOnlineOrders.length,
            tables: currentSection === "Mesas" ? current.tables : current.tables + newTableOrders.length,
          }));
        }

        seenOrderIdsRef.current = {
          online: nextOnlineIds,
          tables: nextTableIds,
        };
      }

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

  useEffect(() => {
    if (!session || !bootstrap) {
      return;
    }

    const currentSection = getSectionFromPath(pathname)?.section ?? "Dashboard";

    if (currentSection === "Mesas" && !bootstrap.featureAccess.digitalMenuEnabled) {
      const dashboardPath = buildAdminRoute("Dashboard", session.restaurantSlug);
      window.history.replaceState({}, "", dashboardPath);
      setPathname(dashboardPath);
    }
  }, [bootstrap, pathname, session]);

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
      setNotifications([]);
      setToastNotifications([]);
      setUnreadSignals({ online: 0, tables: 0 });
      const dashboardPath = buildAdminRoute("Dashboard", result.session.restaurantSlug);
      window.history.pushState({}, "", dashboardPath);
      setPathname(dashboardPath);
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
      setNotifications([]);
      setToastNotifications([]);
      setUnreadSignals({ online: 0, tables: 0 });
      const dashboardPath = buildAdminRoute("Dashboard", nextSession.restaurantSlug);
      window.history.pushState({}, "", dashboardPath);
      setPathname(dashboardPath);
      return true;
    } catch {
      return false;
    }
  }

  function handleLogout() {
    void logoutAdmin().catch(() => undefined);
    persistSession(null);
    setSession(null);
    setPendingInitialSetup(null);
    setBootstrap(null);
    setLoadError("");
    setNotifications([]);
    setToastNotifications([]);
    setUnreadSignals({ online: 0, tables: 0 });
    seenOrderIdsRef.current = {
      online: new Set(),
      tables: new Set(),
    };
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
      setNotifications([]);
      setToastNotifications([]);
      setUnreadSignals({ online: 0, tables: 0 });
      const dashboardPath = buildAdminRoute("Dashboard", nextSession.restaurantSlug);
      window.history.pushState({}, "", dashboardPath);
      setPathname(dashboardPath);
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

  async function handleSaveDiningTables(
    tables: Array<{
      id?: string;
      identifier: string;
      label: string;
      area: string;
      seats: number | null;
      isActive: boolean;
    }>,
  ) {
    if (!session) {
      return;
    }

    await saveDiningTables(session.restaurantSlug, tables);
    await loadBootstrap({ silent: true });
  }

  async function handleCloseDiningTableSession(sessionId: string) {
    if (!session) {
      return;
    }

    await closeDiningTableSession(session.restaurantSlug, sessionId);
    await loadBootstrap({ silent: true });
  }

  async function handleTransferDiningTableSession(sessionId: string, targetTableId: string) {
    if (!session) {
      return;
    }

    await transferDiningTableSession(session.restaurantSlug, sessionId, targetTableId);
    await loadBootstrap({ silent: true });
  }

  async function handleMergeDiningTableSession(sessionId: string, targetSessionId: string) {
    if (!session) {
      return;
    }

    await mergeDiningTableSession(session.restaurantSlug, sessionId, targetSessionId);
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

  const currentSection = getSectionFromPath(pathname)?.section ?? "Dashboard";
  const { restaurantName, userName, platformName } = bootstrap.session;
  void platformName;
  let page = null;

  switch (currentSection) {
    case "PedidosOnline":
      page = (
        <OrdersManagementPage
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={bootstrap.featureAccess}
          initialOrders={bootstrap.orders}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onAdvanceStatus={handleAdvanceOrderStatus}
          onCancelOrder={handleCancelOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      );
      break;
    case "Mesas":
      page = (
        <TablesManagementPage
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={bootstrap.featureAccess}
          diningTables={bootstrap.diningTables}
          tableSessions={bootstrap.tableSessions}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveTables={handleSaveDiningTables}
          onAdvanceStatus={handleAdvanceOrderStatus}
          onCancelOrder={handleCancelOrder}
          onDeleteOrder={handleDeleteOrder}
          onCloseSession={handleCloseDiningTableSession}
          onTransferSession={handleTransferDiningTableSession}
          onMergeSession={handleMergeDiningTableSession}
        />
      );
      break;
    case "Cardapio":
      page = (
        <MenuManagementPage
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={bootstrap.featureAccess}
          availableCategories={bootstrap.categories}
          initialProducts={bootstrap.products}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveProduct={handleSaveProduct}
          onToggleProductStatus={handleToggleProductStatus}
          onDeleteProduct={handleDeleteProduct}
        />
      );
      break;
    case "Ofertas":
      page = (
        <OffersManagementPage
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={bootstrap.featureAccess}
          availableProducts={bootstrap.products}
          availableCategories={bootstrap.categories}
          initialOffers={bootstrap.offers}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveOffer={handleSaveOffer}
          onToggleOfferStatus={handleToggleOfferStatus}
        />
      );
      break;
    case "Clientes":
      page = (
        <CustomersManagementPage
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={bootstrap.featureAccess}
          initialCustomers={bootstrap.customers}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onToggleCustomerBlock={handleToggleCustomerBlock}
        />
      );
      break;
    case "Configuracoes":
      page = (
        <SettingsPage
          restaurantSlug={session.restaurantSlug}
          restaurantName={restaurantName}
          userName={userName}
          initialSettings={bootstrap.settings}
          featureAccess={bootstrap.featureAccess}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
          onSaveSettings={handleSaveSettings}
        />
      );
      break;
    case "Dashboard":
    default:
      page = (
        <HomeDashboardPage
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={bootstrap.featureAccess}
          metrics={bootstrap.metrics}
          orders={bootstrap.orders}
          tableOrders={bootstrap.tableOrders}
          customers={bootstrap.customers}
          onLogout={handleLogout}
          onNavigate={navigateToSection}
        />
      );
      break;
  }

  return (
    <AdminLayoutContext.Provider
      value={{
        notifications,
        unreadSignals,
        onOpenNotifications: handleOpenNotifications,
      }}
    >
      <FloatingNotifications notifications={toastNotifications} />
      {page}
    </AdminLayoutContext.Provider>
  );
}
