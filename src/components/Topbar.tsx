import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminNotification,
  AdminSection,
  AdminUnreadSignals,
} from "../types/dashboard";

type TopbarProps = {
  restaurantName: string;
  userName: string;
  pageTitle: string;
  pageSubtitle: string;
  notifications: AdminNotification[];
  unreadSignals: AdminUnreadSignals;
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onOpenNotifications: () => void;
};

export function Topbar({
  restaurantName,
  userName,
  pageTitle,
  pageSubtitle,
  notifications,
  unreadSignals,
  onLogout,
  onNavigate,
  onOpenNotifications,
}: TopbarProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = unreadSignals.online + unreadSignals.tables;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const latestUpdateLabel = useMemo(() => {
    if (!notifications.length) {
      return "Sem alertas novos";
    }

    return `Ultimo alerta ${formatNotificationTime(notifications[0].createdAt)}`;
  }, [notifications]);

  return (
    <header className="border-b border-[color:var(--border-soft)] bg-white px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-label">Painel gerencial</span>
            <span className="hidden h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] sm:inline-block" />
            <span className="text-sm font-medium text-[color:var(--text-muted)]">{restaurantName}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h1 className="text-3xl font-semibold text-[color:var(--text-strong)]">{pageTitle}</h1>
            <div className="rounded-full border border-[color:var(--border-soft)] bg-white/85 px-3 py-1.5 text-xs font-semibold text-[color:var(--accent-green)]">
              Operacao sincronizada
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--text-muted)]">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="hidden rounded-[22px] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-4 py-3 xl:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
              Status do painel
            </p>
            <p className="mt-1 text-sm font-medium text-[color:var(--text-strong)]">{latestUpdateLabel}</p>
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen((current) => {
                  const next = !current;

                  if (next) {
                    onOpenNotifications();
                  }

                  return next;
                });
              }}
              className="relative inline-flex h-12 items-center gap-3 rounded-[22px] border border-[color:var(--border-soft)] bg-white px-4 text-sm font-semibold text-[color:var(--text-strong)] transition hover:-translate-y-[1px] hover:border-[color:var(--border-strong)]"
            >
              <BellIcon />
              <span>Notificacoes</span>
              {unreadCount > 0 ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[color:var(--accent)] px-2 py-1 text-[11px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {isNotificationOpen ? (
              <div className="absolute right-0 top-[calc(100%+14px)] z-40 w-[min(92vw,380px)] rounded-[28px] border border-[color:var(--border-soft)] bg-white p-4 shadow-[var(--shadow-float)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-label">Centro de alertas</p>
                    <h2 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
                      {notifications.length ? "Pedidos recentes" : "Nenhum alerta novo"}
                    </h2>
                  </div>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {unreadCount} nao lido(s)
                    </span>
                  ) : null}
                </div>

                {notifications.length ? (
                  <div className="mt-4 space-y-3">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          onNavigate(notification.accent === "online" ? "PedidosOnline" : "Mesas");
                          setIsNotificationOpen(false);
                        }}
                        className="w-full rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4 text-left transition hover:border-[color:var(--border-strong)] hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                notification.accent === "tables" ? "bg-emerald-500" : "bg-[color:var(--accent)]"
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                                {notification.body.replace(/â€¢|•/g, "/")}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-[color:var(--text-soft)]">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                            {notification.accent === "online" ? "Pedidos online" : "Mesas"}
                          </span>
                          {!notification.isRead ? (
                            <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--accent-strong)]">
                              Novo
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
                    Novos pedidos vao aparecer aqui depois que o banner temporario desaparecer.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 rounded-[24px] border border-[color:var(--border-soft)] bg-white px-3 py-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2f6c60,#5e9b8e)] text-sm font-semibold text-white">
              {userName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((value) => value[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">{userName}</p>
              <p className="truncate text-xs text-[color:var(--text-muted)]">Gestor da operacao</p>
            </div>
          </div>

          <button className="action-secondary" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M15 18H9m8-1V11a5 5 0 1 0-10 0v6l-1.5 2h13L17 17Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
