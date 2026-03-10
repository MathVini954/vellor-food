import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  ExternalLink,
  LayoutDashboard,
  RadioTower,
  ReceiptText,
  ShieldCheck,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { ActionSubmitButton } from "@/components/action-submit-button";
import { CompanySystemPreview } from "@/components/company-system-preview";
import { OwnerFeedbackBanner } from "@/components/owner-feedback-banner";
import { OwnerShell } from "@/components/owner-shell";
import {
  deleteCompanyAction,
  reprocessCompanyProvisionAction,
  updateCompanyStatusAction,
} from "@/app/actions";
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
  resolveOwnerFeedback,
} from "@/lib/owner-ui";
import { getManagedCompanyDetail } from "@/services/platform/owner-dashboard";

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!hasOwnerConsoleCredentialsConfigured()) {
    redirect("/login?error=not-configured");
  }

  if (!(await isOwnerConsoleAuthenticated())) {
    redirect("/login");
  }

  const { companyId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const feedback = resolveOwnerFeedback(resolvedSearchParams);
  const company = await getManagedCompanyDetail(companyId);

  if (!company) {
    notFound();
  }

  const companyFeedback =
    feedback?.scope === "company" && feedback.companyId === company.companyId ? feedback : null;

  return (
    <OwnerShell
      activeItem="company"
      eyebrow={`owner / companies / ${company.slug}`}
      title={company.name}
      description="Pagina operacional completa do tenant: comercial manual, stack liberado, provisionamento recente, links oficiais e preview embutido do sistema publico da empresa."
      actions={
        <>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={15} />
            Voltar ao overview
          </Link>
          {company.links.publicUrl ? (
            <a
              href={company.links.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              <ExternalLink size={15} />
              Abrir app publico
            </a>
          ) : null}
          <Link
            href={`/companies/${company.companyId}/orders`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            <ReceiptText size={15} />
            Central de pedidos
          </Link>
          {company.links.adminUrl ? (
            <a
              href={company.links.adminUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 transition hover:bg-emerald-400/15"
            >
              <LayoutDashboard size={15} />
              Abrir gerencial
            </a>
          ) : null}
        </>
      }
    >
      <OwnerFeedbackBanner feedback={companyFeedback} />

      <section className="grid gap-4 xl:grid-cols-5">
        <article className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-zinc-500">
            <Building2 size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">company</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{company.slug}</p>
          <p className="mt-2 text-sm text-zinc-500">slug oficial do tenant</p>
        </article>

        <article className="rounded-[28px] border border-emerald-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-300">
            <ReceiptText size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">contrato</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{company.contract?.status ?? company.status}</p>
          <p className="mt-2 text-sm text-zinc-500">status comercial/manual</p>
        </article>

        <article className="rounded-[28px] border border-fuchsia-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <BadgeDollarSign size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">mensalidade</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">
            {formatMoney(company.contract?.monthlyPrice ?? null)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">valor acordado boca a boca</p>
        </article>

        <article className="rounded-[28px] border border-sky-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sky-300">
            <Store size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">pedidos</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{company.restaurant?.counts.orders ?? 0}</p>
          <p className="mt-2 text-sm text-zinc-500">pedidos acumulados no stack FOOD</p>
        </article>

        <article className="rounded-[28px] border border-amber-500/20 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-300">
            <Users size={15} />
            <span className="text-[11px] uppercase tracking-[0.3em]">clientes</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{company.restaurant?.counts.customers ?? 0}</p>
          <p className="mt-2 text-sm text-zinc-500">base de clientes do tenant</p>
        </article>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_680px]">
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">comercial manual</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Contrato e liberacoes</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                O fluxo de cobranca continua manual. Aqui voce registra o combinado, o vencimento e
                quais pacotes estao liberados.
              </p>

              <form action={updateCompanyStatusAction} className="mt-5 space-y-4">
                <input name="companyId" type="hidden" value={company.companyId} />
                <input name="productCode" type="hidden" value="FOOD" />
                <input name="redirectTo" type="hidden" value={`/companies/${company.companyId}`} />
                <input name="hash" type="hidden" value="commercial" />

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
                    defaultValue={company.contract?.endsAt ? company.contract.endsAt.toISOString().slice(0, 10) : ""}
                    name="endsAt"
                    type="date"
                  />
                  <input
                    className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                    defaultValue={company.contract?.monthlyPrice ? company.contract.monthlyPrice.toString() : ""}
                    name="monthlyPrice"
                    placeholder="Mensalidade"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
                    <span>Gerencial</span>
                    <input defaultChecked={company.featureAccess.adminEnabled} name="adminEnabled" type="checkbox" />
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
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  defaultValue={company.contract?.notes ?? ""}
                  name="notes"
                  placeholder="Historico comercial, promessas de pagamento, renegociacoes, suporte"
                />

                <div className="flex flex-wrap gap-3">
                  <ActionSubmitButton
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
                    pendingLabel="applying.contract.patch()"
                  >
                    apply.contract.patch()
                  </ActionSubmitButton>
                </div>
              </form>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">identity / access</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Contexto da empresa</h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">empresa</p>
                  <p className="mt-2 text-lg font-semibold text-white">{company.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{company.legalName ?? "Razao social nao informada"}</p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">contato principal</p>
                  <p className="mt-2 text-sm text-zinc-200">{company.primaryContactName ?? "--"}</p>
                  <p className="mt-1 text-sm text-zinc-500">{company.primaryContactEmail ?? "--"}</p>
                  <p className="mt-1 text-sm text-zinc-500">{company.primaryContactPhone ?? "--"}</p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">admin do tenant</p>
                  <p className="mt-2 text-sm text-zinc-200">{company.adminUser?.name ?? company.restaurant?.adminUserName ?? "--"}</p>
                  <p className="mt-1 text-sm text-zinc-500">{company.adminUser?.email ?? company.restaurant?.adminEmail ?? "--"}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    ultimo login: {formatDateTime(company.adminUser?.lastLoginAt ?? null)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    troca de senha pendente: {company.adminUser?.mustChangePassword ? "sim" : "nao"}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section id="commercial" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <article className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">operational snapshot</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Saude do stack FOOD</h2>

              {company.restaurant ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">catalogo</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{company.restaurant.counts.products}</p>
                      <p className="mt-1 text-xs text-zinc-500">produtos cadastrados</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">receita bruta</p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {formatMoney(company.restaurant.totals.grossRevenue)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">pedidos nao cancelados</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">pagos</p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {formatMoney(company.restaurant.totals.paidRevenue)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">receita confirmada</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">ultimos 30d</p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {company.restaurant.totals.last30DaysOrders}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">pedidos recentes</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-zinc-300">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">restaurante</p>
                      <p className="mt-3 font-semibold text-white">{company.restaurant.name}</p>
                      <p className="mt-1 text-zinc-500">{company.restaurant.slug}</p>
                      <p className="mt-1 text-zinc-500">
                        {company.restaurant.city ?? "--"} / {company.restaurant.state ?? "--"}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-zinc-300">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">operacao</p>
                      <p className="mt-3">loja aberta: {company.restaurant.isOpen ? "sim" : "nao"}</p>
                      <p className="mt-1">delivery: {company.restaurant.deliveryActive ? "on" : "off"}</p>
                      <p className="mt-1">pickup: {company.restaurant.pickupActive ? "on" : "off"}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-zinc-300">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">salao</p>
                      <p className="mt-3">mesas cadastradas: {company.restaurant.counts.diningTables}</p>
                      <p className="mt-1">comandas abertas: {company.restaurant.counts.openTableSessions}</p>
                      <p className="mt-1">cardapio digital: {company.featureAccess.digitalMenuEnabled ? "on" : "off"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm leading-6 text-zinc-400">
                  O tenant FOOD ainda nao foi materializado. Use o reprocessamento para forcar a
                  sincronizacao do provisionamento.
                </div>
              )}
            </article>

            <aside className="space-y-4">
              <form action={reprocessCompanyProvisionAction}>
                <input name="companyId" type="hidden" value={company.companyId} />
                <input name="productCode" type="hidden" value="FOOD" />
                <input name="redirectTo" type="hidden" value={`/companies/${company.companyId}`} />
                <input name="hash" type="hidden" value="commercial" />
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
                <input name="redirectTo" type="hidden" value={`/companies/${company.companyId}`} />
                <ActionSubmitButton
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20"
                  pendingLabel="deleting.company()"
                >
                  <Trash2 size={15} />
                  delete
                </ActionSubmitButton>
              </form>

              <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">links oficiais</p>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    <p className="text-zinc-500">app publico</p>
                    <p className="mt-2 break-all text-white">{company.links.publicUrl ?? "--"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    <p className="text-zinc-500">gerencial</p>
                    <p className="mt-2 break-all text-white">{company.links.adminUrl ?? "--"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    <p className="text-zinc-500">cardapio digital</p>
                    <p className="mt-2 break-all text-white">{company.links.digitalMenuUrl ?? "--"}</p>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>

        <CompanySystemPreview
          companyName={company.name}
          publicUrl={company.links.publicUrl}
          digitalMenuUrl={company.links.digitalMenuUrl}
          adminUrl={company.links.adminUrl}
          qrCodeUrl={company.links.digitalMenuQrCodeUrl}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">recent orders</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Pedidos recentes do tenant</h2>
            </div>
            {company.links.adminUrl ? (
              <div className="flex items-center gap-4">
                <Link
                  href={`/companies/${company.companyId}/orders`}
                  className="inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"
                >
                  Abrir central owner
                  <ArrowRight size={14} />
                </Link>
                <a
                  href={company.links.adminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-200 transition hover:text-white"
                >
                  Abrir gerencial
                  <ArrowRight size={14} />
                </a>
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {company.restaurant?.recentOrders.length ? (
              company.restaurant.recentOrders.map((order) => (
                <div key={order.id} className="rounded-[24px] border border-white/10 bg-[#080a10] px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{order.customerName}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {order.id} / {order.orderType} / {order.paymentStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatMoney(order.total)}</p>
                      <p className="mt-1 text-xs text-zinc-500">{formatDateTime(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                    {order.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
                Nenhum pedido recente para esta empresa.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[30px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">event stream</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Jobs do tenant</h2>

          <div className="mt-5 space-y-3">
            {company.provisioningJobs.length ? (
              company.provisioningJobs.map((job) => (
                <div key={job.id} className="rounded-[24px] border border-white/10 bg-[#080a10] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{job.productName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{formatDateTime(job.createdAt)}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                        provisioningStatusStyles[job.status]
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">disparado por {job.requestedByEmail ?? "owner-console"}</p>
                  {job.errorMessage ? (
                    <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                      {job.errorMessage}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
                Nenhum job encontrado para esta empresa.
              </div>
            )}
          </div>
        </article>
      </section>
    </OwnerShell>
  );
}
