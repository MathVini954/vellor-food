import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import { ShieldCheck, TerminalSquare } from "lucide-react";
import { hasOwnerConsoleCredentialsConfigured } from "@/lib/owner-auth";
import { loginOwnerAction } from "../auth-actions";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const errorMessages = {
  invalid: "Credenciais invalidas para o console do dono.",
  "not-configured":
    "Console do dono ainda nao configurado. Defina as variaveis OWNER_CONSOLE_*.",
} as const;

export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: keyof typeof errorMessages }>;
}) {
  const ownerConsoleUrl = process.env.OWNER_CONSOLE_URL?.trim();

  if (ownerConsoleUrl) {
    redirect(`${ownerConsoleUrl.replace(/\/$/, "")}/login`);
  }

  const { error } = await searchParams;
  const isConfigured = hasOwnerConsoleCredentialsConfigured();

  return (
    <main
      className={`${plexMono.className} flex min-h-screen items-center justify-center bg-[#010101] px-4 text-zinc-100`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 18%), radial-gradient(circle at bottom right, rgba(120,120,120,0.12), transparent 20%), linear-gradient(180deg, #050505 0%, #010101 58%, #000000 100%)",
      }}
    >
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-black/85 shadow-[0_30px_100px_rgba(0,0,0,0.55)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <TerminalSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
                Vellor Console
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                owner access
              </p>
            </div>
          </div>

          <div className="mt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-zinc-300">
              <ShieldCheck size={14} />
              acesso restrito
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white">
              Console isolado para provisionar e controlar empresas.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">
              Esse painel concentra criacao de empresas, status contratual e onboarding
              inicial. O acesso agora deve ser feito por login, sem token na URL.
            </p>
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">owner.login()</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Entrar no console</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Use as credenciais privadas do dono da plataforma.
          </p>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-100">
              Defina `OWNER_CONSOLE_EMAIL` e `OWNER_CONSOLE_PASSWORD` ou
              `OWNER_CONSOLE_PASSWORD_HASH` nas variaveis do `public-app`.
            </div>
          ) : null}

          {error && errorMessages[error] ? (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
              {errorMessages[error]}
            </div>
          ) : null}

          <form action={loginOwnerAction} className="mt-6 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              name="email"
              placeholder="owner@email.com"
              type="email"
              required
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              name="password"
              placeholder="owner.password"
              type="password"
              required
            />
            <button
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              type="submit"
              disabled={!isConfigured}
            >
              entrar.console()
            </button>
          </form>

          <Link
            href="/"
            className="mt-4 inline-flex text-xs uppercase tracking-[0.26em] text-zinc-500 transition hover:text-zinc-300"
          >
            voltar para o public-app
          </Link>
        </div>
      </section>
    </main>
  );
}
