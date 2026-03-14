import { useMemo } from "react";
import { AdminShell } from "../components/AdminShell";
import type {
  AdminSection,
  Customer,
  FeatureAccess,
  Metric,
  Order,
} from "../types/dashboard";

type HomeDashboardPageProps = {
  restaurantName: string;
  userName: string;
  featureAccess: FeatureAccess;
  metrics: Metric[];
  orders: Order[];
  tableOrders: Order[];
  customers: Customer[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
};

type RevenuePoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

type CustomerInsight = {
  name: string;
  locality: string;
  revenue: number;
  orders: number;
  lastOrderAt: Date | null;
};

type ItemInsight = {
  name: string;
  quantity: number;
  orderCount: number;
  share: number;
};

const finalizedStatuses = new Set(["Entregue", "Cancelado"]);

const shortcutCards: Array<{
  title: string;
  description: string;
  route: AdminSection;
  eyebrow: string;
}> = [
  {
    title: "Pedidos online",
    description: "Abrir a fila de delivery e retirada com as atualizacoes em tempo real.",
    route: "PedidosOnline",
    eyebrow: "Operacao",
  },
  {
    title: "Mesas",
    description: "Conferir comandas presenciais, QR fixo e mesas em andamento.",
    route: "Mesas",
    eyebrow: "Salao",
  },
  {
    title: "Cardapio",
    description: "Ajustar itens, categorias e disponibilidade sem sair da mesma linguagem visual.",
    route: "Cardapio",
    eyebrow: "Conteudo",
  },
  {
    title: "Clientes",
    description: "Acessar historico, recorrencia e relacionamento da base digital.",
    route: "Clientes",
    eyebrow: "Relacionamento",
  },
];

export function HomeDashboardPage({
  restaurantName,
  userName,
  featureAccess,
  metrics,
  orders,
  tableOrders,
  customers,
  onLogout,
  onNavigate,
}: HomeDashboardPageProps) {
  const allOrders = useMemo(
    () =>
      [...orders, ...tableOrders].sort(
        (left, right) => parseOrderDate(right).getTime() - parseOrderDate(left).getTime(),
      ),
    [orders, tableOrders],
  );

  const insights = useMemo(() => buildDashboardInsights(allOrders, customers), [allOrders, customers]);
  const visibleShortcutCards = shortcutCards.filter((card) =>
    card.route === "Mesas" ? featureAccess.digitalMenuEnabled : true,
  );

  return (
    <AdminShell
      activeSection="Dashboard"
      restaurantName={restaurantName}
      userName={userName}
      featureAccess={featureAccess}
      pageTitle="Central gerencial"
      pageSubtitle="Receita da semana, leitura operacional e destaques do restaurante numa estrutura mais clean."
      onLogout={onLogout}
      onNavigate={onNavigate}
      aside={
        <div className="space-y-5">
          <section className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Fila recente</p>
                <h3 className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
                  Ultimos pedidos recebidos
                </h3>
              </div>
              <button type="button" onClick={() => onNavigate("PedidosOnline")} className="action-secondary !px-3 !py-2 !text-xs">
                Abrir fila
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {insights.recentOrders.length ? (
                insights.recentOrders.map((order) => (
                  <article
                    key={`${order.channel}-${order.id}`}
                    className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">
                          {order.customer}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                          {order.id} / {order.time}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          order.channel === "TABLE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                        }`}
                      >
                        {order.channel === "TABLE" ? "Mesa" : "Online"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-[color:var(--text-muted)]">{order.status}</span>
                      <span className="text-sm font-semibold text-[color:var(--text-strong)]">{order.total}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border-soft)] px-4 py-10 text-center text-sm text-[color:var(--text-muted)]">
                  Nenhum pedido recente para exibir.
                </div>
              )}
            </div>
          </section>

          <section className="panel p-5">
            <p className="section-label">Radar do dia</p>
            <div className="mt-4 space-y-3">
              {metrics.length ? (
                metrics.slice(0, 4).map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between gap-4 rounded-[22px] border border-[color:var(--border-soft)] bg-white/78 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">{metric.label}</p>
                      <p className="mt-1 truncate text-xs text-[color:var(--text-muted)]">{metric.change}</p>
                    </div>
                    <p className="shrink-0 text-base font-semibold text-[color:var(--text-strong)]">{metric.value}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
                  Os indicadores resumidos vao aparecer aqui.
                </div>
              )}
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Acesso rapido</p>
                <h3 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">Modulos principais</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {visibleShortcutCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => onNavigate(card.route)}
                  className="rounded-[22px] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4 text-left transition hover:-translate-y-[1px] hover:border-[color:var(--border-strong)] hover:bg-white"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                    {card.eyebrow}
                  </p>
                  <h4 className="mt-3 text-base font-semibold text-[color:var(--text-strong)]">{card.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{card.description}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Receita semanal"
          value={formatCurrency(insights.weekRevenue)}
          detail={insights.weekComparisonLabel}
          accent="accent"
        />
        <KpiCard
          title="Receita diaria"
          value={formatCurrency(insights.dayRevenue)}
          detail={`Base em ${insights.referenceLabel}`}
          accent="green"
        />
        <KpiCard
          title="Ticket medio"
          value={formatCurrency(insights.averageTicket)}
          detail={`${insights.totalOrders} pedidos analisados`}
        />
        <KpiCard
          title="Pedidos em andamento"
          value={String(insights.activeOrders)}
          detail={`${insights.dayOrders} pedidos no dia base`}
        />
      </section>

      <section className="panel mt-5 p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="section-label">Grafico principal</p>
            <h2 className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
              Vendas da semana
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
              Para acompanhar tendencia, o melhor grafico aqui e uma linha com area preenchida. Ela mostra o ritmo de faturamento nos ultimos 7 dias sem poluir a leitura.
            </p>
          </div>
          <div className="panel-muted flex flex-wrap items-center gap-4 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                Canal online
              </p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(insights.onlineRevenue)}
              </p>
            </div>
            <div className="h-8 w-px bg-[color:var(--border-soft)]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                Canal mesas
              </p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(insights.tableRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
          <div className="panel-muted p-4 sm:p-5">
            <SalesTrendChart data={insights.weekSeries} />
          </div>

          <div className="space-y-4">
            <section className="panel-muted p-5">
              <p className="section-label">Distribuicao</p>
              <h3 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">Participacao por canal</h3>
              <div className="mt-5 space-y-4">
                <ChannelShareRow
                  label="Pedidos online"
                  value={insights.onlineRevenue}
                  total={insights.weekRevenue}
                  tone="accent"
                />
                <ChannelShareRow
                  label="Pedidos de mesa"
                  value={insights.tableRevenue}
                  total={insights.weekRevenue}
                  tone="green"
                />
              </div>
            </section>

            <section className="panel-muted p-5">
              <p className="section-label">Ritmo operacional</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <StatChip label="Pedidos ativos" value={String(insights.activeOrders)} />
                <StatChip label="Clientes no ranking" value={String(insights.topCustomers.length)} />
                <StatChip label="Itens em destaque" value={String(insights.topItems.length)} />
                <StatChip label="Atualizado ate" value={insights.referenceLabel} />
              </div>
            </section>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="panel p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Relacionamento</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">
                Principais clientes
              </h2>
            </div>
            <button type="button" onClick={() => onNavigate("Clientes")} className="action-secondary !px-3 !py-2 !text-xs">
              Abrir clientes
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {insights.topCustomers.length ? (
              insights.topCustomers.map((customer, index) => (
                <article
                  key={`${customer.name}-${index}`}
                  className="flex items-center gap-4 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-4 py-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d9b7a8,#b75d3e)] text-sm font-semibold text-white">
                    {customer.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((value) => value[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{customer.name}</h3>
                      <span className="rounded-full bg-white/84 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--text-muted)]">
                        {customer.orders} pedido(s)
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-[color:var(--text-muted)]">
                      {customer.locality} / ultimo pedido {formatOptionalDate(customer.lastOrderAt)}
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-white/80">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#d38664,#b75d3e)]"
                        style={{ width: `${Math.max(18, (customer.revenue / insights.topCustomerRevenueMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[color:var(--text-strong)]">
                      {formatCurrency(customer.revenue)}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">Receita acumulada</p>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="Os clientes mais relevantes vao aparecer aqui quando houver pedidos no periodo." />
            )}
          </div>
        </section>

        <section className="panel p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Produtos</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">
                Principais saidas
              </h2>
            </div>
            <button type="button" onClick={() => onNavigate("Cardapio")} className="action-secondary !px-3 !py-2 !text-xs">
              Abrir cardapio
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {insights.topItems.length ? (
              insights.topItems.map((item, index) => (
                <article
                  key={`${item.name}-${index}`}
                  className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[color:var(--text-strong)]">{item.name}</h3>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                        {item.orderCount} pedido(s) com este item
                      </p>
                    </div>
                    <div className="rounded-full bg-white/84 px-3 py-1.5 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {item.quantity} un.
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#2f6c60,#58a08f)]"
                      style={{ width: `${Math.max(12, item.share * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-[color:var(--text-muted)]">Participacao no volume vendido</span>
                    <span className="text-xs font-semibold text-[color:var(--text-strong)]">
                      {Math.round(item.share * 100)}%
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="Assim que houver itens vendidos, o ranking de saidas vai aparecer aqui." />
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function KpiCard({
  title,
  value,
  detail,
  accent = "neutral",
}: {
  title: string;
  value: string;
  detail: string;
  accent?: "neutral" | "accent" | "green";
}) {
  const accentClass =
    accent === "accent"
      ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
      : accent === "green"
        ? "bg-[color:var(--accent-green-soft)] text-[color:var(--accent-green)]"
        : "bg-white/80 text-[color:var(--text-muted)]";

  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--text-muted)]">{title}</p>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${accentClass}`}>Live</span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-[color:var(--text-strong)]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">{detail}</p>
    </article>
  );
}

function SalesTrendChart({ data }: { data: RevenuePoint[] }) {
  if (!data.length) {
    return <EmptyState text="Sem vendas suficientes para desenhar o grafico da semana." />;
  }

  const width = 680;
  const height = 250;
  const paddingX = 32;
  const paddingTop = 24;
  const paddingBottom = 32;
  const maxValue = Math.max(...data.map((point) => point.revenue), 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;
  const points = data.map((point, index) => {
    const x = paddingX + (usableWidth / Math.max(data.length - 1, 1)) * index;
    const y = paddingTop + usableHeight - (point.revenue / maxValue) * usableHeight;

    return {
      ...point,
      x,
      y,
    };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="sales-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(183, 93, 62, 0.24)" />
            <stop offset="100%" stopColor="rgba(183, 93, 62, 0)" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = paddingTop + usableHeight - usableHeight * tick;

          return (
            <line
              key={tick}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="rgba(129, 94, 72, 0.12)"
              strokeDasharray="6 8"
            />
          );
        })}

        <path d={areaPath} fill="url(#sales-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="var(--accent)" strokeWidth="2" />
            <text
              x={point.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-soft)"
              fontWeight="600"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {data.slice(-3).map((point) => (
          <div key={point.key} className="rounded-[20px] border border-[color:var(--border-soft)] bg-white/78 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
              {point.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
              {formatCurrency(point.revenue)}
            </p>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">{point.orders} pedido(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelShareRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "accent" | "green";
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const gradient =
    tone === "accent"
      ? "linear-gradient(90deg,#d38664,#b75d3e)"
      : "linear-gradient(90deg,#2f6c60,#58a08f)";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[color:var(--text-strong)]">{label}</span>
        <span className="text-sm text-[color:var(--text-muted)]">{formatCurrency(value)}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/84">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(8, percentage)}%`,
            background: gradient,
          }}
        />
      </div>
      <p className="mt-2 text-xs text-[color:var(--text-muted)]">{Math.round(percentage)}% da receita semanal</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[color:var(--border-soft)] bg-white/78 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[color:var(--border-soft)] px-4 py-10 text-center text-sm text-[color:var(--text-muted)]">
      {text}
    </div>
  );
}

function buildDashboardInsights(orders: Order[], customers: Customer[]) {
  const referenceDate = orders.length ? parseOrderDate(orders[0]) : new Date();
  const endDate = startOfDay(referenceDate);
  const weekSeries = buildRevenueSeries(orders, endDate);
  const previousWeekRevenue = sumRevenueBetween(
    orders,
    addDays(endDate, -13),
    addDays(endDate, -7),
  );
  const weekRevenue = weekSeries.reduce((total, point) => total + point.revenue, 0);
  const dayRevenue = weekSeries[weekSeries.length - 1]?.revenue ?? 0;
  const dayOrders = weekSeries[weekSeries.length - 1]?.orders ?? 0;
  const totalRevenue = orders.reduce((total, order) => total + parseCurrencyValue(order.total), 0);
  const activeOrders = orders.filter((order) => !finalizedStatuses.has(order.status)).length;
  const averageTicket = orders.length ? totalRevenue / orders.length : 0;
  const customerDirectory = new Map(customers.map((customer) => [customer.name.toLowerCase(), customer]));
  const topCustomers = buildTopCustomers(orders, customerDirectory);
  const topItems = buildTopItems(orders);
  const onlineRevenue = orders
    .filter((order) => order.channel === "ONLINE")
    .reduce((total, order) => total + parseCurrencyValue(order.total), 0);
  const tableRevenue = orders
    .filter((order) => order.channel === "TABLE")
    .reduce((total, order) => total + parseCurrencyValue(order.total), 0);

  return {
    referenceLabel: formatDashboardDate(endDate),
    weekSeries,
    weekRevenue,
    previousWeekRevenue,
    weekComparisonLabel: buildComparisonLabel(weekRevenue, previousWeekRevenue),
    dayRevenue,
    dayOrders,
    totalOrders: orders.length,
    totalRevenue,
    averageTicket,
    activeOrders,
    recentOrders: orders.slice(0, 4),
    topCustomers,
    topCustomerRevenueMax: Math.max(...topCustomers.map((customer) => customer.revenue), 1),
    topItems,
    onlineRevenue,
    tableRevenue,
  };
}

function buildRevenueSeries(orders: Order[], endDate: Date) {
  const points: RevenuePoint[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const currentDate = addDays(endDate, -index);
    const currentKey = toDayKey(currentDate);
    const ordersForDay = orders.filter((order) => toDayKey(parseOrderDate(order)) === currentKey);

    points.push({
      key: currentKey,
      label: formatWeekday(currentDate),
      revenue: ordersForDay.reduce((total, order) => total + parseCurrencyValue(order.total), 0),
      orders: ordersForDay.length,
    });
  }

  return points;
}

function buildTopCustomers(
  orders: Order[],
  customerDirectory: Map<string, Customer>,
) {
  const grouped = new Map<string, CustomerInsight>();

  for (const order of orders) {
    const key = order.customer.toLowerCase();
    const customer = customerDirectory.get(key);
    const current = grouped.get(key) ?? {
      name: order.customer,
      locality: customer?.locality ?? "Cliente recorrente",
      revenue: 0,
      orders: 0,
      lastOrderAt: null,
    };
    const orderDate = parseOrderDate(order);

    current.revenue += parseCurrencyValue(order.total);
    current.orders += 1;
    current.lastOrderAt =
      !current.lastOrderAt || orderDate.getTime() > current.lastOrderAt.getTime()
        ? orderDate
        : current.lastOrderAt;
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .sort((left, right) => right.revenue - left.revenue || right.orders - left.orders)
    .slice(0, 5);
}

function buildTopItems(orders: Order[]) {
  const grouped = new Map<string, { quantity: number; orderIds: Set<string> }>();
  let totalQuantity = 0;

  for (const order of orders) {
    for (const item of order.items) {
      const current = grouped.get(item.name) ?? { quantity: 0, orderIds: new Set<string>() };
      current.quantity += item.quantity;
      current.orderIds.add(order.id);
      grouped.set(item.name, current);
      totalQuantity += item.quantity;
    }
  }

  return [...grouped.entries()]
    .map(([name, value]) => ({
      name,
      quantity: value.quantity,
      orderCount: value.orderIds.size,
      share: totalQuantity > 0 ? value.quantity / totalQuantity : 0,
    }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5);
}

function buildComparisonLabel(currentValue: number, previousValue: number) {
  if (previousValue <= 0) {
    return "Sem base anterior suficiente para comparar";
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const prefix = delta >= 0 ? "+" : "";

  return `${prefix}${delta.toFixed(1)}% vs 7 dias anteriores`;
}

function parseCurrencyValue(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOrderDate(order: Order) {
  const parsed = new Date(order.createdAt);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function sumRevenueBetween(orders: Order[], startDate: Date, endDate: Date) {
  const startTime = startOfDay(startDate).getTime();
  const endTime = endOfDay(endDate).getTime();

  return orders.reduce((total, order) => {
    const orderTime = parseOrderDate(order).getTime();

    if (orderTime < startTime || orderTime > endTime) {
      return total;
    }

    return total + parseCurrencyValue(order.total);
  }, 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDashboardDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(value);
}

function formatOptionalDate(value: Date | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatWeekday(value: Date) {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return labels[value.getDay()] ?? "--";
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfDay(value: Date) {
  const nextDate = new Date(value);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDay(value: Date) {
  const nextDate = new Date(value);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function toDayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
