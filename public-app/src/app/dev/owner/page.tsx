import { IBM_Plex_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import {
  Activity,
  Building2,
  ChevronRight,
  DatabaseZap,
  FolderKanban,
  KeyRound,
  Logs,
  Search,
  ShieldCheck,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import { createCompanyAction, deleteCompanyAction, updateCompanyStatusAction } from "./actions";
import { isValidDevOwnerToken } from "@/lib/dev-owner";
import {
  hasOwnerConsoleCredentialsConfigured,
  isOwnerConsoleAuthenticated,
} from "@/lib/owner-auth";
import { logoutOwnerAction } from "./auth-actions";
import { listManagedCompanies } from "@/services/platform/owner-dashboard";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const navigationItems = [
  { label: "Companies", icon: FolderKanban, active: true },
];

const statusStyles = {
  ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  INACTIVE: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  SUSPENDED: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  CANCELED: "border-rose-500/30 bg-rose-500/10 text-rose-200",
} as const;

function formatDate(value: Date | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

function formatMoney(value: { toNumber(): number } | null) {
  if (!value) {
    return "--";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value.toNumber());
}

function formatPhone(value: string) {
  const normalized = value.replace(/\D/g, "");

  if (normalized.length < 10) {
    return value;
  }

  if (normalized.length === 11) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`;
  }

  return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`;
}

export default async function DevOwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const ownerConsoleUrl = process.env.OWNER_CONSOLE_URL?.trim();

  if (ownerConsoleUrl) {
    redirect(ownerConsoleUrl);
  }

  const { token } = await searchParams;
  const hasOwnerCredentials = hasOwnerConsoleCredentialsConfigured();
  const hasOwnerSession = hasOwnerCredentials ? await isOwnerConsoleAuthenticated() : false;

  if (hasOwnerCredentials && !hasOwnerSession) {
    redirect("/dev/owner/login");
  }

  const hasLegacyToken = !hasOwnerCredentials && isValidDevOwnerToken(token);
  const hasAccess = hasOwnerSession || hasLegacyToken;
  const authMode = hasOwnerSession
    ? "owner session"
    : hasLegacyToken
      ? "legacy query token"
      : "locked";
  const companies = hasAccess ? await listManagedCompanies() : [];
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((company) => company.contract?.status === "ACTIVE").length;
  const onboardingPending = companies.filter(
    (company) => company.adminPasswordTemporary || !company.onboardingCompleted,
  ).length;
  const suspendedCompanies = companies.filter((company) => company.contract?.status === "SUSPENDED").length;
  const runtimeLines = hasAccess
    ? companies.slice(0, 6).map((company, index) => {
        const onboardingState =
          company.adminPasswordTemporary || !company.onboardingCompleted
            ? "awaiting_initial_setup"
            : "session_ready";

        return `[${String(index + 1).padStart(2, "0")}] sync.company("${company.slug}") => contract=${company.contract?.status ?? "ACTIVE"} onboarding=${onboardingState}`;
      })
    : [
        "[01] auth.guard => owner session missing",
        "[02] open /dev/owner/login",
        "[03] datasource => prisma + supabase",
      ];

  return (
    <main
      className={`${plexMono.className} h-screen overflow-hidden bg-[#010101] text-zinc-100`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 18%), radial-gradient(circle at bottom right, rgba(120,120,120,0.12), transparent 20%), linear-gradient(180deg, #050505 0%, #010101 58%, #000000 100%)",
      }}
    >
      <div className="mx-auto h-full max-w-none px-1 py-1 sm:px-2 sm:py-2 lg:px-2 lg:py-2">
        <section className="h-full overflow-hidden rounded-[30px] border border-white/10 bg-black/85 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="grid h-full min-h-0 lg:grid-cols-[250px_1fr]">
            <aside className="border-b border-white/10 bg-[#040404] lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <div className="border-b border-white/10 px-5 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <TerminalSquare size={18} className="text-zinc-100" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-100">
                      Vellor Console
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                      v2.0 control plane
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
                  Project Explorer
                </p>
              </div>

              <nav className="space-y-1 px-3 py-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                        item.active
                          ? "border border-white/10 bg-white/5 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-white/10 p-4">
                <a
                  href="#provision-company"
                  className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                >
                  Provision Company
                </a>
              </div>
            </aside>

            <div className="min-h-0 bg-[#050505] lg:h-full lg:overflow-y-auto">
              <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>root</span>
                  <ChevronRight size={14} />
                  <span>control-plane</span>
                  <ChevronRight size={14} />
                  <span>companies.registry</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                    <Search size={16} />
                    <input
                      className="w-full bg-transparent outline-none placeholder:text-zinc-600"
                      placeholder="Search companies..."
                      readOnly
                      value=""
                    />
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-black px-3 py-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                    owner mode
                  </div>
                  {hasOwnerSession ? (
                    <form action={logoutOwnerAction}>
                      <button
                        className="rounded-2xl border border-white/10 bg-black px-3 py-2 text-xs uppercase tracking-[0.28em] text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
                        type="submit"
                      >
                        logout
                      </button>
                    </form>
                  ) : null}
                </div>
              </header>

              <div className="space-y-6 px-5 py-6">
                <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
                  <div className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">
                          contracted companies
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold text-white">
                          Multi-tenant command registry
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                          Provision empresas, controla contrato, acompanha onboarding inicial e
                          bloqueia operacoes pelo mesmo console.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs leading-6 text-zinc-500">
                        {hasAccess ? (
                          <>
                            <p>access.guard = unlocked</p>
                            <p>auth.mode = {authMode}</p>
                            <p>datasource = supabase / prisma</p>
                          </>
                        ) : (
                          <>
                            <p>access.guard = locked</p>
                            <p>open = /dev/owner/login</p>
                            <p>datasource = pending</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Building2 size={15} />
                          <span className="text-[11px] uppercase tracking-[0.3em]">companies</span>
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-white">{totalCompanies}</p>
                        <p className="mt-2 text-xs text-zinc-500">tenants provisionados</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/20 bg-black p-4">
                        <div className="flex items-center gap-2 text-emerald-300">
                          <Activity size={15} />
                          <span className="text-[11px] uppercase tracking-[0.3em]">active</span>
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-white">{activeCompanies}</p>
                        <p className="mt-2 text-xs text-zinc-500">contratos liberados</p>
                      </div>
                      <div className="rounded-2xl border border-amber-500/20 bg-black p-4">
                        <div className="flex items-center gap-2 text-amber-300">
                          <KeyRound size={15} />
                          <span className="text-[11px] uppercase tracking-[0.3em]">setup</span>
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-white">{onboardingPending}</p>
                        <p className="mt-2 text-xs text-zinc-500">primeiro acesso pendente</p>
                      </div>
                    </div>
                  </div>

                  <section
                    id="provision-company"
                    className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-5"
                  >
                    <div className="flex items-center gap-2 text-zinc-400">
                      <DatabaseZap size={16} />
                      <span className="text-[11px] uppercase tracking-[0.3em]">
                        provision.company()
                      </span>
                    </div>

                    {hasAccess ? (
                      <form action={createCompanyAction} className="mt-5 space-y-4">
                        {hasLegacyToken ? (
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-100">
                            Modo legado ativo. Configure `OWNER_CONSOLE_EMAIL` e
                            `OWNER_CONSOLE_PASSWORD` para remover o token da URL.
                          </div>
                        ) : null}
                        {!hasOwnerCredentials ? (
                          <input name="token" type="hidden" value={token} />
                        ) : null}
                        <div className="grid gap-3">
                          <input
                            className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                            name="companyName"
                            placeholder="company.name"
                            required
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                              name="adminName"
                              placeholder="admin.user"
                              required
                            />
                            <input
                              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                              name="primaryContactPhone"
                              placeholder="contact.phone"
                              required
                            />
                          </div>
                          <input
                            className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                            name="email"
                            placeholder="admin@email.com"
                            type="email"
                            required
                          />
                          <input
                            className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                            name="temporaryPassword"
                            placeholder="temporary.password"
                            required
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-400 outline-none"
                              defaultValue={new Date().toISOString().slice(0, 10)}
                              name="contractStartsAt"
                              type="date"
                              required
                            />
                            <input
                              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-400 outline-none"
                              name="contractEndsAt"
                              type="date"
                            />
                          </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                            name="monthlyPrice"
                            placeholder="monthly.price"
                            />
                            <select
                              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                              defaultValue="ACTIVE"
                              name="status"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                              <option value="CANCELED">CANCELED</option>
                            </select>
                          </div>
                        </div>
                        <div className="rounded-[24px] border border-white/10 bg-black/80 p-4">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                            feature.access
                          </p>
                          <div className="mt-4 grid gap-3">
                            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
                              <span>Gerencial</span>
                              <input defaultChecked name="adminEnabled" type="checkbox" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
                              <span>App mobile</span>
                              <input defaultChecked name="publicOrderingEnabled" type="checkbox" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
                              <span>Cardapio digital</span>
                              <input name="digitalMenuEnabled" type="checkbox" />
                            </label>
                          </div>
                        </div>
                        <textarea
                          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                          name="notes"
                          placeholder="// notes: contrato, plano, SLA, suporte, observacoes do tenant"
                        />
                        <button
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                          type="submit"
                        >
                          provision.company()
                        </button>
                      </form>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
                        Autenticacao do owner ausente. Entre pelo
                        <span className="mx-2 rounded bg-black px-2 py-1 text-xs text-amber-200">
                          /dev/owner/login
                        </span>
                        para liberar o console.
                      </div>
                    )}
                  </section>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">
                          companies.registry
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-white">
                          Contracted companies
                        </h2>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black px-3 py-2 text-xs uppercase tracking-[0.26em] text-zinc-500">
                        {totalCompanies} rows
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
                      <div className="grid grid-cols-[110px_1.4fr_150px_170px_140px_150px] gap-3 border-b border-white/10 bg-black px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                        <span># id</span>
                        <span>entity name</span>
                        <span>status flag</span>
                        <span>first access</span>
                        <span>contract</span>
                        <span>runtime</span>
                      </div>

                      {companies.length ? (
                        companies.map((company) => {
                          const needsSetup =
                            company.adminPasswordTemporary || !company.onboardingCompleted;

                          return (
                            <div
                              key={company.id}
                              className="grid grid-cols-[110px_1.4fr_150px_170px_140px_150px] gap-3 border-b border-white/10 px-4 py-4 text-sm text-zinc-200 last:border-b-0"
                            >
                              <div className="text-xs text-zinc-500">
                                0x{company.id.slice(-4).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold uppercase text-white">
                                    {company.name.slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{company.name}</p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {company.slug} · {company.adminEmail ?? "--"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                                    statusStyles[company.contract?.status ?? "ACTIVE"]
                                  }`}
                                >
                                  {company.contract?.status ?? "ACTIVE"}
                                </span>
                              </div>
                              <div className="text-xs leading-6 text-zinc-400">
                                <p>{needsSetup ? "awaiting_initial_setup" : "session_ready"}</p>
                                <p>{company.adminPasswordTemporary ? "temporary_password" : "locked_in"}</p>
                              </div>
                              <div className="text-xs leading-6 text-zinc-400">
                                <p>{formatDate(company.contract?.startsAt ?? company.createdAt)}</p>
                                <p>{formatMoney(company.contract?.monthlyPrice ?? null)}</p>
                              </div>
                              <div className="text-xs leading-6 text-zinc-400">
                                <p>orders={company._count.orders}</p>
                                <p>products={company._count.products}</p>
                                <p>digital={company.featureAccess.digitalMenuEnabled ? "on" : "off"}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-10 text-center text-sm text-zinc-500">
                          Nenhuma empresa provisionada ainda.
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-black p-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Logs size={15} />
                        <span className="text-[11px] uppercase tracking-[0.3em]">output</span>
                      </div>
                      <div className="mt-4 space-y-2 text-xs leading-6 text-zinc-400">
                        {runtimeLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <section className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-5">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <ShieldCheck size={16} />
                        <span className="text-[11px] uppercase tracking-[0.3em]">
                          runtime.summary
                        </span>
                      </div>
                      <div className="mt-5 grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black p-4">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                            suspended
                          </p>
                          <p className="mt-3 text-2xl font-semibold text-white">{suspendedCompanies}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm leading-7 text-zinc-400">
                          Empresas novas entram com senha temporaria. No primeiro login o tenant
                          troca a senha e finaliza o cadastro inicial antes de acessar a operacao.
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      {companies.map((company) => (
                        <article
                          key={company.id}
                          className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                                patch company
                              </p>
                              <h3 className="mt-3 text-xl font-semibold text-white">{company.name}</h3>
                              <p className="mt-2 text-xs leading-6 text-zinc-500">
                                {formatPhone(company.whatsapp)} · {company.city ?? "cidade pendente"}
                                {company.state ? `/${company.state}` : ""}
                              </p>
                            </div>

                            <form action={deleteCompanyAction}>
                              {!hasOwnerCredentials ? (
                                <input name="token" type="hidden" value={token} />
                              ) : null}
                              <input name="restaurantId" type="hidden" value={company.id} />
                              <button
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20"
                                type="submit"
                              >
                                <Trash2 size={15} />
                                delete
                              </button>
                            </form>
                          </div>

                          <form action={updateCompanyStatusAction} className="mt-5 space-y-3">
                            {!hasOwnerCredentials ? (
                              <input name="token" type="hidden" value={token} />
                            ) : null}
                            <input name="restaurantId" type="hidden" value={company.id} />
                            <div className="grid gap-3 md:grid-cols-2">
                              <select
                                className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                                defaultValue={company.contract?.status ?? "ACTIVE"}
                                name="status"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                                <option value="CANCELED">CANCELED</option>
                              </select>
                              <input
                                className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-400 outline-none"
                                defaultValue={
                                  company.contract?.endsAt
                                    ? company.contract.endsAt.toISOString().slice(0, 10)
                                    : ""
                                }
                                name="endsAt"
                                type="date"
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
                                <span>Gerencial</span>
                                <input
                                  defaultChecked={company.featureAccess.adminEnabled}
                                  name="adminEnabled"
                                  type="checkbox"
                                />
                              </label>
                              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
                                <span>App mobile</span>
                                <input
                                  defaultChecked={company.featureAccess.publicOrderingEnabled}
                                  name="publicOrderingEnabled"
                                  type="checkbox"
                                />
                              </label>
                              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
                                <span>Cardapio digital</span>
                                <input
                                  defaultChecked={company.featureAccess.digitalMenuEnabled}
                                  name="digitalMenuEnabled"
                                  type="checkbox"
                                />
                              </label>
                            </div>
                            <textarea
                              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                              defaultValue={company.contract?.notes ?? ""}
                              name="notes"
                              placeholder="// contract notes, billing remarks, support context"
                            />
                            <button
                              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                              type="submit"
                            >
                              apply.contract.patch()
                            </button>
                          </form>
                        </article>
                      ))}
                    </section>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
