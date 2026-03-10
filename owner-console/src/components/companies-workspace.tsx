"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ExternalLink, Pencil, Plus, RadioTower, ReceiptText, Search, Trash2, X } from "lucide-react";
import { ActionSubmitButton } from "@/components/action-submit-button";
import { createCompanyAction, deleteCompanyAction, reprocessCompanyProvisionAction, updateCompanyStatusAction } from "@/app/actions";
import { formatMoney, type OwnerFeedback } from "@/lib/owner-ui";
import { OwnerFeedbackBanner } from "@/components/owner-feedback-banner";

type CompanyRow = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  adminEmail: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  contractStatus: string;
  contractStartsAt: string;
  contractEndsAt: string;
  monthlyPrice: string;
  notes: string;
  adminEnabled: boolean;
  publicOrderingEnabled: boolean;
  digitalMenuEnabled: boolean;
  publicUrl: string | null;
  adminUrl: string | null;
  digitalMenuUrl: string | null;
  productsCount: number;
  ordersCount: number;
  customersCount: number;
};

type CompaniesWorkspaceProps = {
  companies: CompanyRow[];
  searchQuery: string;
  feedback: OwnerFeedback | null;
};

function RowStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#111214] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">owner modal</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function CompaniesWorkspace({
  companies,
  searchQuery,
  feedback,
}: CompaniesWorkspaceProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const editingCompany = useMemo(
    () => companies.find((company) => company.companyId === editingCompanyId) ?? null,
    [companies, editingCompanyId],
  );

  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <div className="flex flex-col gap-4 border-b border-white/8 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">companies</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Empresas</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Lista direta das empresas da plataforma. Clique em editar para abrir o modal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <form
              action="/"
              className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <Search size={15} className="text-zinc-500" />
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Buscar por nome, slug ou email"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </form>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <Plus size={15} />
              Nova companhia
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <OwnerFeedbackBanner feedback={feedback} className="mb-4" />

          <div className="overflow-hidden rounded-[24px] border border-white/8">
            <div className="grid grid-cols-[2.1fr_1.1fr_1fr_1fr_220px] gap-4 bg-white/[0.03] px-5 py-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              <span>Empresa</span>
              <span>Status</span>
              <span>Plano</span>
              <span>Uso</span>
              <span className="text-right">Ações</span>
            </div>

            {companies.length ? (
              companies.map((company) => (
                <div
                  key={company.companyId}
                  className="grid grid-cols-[2.1fr_1.1fr_1fr_1fr_220px] gap-4 border-t border-white/8 px-5 py-5 text-sm text-zinc-300"
                >
                  <div>
                    <p className="text-base font-medium text-white">{company.name}</p>
                    <p className="mt-1 text-zinc-500">{company.slug}</p>
                    <p className="mt-1 text-zinc-500">{company.adminEmail ?? "--"}</p>
                    <p className="mt-1 text-zinc-600">
                      {company.city ?? "--"}{company.state ? ` / ${company.state}` : ""}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white">
                      {company.contractStatus}
                    </div>
                    <p className="text-zinc-500">desde {company.contractStartsAt}</p>
                    <p className="text-zinc-500">até {company.contractEndsAt}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-white">{company.monthlyPrice}</p>
                    <p className="text-zinc-500">Gerencial {company.adminEnabled ? "on" : "off"}</p>
                    <p className="text-zinc-500">App {company.publicOrderingEnabled ? "on" : "off"}</p>
                    <p className="text-zinc-500">Cardápio {company.digitalMenuEnabled ? "on" : "off"}</p>
                  </div>

                  <div className="grid gap-2">
                    <RowStat label="Produtos" value={company.productsCount} />
                    <RowStat label="Pedidos" value={company.ordersCount} />
                    <RowStat label="Clientes" value={company.customersCount} />
                  </div>

                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCompanyId(company.companyId)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <Link
                      href={`/companies/${company.companyId}/orders`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                    >
                      <ReceiptText size={14} />
                      Pedidos
                    </Link>
                    {company.adminUrl ? (
                      <a
                        href={company.adminUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                      >
                        <ExternalLink size={14} />
                        Abrir
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-sm text-zinc-500">
                Nenhuma empresa encontrada.
              </div>
            )}
          </div>
        </div>
      </section>

      {createOpen ? (
        <Modal
          title="Nova companhia"
          subtitle="Crie uma empresa FOOD com contrato manual e pacotes iniciais."
          onClose={() => setCreateOpen(false)}
        >
          <form action={createCompanyAction} className="grid gap-4">
            <input type="hidden" name="productCode" value="FOOD" />
            <input type="hidden" name="redirectTo" value="/" />

            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="companyName" placeholder="Nome da empresa" required />
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="adminName" placeholder="Responsável" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="email" placeholder="Email do admin" type="email" required />
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="primaryContactPhone" placeholder="WhatsApp" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="temporaryPassword" placeholder="Senha temporária" required />
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="monthlyPrice" placeholder="Mensalidade" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-300 outline-none" name="contractStartsAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-300 outline-none" name="contractEndsAt" type="date" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                <span>Gerencial</span>
                <input type="checkbox" name="adminEnabled" defaultChecked />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                <span>App público</span>
                <input type="checkbox" name="publicOrderingEnabled" defaultChecked />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                <span>Cardápio digital</span>
                <input type="checkbox" name="digitalMenuEnabled" />
              </label>
            </div>

            <textarea className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" name="notes" placeholder="Observações comerciais e operacionais" />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.04]">
                Cancelar
              </button>
              <ActionSubmitButton className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200" pendingLabel="Criando companhia">
                <Plus size={15} />
                Criar companhia
              </ActionSubmitButton>
            </div>
          </form>
        </Modal>
      ) : null}

      {editingCompany ? (
        <Modal
          title={`Editar ${editingCompany.name}`}
          subtitle="Atualize contrato, pacotes e atalhos operacionais da empresa."
          onClose={() => setEditingCompanyId(null)}
        >
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <RowStat label="Criada em" value={editingCompany.createdAt} />
            <RowStat label="Plano" value={editingCompany.monthlyPrice} />
            <RowStat label="Local" value={`${editingCompany.city ?? "--"}${editingCompany.state ? ` / ${editingCompany.state}` : ""}`} />
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <form action={reprocessCompanyProvisionAction}>
                <input type="hidden" name="companyId" value={editingCompany.companyId} />
                <input type="hidden" name="productCode" value="FOOD" />
                <input type="hidden" name="redirectTo" value="/" />
                <input type="hidden" name="hash" value={`company-${editingCompany.companyId}`} />
                <ActionSubmitButton className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]" pendingLabel="Reprocessando">
                  <RadioTower size={15} />
                  Reprocessar
                </ActionSubmitButton>
              </form>

              <form action={deleteCompanyAction}>
                <input type="hidden" name="companyId" value={editingCompany.companyId} />
                <input type="hidden" name="redirectTo" value="/" />
                <ActionSubmitButton className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20" pendingLabel="Excluindo">
                  <Trash2 size={15} />
                  Excluir
                </ActionSubmitButton>
              </form>
            </div>

            <form action={updateCompanyStatusAction} className="grid gap-4">
            <input type="hidden" name="companyId" value={editingCompany.companyId} />
            <input type="hidden" name="productCode" value="FOOD" />
            <input type="hidden" name="redirectTo" value="/" />
            <input type="hidden" name="hash" value={`company-${editingCompany.companyId}`} />

            <div className="grid gap-4 md:grid-cols-3">
              <select name="status" defaultValue={editingCompany.contractStatus} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="CANCELED">CANCELED</option>
              </select>
              <input name="endsAt" type="date" defaultValue={editingCompany.contractEndsAt === "--" ? "" : editingCompany.contractEndsAt.split("/").reverse().join("-")} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-300 outline-none" />
              <input name="monthlyPrice" defaultValue={editingCompany.monthlyPrice === "--" ? "" : editingCompany.monthlyPrice.replace(/[^\d,.-]/g, "")} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" placeholder="Mensalidade" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                <span>Gerencial</span>
                <input type="checkbox" name="adminEnabled" defaultChecked={editingCompany.adminEnabled} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                <span>App público</span>
                <input type="checkbox" name="publicOrderingEnabled" defaultChecked={editingCompany.publicOrderingEnabled} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                <span>Cardápio digital</span>
                <input type="checkbox" name="digitalMenuEnabled" defaultChecked={editingCompany.digitalMenuEnabled} />
              </label>
            </div>

            <textarea name="notes" defaultValue={editingCompany.notes} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-600" placeholder="Notas internas" />

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingCompanyId(null)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.04]">
                  Fechar
                </button>
                <ActionSubmitButton className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200" pendingLabel="Salvando">
                  <Building2 size={15} />
                  Salvar mudanças
                </ActionSubmitButton>
            </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
