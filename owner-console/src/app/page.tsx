import { IBM_Plex_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import {
  Activity,
  Building2,
  FolderKanban,
  Logs,
  Search,
  ShieldCheck,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import {
  createCompanyAction,
  deleteCompanyAction,
  logoutOwnerAction,
  updateCompanyStatusAction,
} from "./actions";
import {
  hasOwnerConsoleCredentialsConfigured,
  isOwnerConsoleAuthenticated,
} from "@/lib/owner-auth";
import { listManagedCompanies } from "@/services/platform/owner-dashboard";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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

export default async function OwnerConsolePage() {
  if (!hasOwnerConsoleCredentialsConfigured()) {
    redirect("/login?error=not-configured");
  }

  if (!(await isOwnerConsoleAuthenticated())) {
    redirect("/login");
  }

  const companies = await listManagedCompanies();
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((company) => company.contract?.status === "ACTIVE").length;
  const onboardingPending = companies.filter(
    (company) => company.adminPasswordTemporary || !company.onboardingCompleted,
  ).length;

  return (
    <main
      className={`${plexMono.className} min-h-screen bg-[#010101] text-zinc-100`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 18%), radial-gradient(circle at bottom right, rgba(120,120,120,0.12), transparent 20%), linear-gradient(180deg, #050505 0%, #010101 58%, #000000 100%)",
      }}
    >
      <div className="mx-auto grid min-h-screen max-w-[1800px] lg:grid-cols-[250px_1fr]">
        <aside className="border-b border-white/10 bg-black/80 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <TerminalSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-100">
                Vellor Console
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                owner control plane
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
            <div className="flex items-center gap-3">
              <FolderKanban size={16} />
              <span>Companies</span>
            </div>
          </div>

          <div className="mt-6">
            <form action={logoutOwnerAction}>
              <button
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                type="submit"
              >
                logout
              </button>
            </form>
          </div>
        </aside>

        <section className="space-y-6 p-5">
          <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-black/70 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">
                owner / companies
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                Provisionamento central da plataforma
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Console isolado para criar empresas, controlar contratos e acompanhar o primeiro
                acesso dos tenants.
              </p>
            </div>

            <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
              <Search size={16} />
              <input
                className="w-full bg-transparent outline-none placeholder:text-zinc-600"
                placeholder="Search companies..."
                readOnly
                value=""
              />
            </label>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/70 p-5">
              <div className="flex items-center gap-2 text-zinc-500">
                <Building2 size={15} />
                <span className="text-[11px] uppercase tracking-[0.3em]">companies</span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{totalCompanies}</p>
              <p className="mt-2 text-xs text-zinc-500">tenants provisionados</p>
            </div>
            <div className="rounded-[24px] border border-emerald-500/20 bg-black/70 p-5">
              <div className="flex items-center gap-2 text-emerald-300">
                <Activity size={15} />
                <span className="text-[11px] uppercase tracking-[0.3em]">active</span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{activeCompanies}</p>
              <p className="mt-2 text-xs text-zinc-500">contratos liberados</p>
            </div>
            <div className="rounded-[24px] border border-amber-500/20 bg-black/70 p-5">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldCheck size={15} />
                <span className="text-[11px] uppercase tracking-[0.3em]">setup</span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{onboardingPending}</p>
              <p className="mt-2 text-xs text-zinc-500">primeiro acesso pendente</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <section className="rounded-[28px] border border-white/10 bg-black/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">
                provision.company()
              </p>
              <form action={createCompanyAction} className="mt-5 space-y-4">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
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
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  name="email"
                  placeholder="admin@email.com"
                  type="email"
                  required
                />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
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
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  name="notes"
                  placeholder="// notes: contrato, plano, SLA, suporte"
                />
                <button
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                  type="submit"
                >
                  provision.company()
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-black/70 p-5">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Logs size={15} />
                  <span className="text-[11px] uppercase tracking-[0.3em]">companies.registry</span>
                </div>
                <div className="mt-5 space-y-4">
                  {companies.length ? (
                    companies.map((company) => {
                      const needsSetup =
                        company.adminPasswordTemporary || !company.onboardingCompleted;

                      return (
                        <article
                          key={company.id}
                          className="rounded-[24px] border border-white/10 bg-black p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-white">{company.name}</p>
                              <p className="mt-2 text-xs leading-6 text-zinc-500">
                                {company.slug} / {company.adminEmail ?? "--"}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 uppercase tracking-[0.22em] ${
                                    statusStyles[company.contract?.status ?? "ACTIVE"]
                                  }`}
                                >
                                  {company.contract?.status ?? "ACTIVE"}
                                </span>
                                <span>{needsSetup ? "awaiting_initial_setup" : "session_ready"}</span>
                                <span>{formatDate(company.contract?.startsAt ?? company.createdAt)}</span>
                                <span>{formatMoney(company.contract?.monthlyPrice ?? null)}</span>
                              </div>
                            </div>

                            <form action={deleteCompanyAction}>
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

                          <form action={updateCompanyStatusAction} className="mt-4 space-y-3">
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
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-white/10 bg-black px-4 py-10 text-center text-sm text-zinc-500">
                      Nenhuma empresa provisionada ainda.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
