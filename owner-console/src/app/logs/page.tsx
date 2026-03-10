import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleAlert, FileText } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { hasOwnerConsoleCredentialsConfigured, isOwnerConsoleAuthenticated } from "@/lib/owner-auth";
import { formatDateTime, provisioningStatusStyles, readSearchParam } from "@/lib/owner-ui";
import { listRecentProvisioningJobs } from "@/services/platform/owner-dashboard";

export default async function OwnerLogsPage({
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
  const search = readSearchParam(resolvedSearchParams.q).trim().toLowerCase();
  const jobs = await listRecentProvisioningJobs(60);

  const filteredJobs = jobs.filter((job) => {
    if (!search) {
      return true;
    }

    return [job.companyName, job.companySlug, job.productCode, job.status, job.requestedByEmail ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  return (
    <OwnerShell
      activeItem="logs"
      eyebrow="owner / logs"
      title="Logs"
      description="Acompanhe os eventos operacionais mais recentes das empresas sem abrir a tela de edição de cada uma."
      actions={
        <form
          action="/logs"
          className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
        >
          <FileText size={15} className="text-zinc-500" />
          <input
            name="q"
            defaultValue={readSearchParam(resolvedSearchParams.q)}
            placeholder="Buscar empresa, status ou email"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
        </form>
      }
    >
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <div className="border-b border-white/8 px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">event stream</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Logs de provisionamento</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Fluxo central de eventos para identificar falhas, execuções e reprocessamentos por empresa.
          </p>
        </div>

        <div className="divide-y divide-white/8">
          {filteredJobs.length ? (
            filteredJobs.map((job) => (
              <article key={job.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-medium text-white">{job.companyName}</p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${
                          provisioningStatusStyles[job.status]
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                      {job.companySlug} / {job.productCode} / {formatDateTime(job.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">disparado por {job.requestedByEmail ?? "owner-console"}</p>
                    {job.errorMessage ? (
                      <div className="mt-3 inline-flex items-start gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                        <CircleAlert size={15} className="mt-0.5 shrink-0" />
                        <span>{job.errorMessage}</span>
                      </div>
                    ) : null}
                  </div>

                  <Link
                    href={`/companies/${job.companyId}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"
                  >
                    Abrir empresa
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">
              Nenhum log encontrado para esse filtro.
            </div>
          )}
        </div>
      </section>
    </OwnerShell>
  );
}
