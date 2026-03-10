import type { ReactNode } from "react";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import {
  Activity,
  Building2,
  CreditCard,
  FolderKanban,
  MonitorSmartphone,
  RadioTower,
  TerminalSquare,
} from "lucide-react";
import { logoutOwnerAction } from "@/app/actions";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type OwnerShellProps = {
  activeItem: "overview" | "company";
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

const navigationItems = [
  { href: "/", label: "Overview", icon: Activity, key: "overview" as const },
  { href: "/#companies", label: "Companies", icon: Building2, key: "company" as const },
  { href: "/#create-company", label: "Provision", icon: FolderKanban, key: "overview" as const },
  { href: "/#event-stream", label: "Events", icon: RadioTower, key: "overview" as const },
];

const stackHighlights = [
  "Controle comercial manual",
  "Pacotes por tenant",
  "Preview do sistema em contexto",
];

export function OwnerShell({
  activeItem,
  eyebrow,
  title,
  description,
  children,
  actions,
}: OwnerShellProps) {
  return (
    <main
      className={`${plexSans.className} min-h-screen bg-[#06070b] text-zinc-100`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(87, 229, 183, 0.1), transparent 18%), radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 22%), linear-gradient(180deg, #080910 0%, #040508 52%, #020305 100%)",
      }}
    >
      <div className="mx-auto grid min-h-screen max-w-[1880px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-black/40 px-5 py-6 backdrop-blur-xl lg:border-b-0 lg:border-r lg:px-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <TerminalSquare size={18} />
              </div>
              <div>
                <p className={`${plexMono.className} text-[12px] font-semibold uppercase tracking-[0.28em] text-white`}>
                  Vellor Owner
                </p>
                <p className={`${plexMono.className} mt-1 text-[10px] uppercase tracking-[0.32em] text-zinc-500`}>
                  control plane
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {stackHighlights.map((item) => (
                <div
                  key={item}
                  className={`${plexMono.className} rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.key;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                    isActive
                      ? "border-emerald-400/20 bg-emerald-400/10 text-white"
                      : "border-white/8 bg-white/[0.02] text-zinc-400 hover:border-white/14 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
            <div className="grid gap-3 text-sm text-zinc-300">
              <div className="flex items-center gap-3">
                <MonitorSmartphone size={16} className="text-sky-300" />
                <span>App publico no contexto da empresa</span>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-amber-300" />
                <span>Cobranca manual e observacoes internas</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <form action={logoutOwnerAction}>
              <button
                className={`${plexMono.className} w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white`}
                type="submit"
              >
                logout
              </button>
            </form>
          </div>
        </aside>

        <section className="space-y-6 px-5 py-6 lg:px-7">
          <header className="overflow-hidden rounded-[34px] border border-white/10 bg-black/35 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <p className={`${plexMono.className} text-[11px] uppercase tracking-[0.34em] text-zinc-500`}>
                  {eyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white lg:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 lg:text-[15px]">
                  {description}
                </p>
              </div>

              {actions ? (
                <div className="flex flex-wrap gap-3 lg:max-w-[420px] lg:justify-end">{actions}</div>
              ) : null}
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
