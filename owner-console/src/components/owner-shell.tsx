import type { ReactNode } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Building2, CodeXml, FileText, LogOut } from "lucide-react";
import { logoutOwnerAction } from "@/app/actions";

const geist = Geist({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

type OwnerShellProps = {
  activeItem: "companies" | "logs" | "company";
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

const navigationItems = [
  { href: "/", label: "Companies", icon: Building2, key: "companies" as const },
  { href: "/logs", label: "Logs", icon: FileText, key: "logs" as const },
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
      className={`${geist.className} min-h-screen bg-[#0a0a0b] text-[#f5f5f7]`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 0, transparent 50%), linear-gradient(180deg, #111214 0%, #0a0a0b 32%, #050506 100%)",
      }}
    >
      <div className="grid min-h-screen w-full lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/8 bg-black/30 px-4 py-4 backdrop-blur-2xl lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:rounded-[28px]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
                <CodeXml size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em] text-white">
                  Vellor Owner
                </p>
                <p className={`${geistMono.className} text-[11px] uppercase tracking-[0.24em] text-zinc-500`}>
                  {"<?>"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Painel central da plataforma com foco em empresas, contratos e eventos.
            </p>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 lg:mt-6 lg:block lg:space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.key || (item.key === "companies" && activeItem === "company");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.18)]"
                      : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4 lg:mt-6 lg:rounded-[24px]">
            <p className={`${geistMono.className} text-[11px] uppercase tracking-[0.22em] text-zinc-500`}>
              stack
            </p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>Food tenant control</p>
              <p>Contracts and packages</p>
              <p>Operational logs</p>
            </div>
          </div>

          <form action={logoutOwnerAction} className="mt-4 lg:mt-6">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              type="submit"
            >
              <LogOut size={15} />
              Sair
            </button>
          </form>
        </aside>

        <section className="px-0 py-0 lg:px-10 lg:py-6">
          <header className="border-b border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:rounded-[28px] sm:border sm:p-5 lg:rounded-[32px] lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className={`${geistMono.className} text-[11px] uppercase tracking-[0.28em] text-zinc-500`}>
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{description}</p>
              </div>

              {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
            </div>
          </header>

          <div className="mt-4 px-4 pb-4 sm:mt-6 sm:px-0 sm:pb-0">{children}</div>
        </section>
      </div>
    </main>
  );
}
