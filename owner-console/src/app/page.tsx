import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Cable,
  CircleAlert,
  ExternalLink,
  FolderKanban,
  Logs,
  RadioTower,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ActionSubmitButton } from "@/components/action-submit-button";
import { OwnerFeedbackBanner } from "@/components/owner-feedback-banner";
import { OwnerShell } from "@/components/owner-shell";
import {
  createCompanyAction,
  deleteCompanyAction,
  reprocessCompanyProvisionAction,
  updateCompanyStatusAction,
} from "./actions";
import {
  hasOwnerConsoleCredentialsConfigured,
  isOwnerConsoleAuthenticated,
} from "@/lib/owner-auth";
import {
  contractStatusStyles,
  formatDate,
  formatDateTime,
  formatMoney,
  provisioningStatusStyles,
  readSearchParam,
  resolveOwnerFeedback,
} from "@/lib/owner-ui";
import {
  listManagedCompanies,
  listRecentProvisioningJobs,
} from "@/services/platform/owner-dashboard";

export default async function OwnerConsolePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!hasOwnerConsoleCredentialsConfigured()) {
    redirect("/login?error=not-configured");
  }

  if (!(await isOwnerConsoleAuthenticated())) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const feedback = resolveOwnerFeedback(resolvedSearchParams);
  const searchQuery = readSearchParam(resolvedSearchParams.q).trim();
  const [companies, recentJobs] = await Promise.all([
    listManagedCompanies(searchQuery),
    listRecentProvisioningJobs(8),
  ]);

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((company) => company.contract?.status === "ACTIVE").length;
  const onboardingPending = companies.filter(
    (company) => company.adminPasswordTemporary || !company.onboardingCompleted,
  ).length;
  const digitalLive = companies.filter((company) => company.featureAccess.digitalMenuEnabled).length;
  const estimatedMrr = companies.reduce((total, company) => {
    return total + (company.contract?.monthlyPrice?.toNumber() ?? 0);
  }, 0);
  const failedJobs = recentJobs.filter((job) => job.status === "FAILED").length;

  return (
    <OwnerShell
      activeItem="overview"
      eyebrow="owner / overview"
      title="Cockpit central da Vellor"
      description="Controle empresas, contratos, provisionamento e acesso aos sistemas de cada tenant em um unico lugar. O owner agora opera mais como torre de controle do que como simples CRUD de cadastro."
      actions={
        <>
          <form action="/" className="flex min-w-[300px] items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
            <Search size={16} className="text-zinc-500" />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              name="q"
              placeholder="Buscar por empresa, slug ou admin..."
              defaultValue={searchQuery}
            />
          </form>
          <a
            href="#create-company"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
          >
            <FolderKanban size={15} />
            Provisionar tenant
          </a>
        </>
      }
    >
      <OwnerFeedbackBanner feedback={feedback?.scope === "global" ? feedback : null} />

      <section className="grid gap-4 xl:grid-cols-5">
        <article className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-zinc-500">
            <Building2 size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">companies</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{totalCompanies}</p>
          <p className="mt-2 text-sm text-zinc-500">tenants sob gestao direta</p>
        </article>

        <article className="rounded-[28px] border border-emerald-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-300">
            <Activity size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">active</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{activeCompanies}</p>
          <p className="mt-2 text-sm text-zinc-500">contratos ativos</p>
        </article>

        <article className="rounded-[28px] border border-amber-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldCheck size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">setup</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{onboardingPending}</p>
          <p className="mt-2 text-sm text-zinc-500">primeiro acesso pendente</p>
        </article>

        <article className="rounded-[28px] border border-sky-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sky-300">
            <Cable size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">digital</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{digitalLive}</p>
          <p className="mt-2 text-sm text-zinc-500">cardapios de mesa ativos</p>
        </article>

        <article className="rounded-[28px] border border-fuchsia-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <BadgeDollarSign size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">mrr</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{formatMoney(estimatedMrr)}</p>
          <p className="mt-2 text-sm text-zinc-500">receita manual acordada</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)_360px]">
        <section
          id="create-company"
          className="rounded-[32px] border border-white/10 bg-black/35 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl"
        >
          <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">provision.company()</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Novo tenant FOOD</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Provisione a empresa, ja definindo liberacoes, mensalidade combinada e status do
            contrato.
          </p>

          <OwnerFeedbackBanner feedback={feedback?.scope === "create" ? feedback : null} className="mt-4" />

          <form action={createCompanyAction} className="mt-5 space-y-4">
            <input name="productCode" type="hidden" value="FOOD" />
            <input name="redirectTo" type="hidden" value="/" />

            <input
              className="w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              name="companyName"
              placeholder="Nome da empresa"
              required
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                name="adminName"
                placeholder="Responsavel"
                required
              />
              <input
                className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                name="primaryContactPhone"
                placeholder="WhatsApp"
                required
              />
            </div>

            <input
              className="w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              name="email"
              placeholder="Email do admin"
              type="email"
              required
            />

            <input
              className="w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              name="temporaryPassword"
              placeholder="Senha temporaria"
              required
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-zinc-300 outline-none"
                defaultValue={new Date().toISOString().slice(0, 10)}
                name="contractStartsAt"
                type="date"
                required
              />
              <input
                className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-zinc-300 outline-none"
                name="contractEndsAt"
                type="date"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                name="monthlyPrice"
                placeholder="Mensalidade acordada"
              />
              <select
                className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none"
                defaultValue="ACTIVE"
                name="status"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">feature.access</p>
              <div className="mt-4 grid gap-3">
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 px-4 py-3 text-sm text-zinc-300">
                  <span>Gerencial</span>
                  <input defaultChecked name="adminEnabled" type="checkbox" />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 px-4 py-3 text-sm text-zinc-300">
                  <span>App publico</span>
                  <input defaultChecked name="publicOrderingEnabled" type="checkbox" />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 px-4 py-3 text-sm text-zinc-300">
                  <span>Cardapio digital</span>
                  <input name="digitalMenuEnabled" type="checkbox" />
                </label>
              </div>
            </div>

            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              name="notes"
              placeholder="Observacoes internas, SLA, contato comercial, combinados"
            />

            <ActionSubmitButton
              className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
              pendingLabel="provisioning.company()"
            >
              provision.company()
            </ActionSubmitButton>
          </form>
        </section>

        <section
          id="companies"
          className="rounded-[32px] border border-white/10 bg-black/35 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">companies.registry</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Empresas em operacao</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Lista centralizada com atalhos para controle contratual, reprocessamento e acesso ao
                sistema de cada tenant.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
              {failedJobs > 0 ? `${failedJobs} job(s) falharam recentemente` : "Nenhuma falha recente no pipeline"}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {companies.length ? (
              companies.map((company) => {
                const needsSetup = company.adminPasswordTemporary || !company.onboardingCompleted;
                const companyFeedback =
                  feedback?.scope === "company" && feedback.companyId === company.companyId ? feedback : null;

                return (
                  <article
                    id={`company-${company.companyId}`}
                    key={company.id}
                    className="rounded-[28px] border border-white/10 bg-[#080a10] p-5"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-4">
                        <div>
                          <p className="text-2xl font-semibold text-white">{company.name}</p>
                          <p className="mt-2 text-sm text-zinc-500">
                            {company.slug} / {company.adminEmail ?? "--"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 uppercase tracking-[0.22em] ${
                              contractStatusStyles[company.contract?.status ?? "ACTIVE"]
                            }`}
                          >
                            {company.contract?.status ?? "ACTIVE"}
                          </span>
                          <span>{needsSetup ? "awaiting_initial_setup" : "session_ready"}</span>
                          <span>{formatDate(company.contract?.startsAt ?? company.createdAt)}</span>
                          <span>{formatMoney(company.contract?.monthlyPrice ?? null)}</span>
                          <span>admin={company.featureAccess.adminEnabled ? "on" : "off"}</span>
                          <span>mobile={company.featureAccess.publicOrderingEnabled ? "on" : "off"}</span>
                          <span>digital={company.featureAccess.digitalMenuEnabled ? "on" : "off"}</span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/companies/${company.companyId}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
                          >
                            Abrir empresa
                            <ArrowRight size={15} />
                          </Link>
                          {company.links.publicUrl ? (
                            <a
                              href={company.links.publicUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
                            >
                              <ExternalLink size={15} />
                              App publico
                            </a>
                          ) : null}
                          {company.links.digitalMenuUrl ? (
                            <a
                              href={company.links.digitalMenuUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
                            >
                              <ExternalLink size={15} />
                              Cardapio digital
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[340px]">
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">catalogo</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{company._count.products}</p>
                          <p className="mt-1 text-xs text-zinc-500">produtos ativos no tenant</p>
                        </div>
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">orders</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{company._count.orders}</p>
                          <p className="mt-1 text-xs text-zinc-500">pedidos processados</p>
                        </div>
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">crm</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{company._count.customers}</p>
                          <p className="mt-1 text-xs text-zinc-500">clientes no banco</p>
                        </div>
                      </div>
                    </div>

                    <OwnerFeedbackBanner feedback={companyFeedback} className="mt-4" />

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                      <form action={updateCompanyStatusAction} className="space-y-3">
                        <input name="companyId" type="hidden" value={company.companyId} />
                        <input name="productCode" type="hidden" value={company.productCode} />
                        <input name="redirectTo" type="hidden" value="/" />
                        <input name="hash" type="hidden" value={`company-${company.companyId}`} />

                        <div className="grid gap-3 md:grid-cols-3">
                          <select
                            className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none"
                            defaultValue={company.contract?.status ?? "ACTIVE"}
                            name="status"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                            <option value="CANCELED">CANCELED</option>
                          </select>
                          <input
                            className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-zinc-300 outline-none"
                            defaultValue={
                              company.contract?.endsAt ? company.contract.endsAt.toISOString().slice(0, 10) : ""
                            }
                            name="endsAt"
                            type="date"
                          />
                          <input
                            className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                            defaultValue={
                              company.contract?.monthlyPrice ? company.contract.monthlyPrice.toString() : ""
                            }
                            name="monthlyPrice"
                            placeholder="Mensalidade"
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
                            <span>Gerencial</span>
                            <input
                              defaultChecked={company.featureAccess.adminEnabled}
                              name="adminEnabled"
                              type="checkbox"
                            />
                          </label>
                          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
                            <span>App publico</span>
                            <input
                              defaultChecked={company.featureAccess.publicOrderingEnabled}
                              name="publicOrderingEnabled"
                              type="checkbox"
                            />
                          </label>
                          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
                            <span>Cardapio digital</span>
                            <input
                              defaultChecked={company.featureAccess.digitalMenuEnabled}
                              name="digitalMenuEnabled"
                              type="checkbox"
                            />
                          </label>
                        </div>

                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                          defaultValue={company.contract?.notes ?? ""}
                          name="notes"
                          placeholder="Notas comerciais, acordos de pagamento, suporte e contexto"
                        />

                        <div className="flex flex-wrap gap-3">
                          <ActionSubmitButton
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
                            pendingLabel="applying.contract.patch()"
                          >
                            apply.contract.patch()
                          </ActionSubmitButton>
                        </div>
                      </form>

                      <div className="space-y-3">
                        <form action={reprocessCompanyProvisionAction}>
                          <input name="companyId" type="hidden" value={company.companyId} />
                          <input name="productCode" type="hidden" value={company.productCode} />
                          <input name="redirectTo" type="hidden" value="/" />
                          <input name="hash" type="hidden" value={`company-${company.companyId}`} />
                          <ActionSubmitButton
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/15"
                            pendingLabel="reprocessing.tenant()"
                          >
                            <RadioTower size={15} />
                            Reprocessar tenant
                          </ActionSubmitButton>
                        </form>

                        <form action={deleteCompanyAction}>
                          <input name="companyId" type="hidden" value={company.companyId} />
                          <input name="redirectTo" type="hidden" value="/" />
                          <ActionSubmitButton
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20"
                            pendingLabel="deleting.company()"
                          >
                            <Trash2 size={15} />
                            delete
                          </ActionSubmitButton>
                        </form>

                        {company.lastProvisioningJob ? (
                          <div
                            className={`rounded-[24px] border px-4 py-4 text-sm ${
                              provisioningStatusStyles[company.lastProvisioningJob.status]
                            }`}
                          >
                            <p className="text-[11px] uppercase tracking-[0.22em]">last provisioning</p>
                            <p className="mt-3 font-semibold">{company.lastProvisioningJob.status}</p>
                            <p className="mt-1 text-xs opacity-80">
                              {formatDateTime(company.lastProvisioningJob.createdAt)}
                            </p>
                            {company.lastProvisioningJob.errorMessage ? (
                              <p className="mt-3 text-xs opacity-90">{company.lastProvisioningJob.errorMessage}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/25 px-4 py-10 text-center text-sm text-zinc-500">
                Nenhuma empresa encontrada para este filtro.
              </div>
            )}
          </div>
        </section>

        <section
          id="event-stream"
          className="rounded-[32px] border border-white/10 bg-black/35 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 text-zinc-400">
            <Logs size={16} />
            <span className="text-[11px] uppercase tracking-[0.3em]">event.stream</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">Provisionamento e eventos recentes</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Historico dos jobs mais recentes disparados pelo owner para manter cada tenant alinhado
            com o contrato e com os pacotes liberados.
          </p>

          <div className="mt-5 space-y-3">
            {recentJobs.length ? (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-[24px] border border-white/10 bg-[#080a10] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{job.companyName}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {job.companySlug} / {job.productCode}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                        provisioningStatusStyles[job.status]
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-zinc-400">
                    <p>Solicitado em {formatDateTime(job.createdAt)}</p>
                    <p>Responsavel: {job.requestedByEmail ?? "owner-console"}</p>
                    {job.errorMessage ? (
                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-rose-100">
                        <div className="flex items-start gap-2">
                          <CircleAlert size={15} className="mt-0.5 shrink-0" />
                          <span>{job.errorMessage}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <Link
                    href={`/companies/${job.companyId}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-200 transition hover:text-white"
                  >
                    Abrir empresa
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/25 px-4 py-10 text-center text-sm text-zinc-500">
                Nenhum job recente para exibir.
              </div>
            )}
          </div>
        </section>
      </section>
    </OwnerShell>
  );
}
