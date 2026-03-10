import { AdminShell } from "../components/AdminShell";
import type { AdminSection, Metric, Order } from "../types/dashboard";

type HomeDashboardPageProps = {
  restaurantName: string;
  userName: string;
  metrics: Metric[];
  orders: Order[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
};

const shortcutCards: Array<{
  title: string;
  description: string;
  route: AdminSection;
  eyebrow: string;
}> = [
  {
    title: "Pedidos online",
    description: "Fila separada de delivery e retirada com atualizacao operacional direta.",
    route: "PedidosOnline",
    eyebrow: "Operacao",
  },
  {
    title: "Mesas",
    description: "Controle de ocupacao, comanda presencial, QR fixo e fechamento de mesa.",
    route: "Mesas",
    eyebrow: "Salao",
  },
  {
    title: "Cardapio",
    description: "Catalogo, categorias, personalizacoes e disponibilidade refletidas no app mobile.",
    route: "Cardapio",
    eyebrow: "Conteudo",
  },
  {
    title: "Ofertas",
    description: "Campanhas promocionais, prato do dia e destaque visual consumido pelo app publico.",
    route: "Ofertas",
    eyebrow: "Comercial",
  },
  {
    title: "Clientes",
    description: "Base viva de clientes e historico real de pedidos feitos pelo canal mobile.",
    route: "Clientes",
    eyebrow: "Relacionamento",
  },
];

export function HomeDashboardPage({
  restaurantName,
  userName,
  metrics,
  orders,
  onLogout,
  onNavigate,
}: HomeDashboardPageProps) {
  const recentOrders = orders.slice(0, 4);

  return (
    <AdminShell
      activeSection="Dashboard"
      restaurantName={restaurantName}
      userName={userName}
      pageTitle="Central de gestao"
      pageSubtitle="Resumo executivo do restaurante, com acesso rapido para operacao, salao, catalogo e relacionamento."
      onLogout={onLogout}
      onNavigate={onNavigate}
      aside={
        <div className="space-y-5">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Fila recente</h3>
              <button
                type="button"
                onClick={() => onNavigate("PedidosOnline")}
                className="text-xs font-semibold text-sky-600"
              >
                Abrir pedidos online
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{order.customer}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.id} • {order.time}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-900">{order.total}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <h3 className="text-sm font-semibold text-slate-900">Sincronia entre apps</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <li>Cardapio e ofertas publicados aqui abastecem o app mobile.</li>
              <li>Pedidos online entram separados das comandas de mesa.</li>
              <li>O QR fixo do cardapio digital reaproveita o mesmo cardapio do app publico.</li>
            </ul>
          </section>
        </div>
      }
    >
      <section className="panel p-5 lg:p-6">
        <div className="grid gap-4 xl:grid-cols-5">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-[22px] border border-slate-200 bg-[#fcfcfd] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{metric.value}</p>
              <p className={`mt-2 text-sm ${metric.trend === "up" ? "text-emerald-600" : "text-slate-500"}`}>
                {metric.change}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel mt-5 p-5 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Modulos principais</h2>
            <p className="mt-1 text-sm text-slate-500">
              Acesso direto as areas que movimentam o restaurante no dia a dia.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {shortcutCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => onNavigate(card.route)}
              className="rounded-[24px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-[0_18px_35px_rgba(15,23,42,0.08)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{card.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{card.description}</p>
            </button>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
