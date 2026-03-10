import type { AdminSection, FeatureAccess } from "../types/dashboard";

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
      { section: "Cardapio", title: "Cardápio", icon: "menu" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { section: "Ofertas", title: "Ofertas", icon: "offers" },
      { section: "Clientes", title: "Clientes", icon: "customers" },
      { section: "Configuracoes", title: "Configurações", icon: "settings" },
    ],
  },
];

type SidebarProps = {
  activeItem?: AdminSection;
  restaurantName: string;
  userName: string;
  featureAccess?: FeatureAccess;
  onNavigate?: (item: AdminSection) => void;
};

export function Sidebar({
  activeItem = "Dashboard",
  restaurantName,
  userName,
  featureAccess,
  onNavigate,
}: SidebarProps) {
  const availableNavigationGroups = navigationGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.section === "Mesas" ? featureAccess?.digitalMenuEnabled !== false : true,
    ),
  }));

  return (
    <aside className="flex h-full w-full flex-col bg-[#171b38] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6f74ff,#7c3aed)] shadow-[0_12px_24px_rgba(111,116,255,0.35)]">
            <SidebarGlyph icon="brand" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold">Vellor</h2>
            </div>
            <p className="truncate text-xs text-slate-400">{restaurantName}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-3 py-4">
        <div className="space-y-4">
          {availableNavigationGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {group.label}
              </p>
              <nav className="mt-2.5 space-y-1">
                {group.items.map((item) => {
                  const isActive = activeItem === item.section;

                  return (
                    <button
                      key={item.section}
                      type="button"
                      onClick={() => onNavigate?.(item.section)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                        isActive
                          ? "bg-[linear-gradient(180deg,rgba(74,89,152,0.58),rgba(51,63,109,0.72))] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          isActive ? "bg-white/12" : "bg-white/5"
                        }`}
                      >
                        <SidebarGlyph icon={item.icon} />
                      </span>
                      <span className="flex-1 font-medium">{item.title}</span>
                      {isActive ? <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 px-1 pt-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] text-sm font-semibold">
              {userName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((value) => value[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-slate-400">{restaurantName}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
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
