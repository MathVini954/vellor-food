import { redirect } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { CompaniesWorkspace } from "@/components/companies-workspace";
import { OwnerShell } from "@/components/owner-shell";
import { hasOwnerConsoleCredentialsConfigured, isOwnerConsoleAuthenticated } from "@/lib/owner-auth";
import { readSearchParam, resolveOwnerFeedback } from "@/lib/owner-ui";
import { listManagedCompanies } from "@/services/platform/owner-dashboard";

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
  const companies = await listManagedCompanies(searchQuery);

  const mappedCompanies = companies.map((company) => ({
    id: company.id,
    companyId: company.companyId,
    name: company.name,
    slug: company.slug,
    adminEmail: company.adminEmail,
    city: company.city,
    state: company.state,
    createdAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(company.createdAt),
    contractStatus: company.contract?.status ?? "ACTIVE",
    contractStartsAt: company.contract?.startsAt
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(company.contract.startsAt)
      : "--",
    contractEndsAt: company.contract?.endsAt
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(company.contract.endsAt)
      : "--",
    monthlyPrice: company.contract?.monthlyPrice
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
          company.contract.monthlyPrice.toNumber(),
        )
      : "--",
    notes: company.contract?.notes ?? "",
    adminEnabled: company.featureAccess.adminEnabled,
    publicOrderingEnabled: company.featureAccess.publicOrderingEnabled,
    digitalMenuEnabled: company.featureAccess.digitalMenuEnabled,
    publicUrl: company.links.publicUrl,
    adminUrl: company.links.adminUrl,
    digitalMenuUrl: company.links.digitalMenuUrl,
    productsCount: company._count.products,
    ordersCount: company._count.orders,
    customersCount: company._count.customers,
  }));

  return (
    <OwnerShell
      activeItem="companies"
      eyebrow="owner / companies"
      title="Empresas"
      description="Um painel mais direto para criar, editar e acompanhar as empresas da plataforma sem excesso de blocos na tela."
      actions={
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
          <Building2 size={15} />
          <span>{mappedCompanies.length} companhia(s)</span>
          <Plus size={15} className="text-zinc-500" />
        </div>
      }
    >
      <CompaniesWorkspace companies={mappedCompanies} searchQuery={searchQuery} feedback={feedback} />
    </OwnerShell>
  );
}
