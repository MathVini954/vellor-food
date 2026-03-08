import { AdminShell } from "../components/AdminShell";
import { MetricCard } from "../components/MetricCard";
import { OrdersTable } from "../components/OrdersTable";
import type { AdminSection, Metric, Order } from "../types/dashboard";

type DashboardPageProps = {
  restaurantName: string;
  userName: string;
  metrics: Metric[];
  orders: Order[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
};

export function DashboardPage({
  restaurantName,
  userName,
  metrics,
  orders,
  onLogout,
  onNavigate,
}: DashboardPageProps) {
  return (
    <AdminShell
      activeSection="Dashboard"
      restaurantName={restaurantName}
      userName={userName}
      pageTitle="Dashboard"
      pageSubtitle="Resumo geral da operacao, com indicadores e acompanhamento rapido da fila."
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="mt-5">
        <OrdersTable orders={orders} />
      </div>
    </AdminShell>
  );
}
