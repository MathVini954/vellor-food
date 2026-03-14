import type { AdminSection, AdminUnreadSignals, FeatureAccess } from "../types/dashboard";

const navigationGroups: Array<{
  label: string;
  items: Array<{ section: AdminSection; title: string; icon: string }>;
}> = [
  {
    label: "Operacao",
    items: [
      { section: "Dashboard", title: "Dashboard", icon: "dashboard" },
      { section: "PedidosOnline", title: "Pedidos online", icon: "orders" },
      { section: "Mesas", title: "Mesas", icon: "tables" },
      { section: "Cardapio", title: "Cardapio", icon: "menu" },
    ],
  },
  {
    label: "Gestao",
    items: [
      { section: "Ofertas", title: "Ofertas", icon: "offers" },
      { section: "Clientes", title: "Clientes", icon: "customers" },
      { section: "Configuracoes", title: "Configuracoes", icon: "settings" },
    ],
  },
];

type SidebarProps = {
  activeItem?: AdminSection;
  restaurantName: string;
  featureAccess?: FeatureAccess;
  unreadSignals?: AdminUnreadSignals;
  onNavigate?: (item: AdminSection) => void;
  mode?: "desktop" | "mobile";
};

export function Sidebar({
  activeItem = "Dashboard",
  restaurantName,
  featureAccess,
  unreadSignals = { online: 0, tables: 0 },
  onNavigate,
  mode = "desktop",
}: SidebarProps) {
  const availableNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.section === "Mesas" ? featureAccess?.digitalMenuEnabled !== false : true,
      ),
    }))
    .filter((group) => group.items.length > 0);

  const flattenedItems = availableNavigationGroups.flatMap((group) => group.items);
  const totalPending = unreadSignals.online + unreadSignals.tables;

  if (mode === "mobile") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="section-label">Painel gerencial</p>
            <p className="truncate text-base font-semibold text-[color:var(--text-strong)]">
              {restaurantName}
            </p>
          </div>
          {totalPending > 0 ? (
            <div className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-[color:var(--accent)]">
              {totalPending} alerta(s)
            </div>
          ) : null}
        </div>

        <nav className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {flattenedItems.map((item) => (
            <NavButton
              key={item.section}
              item={item}
              isActive={activeItem === item.section}
              badge={resolveUnreadBadge(item.section, unreadSignals)}
              compact
              onClick={() => onNavigate?.(item.section)}
            />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <aside className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(245,247,250,0.96))] text-[color:var(--text-strong)] backdrop-blur-xl">
      <div className="px-5 pb-4 pt-6">
        <div className="panel-elevated overflow-hidden p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#d38664,#b75d3e)] text-white shadow-[0_16px_32px_rgba(183,93,62,0.24)]">
              <SidebarGlyph icon="brand" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Insight gerencial</p>
              <h2 className="truncate text-lg font-semibold text-[color:var(--text-strong)]">MesaPilot</h2>
              <p className="truncate text-sm text-[color:var(--text-muted)]">{restaurantName}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="panel-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                Online
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{unreadSignals.online}</p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">Novos pedidos</p>
            </div>
            <div className="panel-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                Mesas
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{unreadSignals.tables}</p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">Novas comandas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6">
        <div className="space-y-6">
          {availableNavigationGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                {group.label}
              </p>
              <nav className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <NavButton
                    key={item.section}
                    item={item}
                    isActive={activeItem === item.section}
                    badge={resolveUnreadBadge(item.section, unreadSignals)}
                    onClick={() => onNavigate?.(item.section)}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function resolveUnreadBadge(section: AdminSection, unreadSignals: AdminUnreadSignals) {
  if (section === "PedidosOnline") {
    return unreadSignals.online;
  }

  if (section === "Mesas") {
    return unreadSignals.tables;
  }

  return 0;
}

function NavButton({
  item,
  isActive,
  badge,
  compact = false,
  onClick,
}: {
  item: { section: AdminSection; title: string; icon: string };
  isActive: boolean;
  badge: number;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-3 text-left transition duration-200 ${
        compact
          ? `shrink-0 rounded-2xl border px-3 py-2.5 ${
              isActive
                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                : "border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] text-[color:var(--text-muted)]"
            }`
          : `w-full rounded-[22px] border px-3 py-3 ${
              isActive
                ? "border-[color:rgba(183,93,62,0.18)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_16px_28px_rgba(183,93,62,0.08)]"
                : "border-transparent bg-transparent text-[color:var(--text-muted)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-strong)]"
            }`
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          isActive
            ? "bg-[color:var(--surface-strong)] text-[color:var(--accent)] shadow-[0_10px_24px_rgba(183,93,62,0.12)]"
            : "bg-[color:var(--surface-muted)] text-[color:var(--text-muted)]"
        }`}
      >
        <SidebarGlyph icon={item.icon} />
      </span>
      <span className="flex-1 text-sm font-semibold">{item.title}</span>
      {badge > 0 ? (
        <span className="rounded-full bg-[color:var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      ) : isActive && !compact ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
      ) : null}
    </button>
  );
}

function SidebarGlyph({ icon }: { icon: string }) {
  const common = "h-[18px] w-[18px]";

  switch (icon) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Zm10-9h6v-3h-6v3Z" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
        </svg>
      );
    case "menu":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4v8M11 4v8M7 8h4M15 4c1.7 2 2.7 4 2.7 6.2 0 1.7-.6 3.1-1.7 4.3L15 20" strokeLinecap="round" />
        </svg>
      );
    case "offers":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
        </svg>
      );
    case "customers":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19a4 4 0 0 0-3-3.87M17 11a3 3 0 0 0 0-6" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7 3.5-.9-.5.1-1a1 1 0 0 0-.6-1l-1-.4-.3-1a1 1 0 0 0-.9-.6l-1 .1-.6-.9a1 1 0 0 0-1-.4l-1 .3-1-.3a1 1 0 0 0-1 .4l-.6.9-1-.1a1 1 0 0 0-.9.6l-.3 1-1 .4a1 1 0 0 0-.6 1l.1 1-.9.5a1 1 0 0 0-.4.9l.3 1 1 .4.3 1a1 1 0 0 0 .9.6l1-.1.6.9a1 1 0 0 0 1 .4l1-.3 1 .3a1 1 0 0 0 1-.4l.6-.9 1 .1a1 1 0 0 0 .9-.6l.3-1 1-.4.3-1a1 1 0 0 0-.4-.9Z" />
        </svg>
      );
    case "tables":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16h-11A2.5 2.5 0 0 1 4 13.5v-6ZM8 16v3M16 16v3M4 10h16" strokeLinecap="round" />
        </svg>
      );
    case "brand":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.9">
          <path d="M12 4c-4.4 0-8 3.6-8 8 0 3.7 2.5 6.8 5.9 7.7M12 4c4.4 0 8 3.6 8 8 0 3.7-2.5 6.8-5.9 7.7M12 4v16M8 8c1.1 1.1 2.5 1.7 4 1.7S14.9 9.1 16 8M8 16c1.1-1.1 2.5-1.7 4-1.7s2.9.6 4 1.7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
