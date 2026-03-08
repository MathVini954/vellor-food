import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-card w-full max-w-xl rounded-[32px] p-8 text-center">
        <span className="inline-flex rounded-full bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
          Public App
        </span>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950">
          Abra um restaurante publico por slug
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Este app foi preparado para as rotas publicas em <code>/r/[slug]</code>, integradas com
          PostgreSQL, Prisma e envio do pedido para o WhatsApp do restaurante.
        </p>
        <div className="mt-8 rounded-3xl bg-slate-950 px-5 py-4 text-left text-sm text-slate-200">
          Exemplo: <span className="font-semibold text-white">/r/bistro-da-esquina</span>
        </div>
        <Link
          className="mt-8 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/r/exemplo"
        >
          Ver estrutura da rota
        </Link>
      </section>
    </main>
  );
}
