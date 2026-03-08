import { useState } from "react";
import { LoginBranding } from "../components/LoginBranding";
import type { AdminInitialSetup } from "../types/dashboard";
import type { CompleteInitialSetupPayload } from "../services/adminApi";

type InitialSetupPageProps = {
  setup: AdminInitialSetup;
  onSubmit: (payload: CompleteInitialSetupPayload) => Promise<string | null>;
  onBackToLogin: () => void;
};

export function InitialSetupPage({ setup, onSubmit, onBackToLogin }: InitialSetupPageProps) {
  const [form, setForm] = useState<CompleteInitialSetupPayload>({
    companyName: setup.companyName,
    adminName: setup.adminName,
    whatsapp: setup.whatsapp,
    address: setup.address,
    city: setup.city,
    state: setup.state,
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (Object.values(form).some((value) => !String(value).trim())) {
      setError("Preencha todos os campos para concluir o cadastro inicial.");
      return;
    }

    if (form.password.trim().length < 6) {
      setError("Defina uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setIsSubmitting(true);
    const nextError = await onSubmit(form);
    setError(nextError ?? "");
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <LoginBranding platformName="MesaPilot Gestao" />

        <section className="flex items-center justify-center px-4 py-4 sm:px-8 lg:items-start">
          <div className="panel w-full max-w-xl rounded-[32px] p-7 sm:p-8">
            <div className="mb-6 space-y-3">
              <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                Cadastro inicial da empresa
              </span>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">Concluir primeiro acesso</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Atualize a senha e confirme os dados operacionais basicos para liberar o painel.
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Conta provisionada</p>
                <strong className="mt-2 block text-xl font-semibold text-slate-900">
                  {setup.companyName}
                </strong>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Login inicial</p>
                <strong className="mt-2 block text-lg font-semibold text-slate-900">
                  {setup.adminEmail}
                </strong>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Empresa</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.companyName}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, companyName: event.target.value }));
                      if (error) {
                        setError("");
                      }
                    }}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Responsavel</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.adminName}
                    onChange={(event) => setForm((current) => ({ ...current, adminName: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">WhatsApp</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.whatsapp}
                    onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Endereco base</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Cidade</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">UF</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 uppercase outline-none transition focus:border-orange-400 focus:bg-white"
                    maxLength={2}
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, state: event.target.value.toUpperCase() }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nova senha</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Confirmar senha</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <button
                className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Finalizando setup..." : "Salvar dados e entrar"}
              </button>

              <button
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                type="button"
                onClick={onBackToLogin}
              >
                Voltar para login
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
