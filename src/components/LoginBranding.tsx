type LoginBrandingProps = {
  platformName: string;
};

export function LoginBranding({ platformName }: LoginBrandingProps) {
  return (
    <section className="relative hidden overflow-hidden rounded-[32px] bg-ink px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 bg-grid bg-[size:22px_22px] opacity-20" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-orange-400/20 to-transparent" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold">
          M
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-orange-200">Operations OS</p>
          <h1 className="text-2xl font-semibold">{platformName}</h1>
        </div>
      </div>

      <div className="relative max-w-md space-y-6">
        <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100">
          Operacao centralizada para empresa e equipe
        </span>
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold leading-tight">
            Gerencie pedidos, cardapio e operacao em um so lugar
          </h2>
          <p className="text-base leading-7 text-slate-300">
            Monitore o fluxo do dia, acompanhe a cozinha e mantenha sua equipe alinhada com uma
            interface pensada para operacao real.
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-300">Tempo medio de preparo</p>
          <strong className="mt-2 block text-3xl font-semibold">18 min</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-300">Pedidos no horario</p>
          <strong className="mt-2 block text-3xl font-semibold">96%</strong>
        </div>
      </div>
    </section>
  );
}
