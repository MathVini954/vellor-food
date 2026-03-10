"use client";

import { useMemo, useState } from "react";
import { ExternalLink, QrCode, RefreshCcw, Smartphone } from "lucide-react";

type CompanySystemPreviewProps = {
  companyName: string;
  publicUrl: string | null;
  digitalMenuUrl: string | null;
  adminUrl: string | null;
  qrCodeUrl: string | null;
};

type PreviewTab = "public" | "digital" | "admin";

export function CompanySystemPreview({
  companyName,
  publicUrl,
  digitalMenuUrl,
  adminUrl,
  qrCodeUrl,
}: CompanySystemPreviewProps) {
  const availableTabs = useMemo(
    () =>
      [
        publicUrl ? { id: "public" as const, label: "App publico", url: publicUrl } : null,
        digitalMenuUrl ? { id: "digital" as const, label: "Cardapio digital", url: digitalMenuUrl } : null,
        adminUrl ? { id: "admin" as const, label: "Gerencial", url: adminUrl } : null,
      ].filter(Boolean) as Array<{ id: PreviewTab; label: string; url: string }>,
    [adminUrl, digitalMenuUrl, publicUrl],
  );
  const [activeTab, setActiveTab] = useState<PreviewTab>(availableTabs[0]?.id ?? "public");
  const [reloadToken, setReloadToken] = useState(0);

  const currentTab = availableTabs.find((tab) => tab.id === activeTab) ?? availableTabs[0] ?? null;
  const isEmbeddedFrame = currentTab?.id === "public" || currentTab?.id === "digital";

  return (
    <section className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">system viewport</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Visao da empresa em contexto</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Previews embutidos do stack publico desta empresa. O gerencial abre em sessao isolada,
            mas o app publico e o cardapio digital podem ser auditados daqui.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl border px-4 py-2.5 text-sm transition ${
                currentTab?.id === tab.id
                  ? "border-emerald-400/20 bg-emerald-400/10 text-white"
                  : "border-white/8 bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="rounded-[28px] border border-white/10 bg-[#090b12] p-4">
          <div className="rounded-[26px] border border-white/10 bg-[#05070d] p-4">
            <div className="mx-auto w-full max-w-[360px] rounded-[40px] border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="mb-3 flex items-center justify-between px-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                <span>{companyName}</span>
                <span className="inline-flex items-center gap-1">
                  <Smartphone size={12} />
                  live
                </span>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white">
                {currentTab ? (
                  isEmbeddedFrame ? (
                    <iframe
                      key={`${currentTab.id}-${reloadToken}`}
                      title={`${companyName} - ${currentTab.label}`}
                      src={currentTab.url}
                      className="h-[720px] w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex h-[720px] flex-col justify-between bg-[linear-gradient(180deg,#0a0d14_0%,#090c11_100%)] p-6 text-white">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">gerencial</p>
                        <h3 className="mt-3 text-2xl font-semibold">Sessao administrativa isolada</h3>
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          O gerencial usa autenticacao propria do tenant. Por isso, o preview
                          embutido pode depender da sessao ativa no navegador.
                        </p>
                      </div>

                      <div className="rounded-[26px] border border-white/10 bg-black/35 p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">target</p>
                        <p className="mt-3 break-all text-sm text-zinc-200">{currentTab.url}</p>
                        <a
                          href={currentTab.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                        >
                          <ExternalLink size={15} />
                          Abrir gerencial
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex h-[720px] items-center justify-center bg-[linear-gradient(180deg,#0a0d14_0%,#090c11_100%)] p-6 text-center text-sm text-zinc-400">
                    Nenhum endpoint visual disponivel para este tenant.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">active target</p>
            <p className="mt-3 text-lg font-semibold text-white">{currentTab?.label ?? "Sem preview"}</p>
            <p className="mt-2 break-all text-sm leading-6 text-zinc-400">{currentTab?.url ?? "--"}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              {currentTab ? (
                <>
                  <button
                    type="button"
                    onClick={() => setReloadToken((current) => current + 1)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
                  >
                    <RefreshCcw size={15} />
                    Recarregar
                  </button>
                  <a
                    href={currentTab.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 transition hover:bg-emerald-400/15"
                  >
                    <ExternalLink size={15} />
                    Abrir externo
                  </a>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-zinc-300">
              <QrCode size={16} className="text-emerald-300" />
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">qr / mesa</p>
            </div>

            {qrCodeUrl ? (
              <div className="mt-4 rounded-[22px] border border-white/8 bg-white px-4 py-5">
                <img
                  src={qrCodeUrl}
                  alt={`QR code do cardapio digital de ${companyName}`}
                  className="mx-auto h-52 w-52 rounded-3xl"
                />
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm leading-6 text-zinc-400">
                O QR so aparece quando o pacote de cardapio digital esta ativo e o tenant ja possui
                token fixo.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
