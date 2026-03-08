import { useState } from "react";

type LoginFormProps = {
  onSubmit: (credentials: { email: string; password: string }) => Promise<boolean>;
  onCreateRestaurant?: () => void;
};

export function LoginForm({ onSubmit, onCreateRestaurant }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Preencha email e senha.");
      return;
    }

    setIsSubmitting(true);
    const isValid = await onSubmit({ email, password });
    setError(isValid ? "" : "Email ou senha invalidos");
    setIsSubmitting(false);
  }

  return (
    <section className="flex items-center justify-center px-4 py-4 sm:px-8 lg:items-start">
      <div className="panel w-full max-w-md rounded-[32px] p-7 sm:p-8">
        <div className="mb-6 space-y-3">
          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
            Acesso da operacao
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Entrar na operacao</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use as credenciais provisionadas pela plataforma para acompanhar pedidos, cardapio e operacao em tempo real.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
              type="email"
              placeholder="voce@restaurante.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) {
                  setError("");
                }
              }}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) {
                  setError("");
                }
              }}
            />
          </label>

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
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              type="button"
            >
              Esqueci minha senha
            </button>
            {onCreateRestaurant ? (
              <button
              className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
                type="button"
                onClick={onCreateRestaurant}
              >
                Criar operacao
              </button>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-400">
                Provisionamento via console da Vellor
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
