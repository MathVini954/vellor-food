import { useState } from "react";
import { LoginBranding } from "../components/LoginBranding";
import { FormSelect } from "../components/FormSelect";
import type { CreateRestaurantPayload } from "../services/adminApi";

type CreateRestaurantPageProps = {
  platformName: string;
  onBackToLogin: () => void;
  onCreateRestaurant: (payload: CreateRestaurantPayload) => Promise<boolean>;
};

const brazilStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export function CreateRestaurantPage({
  platformName,
  onBackToLogin,
  onCreateRestaurant,
}: CreateRestaurantPageProps) {
  const [form, setForm] = useState<CreateRestaurantPayload>({
    restaurantName: "",
    whatsapp: "",
    adminName: "",
    email: "",
    password: "",
    address: "",
    city: "",
    state: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (Object.values(form).some((value) => !String(value).trim())) {
      setError("Preencha todos os campos para criar o restaurante.");
      return;
    }

    setIsSubmitting(true);
    const success = await onCreateRestaurant(form);
    if (!success) {
      setError("Nao foi possivel criar o restaurante com esses dados.");
    }
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <LoginBranding platformName={platformName} />

        <section className="flex items-center justify-center px-4 py-4 sm:px-8 lg:items-start">
          <div className="panel w-full max-w-xl rounded-[32px] p-7 sm:p-8">
            <div className="mb-6 space-y-3">
              <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                Novo restaurante
              </span>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">Criar restaurante</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Cadastre a operacao inicial para entrar no painel e configurar cardapio, ofertas e pedidos.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Nome do restaurante</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.restaurantName}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, restaurantName: event.target.value }));
                      if (error) setError("");
                    }}
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

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nome do responsavel</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    value={form.adminName}
                    onChange={(event) => setForm((current) => ({ ...current, adminName: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">E-mail</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Senha</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
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
                  <FormSelect
                    value={form.state}
                    onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {brazilStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </FormSelect>
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
                {isSubmitting ? "Criando restaurante..." : "Criar restaurante e entrar"}
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
