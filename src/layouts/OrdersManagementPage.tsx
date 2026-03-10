import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { DateField } from "../components/DateField";
import { OrderDetailsPanel } from "../components/OrderDetailsPanel";
import { OrdersManagementTable } from "../components/OrdersManagementTable";
import type { AdminSection, FeatureAccess, Order, OrderStatus } from "../types/dashboard";

type OrdersManagementPageProps = {
  restaurantName: string;
  userName: string;
  featureAccess: FeatureAccess;
  initialOrders: Order[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onAdvanceStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
};

type OrdersTab = "ativos" | "finalizados";
type PeriodFilter = "hoje" | "7dias" | "30dias" | "personalizado";

const statusFlow: Record<Exclude<OrderStatus, "Entregue" | "Cancelado">, OrderStatus> = {
  Novo: "Aceito",
  Aceito: "Em preparo",
  "Em preparo": "Enviado",
  Enviado: "Entregue",
};

const autoUpdateCandidates: OrderStatus[] = ["Novo", "Aceito", "Em preparo", "Enviado"];
const finalizedStatuses: OrderStatus[] = ["Entregue", "Cancelado"];

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(period: PeriodFilter, startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "hoje") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === "7dias") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === "30dias") {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  return {
    start: startDate ? new Date(`${startDate}T00:00:00`) : new Date("1970-01-01T00:00:00"),
    end: endDate ? new Date(`${endDate}T23:59:59`) : end,
  };
}

function formatDateLabel(value: string) {
  if (!value) {
    return "--/--/----";
  }

  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function OrdersManagementPage({
  restaurantName,
  userName,
  featureAccess,
  initialOrders,
  onLogout,
  onNavigate,
  onAdvanceStatus,
  onCancelOrder,
  onDeleteOrder,
}: OrdersManagementPageProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<OrdersTab>("ativos");
  const [period, setPeriod] = useState<PeriodFilter>("hoje");
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrders[0]?.id ?? null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(period, startDate, endDate);

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const matchesTab =
        activeTab === "ativos"
          ? !finalizedStatuses.includes(order.status)
          : finalizedStatuses.includes(order.status);

      return matchesTab && orderDate >= start && orderDate <= end;
    });
  }, [orders, activeTab, period, startDate, endDate]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !filteredOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0]?.id ?? null);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) ?? null,
    [filteredOrders, selectedOrderId],
  );

  async function handleAdvanceStatus(orderId: string) {
    const targetOrder = orders.find((order) => order.id === orderId);

    if (!targetOrder || !autoUpdateCandidates.includes(targetOrder.status)) {
      return;
    }

    const nextStatus = statusFlow[targetOrder.status as keyof typeof statusFlow];
    const previousOrders = orders;

    setActionError("");
    setPendingOrderId(orderId);
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order,
      ),
    );

    try {
      await onAdvanceStatus(orderId, nextStatus);
    } catch (error) {
      setOrders(previousOrders);
      setActionError(
        error instanceof Error ? error.message : "Nao foi possivel avancar o status do pedido.",
      );
    } finally {
      setPendingOrderId((current) => (current === orderId ? null : current));
    }
  }

  async function handleCancelOrder(orderId: string) {
    const targetOrder = orders.find((order) => order.id === orderId);

    if (!targetOrder || finalizedStatuses.includes(targetOrder.status)) {
      return;
    }

    if (!window.confirm(`Cancelar o pedido ${targetOrder.id}?`)) {
      return;
    }

    const previousOrders = orders;

    setActionError("");
    setPendingOrderId(orderId);
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: "Cancelado" } : order,
      ),
    );

    try {
      await onCancelOrder(orderId);
    } catch (error) {
      setOrders(previousOrders);
      setActionError(
        error instanceof Error ? error.message : "Nao foi possivel cancelar o pedido.",
      );
    } finally {
      setPendingOrderId((current) => (current === orderId ? null : current));
    }
  }

  async function handleDeleteOrder(orderId: string) {
    const targetOrder = orders.find((order) => order.id === orderId);

    if (!targetOrder) {
      return;
    }

    if (!window.confirm(`Excluir o pedido ${targetOrder.id} permanentemente?`)) {
      return;
    }

    const previousOrders = orders;
    const previousSelectedOrderId = selectedOrderId;

    setActionError("");
    setPendingOrderId(orderId);
    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
    setSelectedOrderId((current) => (current === orderId ? null : current));

    try {
      await onDeleteOrder(orderId);
    } catch (error) {
      setOrders(previousOrders);
      setSelectedOrderId(previousSelectedOrderId);
      setActionError(
        error instanceof Error ? error.message : "Nao foi possivel excluir o pedido.",
      );
    } finally {
      setPendingOrderId((current) => (current === orderId ? null : current));
    }
  }

  function handleViewDetails(order: Order) {
    setSelectedOrderId(order.id);
  }

  const activeCount = orders.filter((order) => !finalizedStatuses.includes(order.status)).length;
  const finalizedCount = orders.filter((order) => finalizedStatuses.includes(order.status)).length;

  return (
    <AdminShell
      activeSection="PedidosOnline"
      restaurantName={restaurantName}
      userName={userName}
      featureAccess={featureAccess}
      pageTitle="Pedidos online"
      pageSubtitle="Monitore delivery e retirada em tempo real, avance status e filtre historico por periodo."
      onLogout={onLogout}
      onNavigate={onNavigate}
      aside={<OrderDetailsPanel order={selectedOrder} />}
    >
      <section className="mb-5 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ativos")}
            className={`rounded-2xl px-4 py-3 text-left transition ${
              activeTab === "ativos" ? "bg-[#171b38] text-white" : "bg-slate-50 text-slate-600"
            }`}
          >
            <div className="text-sm font-semibold">Pedidos ativos</div>
            <div className={`mt-1 text-xs ${activeTab === "ativos" ? "text-slate-300" : "text-slate-400"}`}>
              {activeCount} em andamento
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("finalizados")}
            className={`rounded-2xl px-4 py-3 text-left transition ${
              activeTab === "finalizados" ? "bg-[#171b38] text-white" : "bg-slate-50 text-slate-600"
            }`}
          >
            <div className="text-sm font-semibold">Pedidos finalizados</div>
            <div className={`mt-1 text-xs ${activeTab === "finalizados" ? "text-slate-300" : "text-slate-400"}`}>
              {finalizedCount} encerrados
            </div>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: "hoje", label: "Hoje" },
            { value: "7dias", label: "7 dias" },
            { value: "30dias", label: "30 dias" },
            { value: "personalizado", label: "Periodo" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value as PeriodFilter)}
              className={`rounded-2xl px-4 py-2.5 text-sm transition ${
                period === option.value
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {period === "personalizado" ? (
        <section className="mb-5 rounded-[24px] border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Periodo personalizado</h3>
              <p className="mt-1 text-sm text-slate-500">
                Defina uma janela especifica para consultar pedidos finalizados ou ativos.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {formatDateLabel(startDate)} ate {formatDateLabel(endDate)}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <DateField
              label="Data inicial"
              value={startDate}
              helper="Inicio da janela de consulta"
              onChange={setStartDate}
            />
            <DateField
              label="Data final"
              value={endDate}
              helper="Encerramento da janela de consulta"
              onChange={setEndDate}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const today = toDateInputValue(new Date());
                setStartDate(today);
                setEndDate(today);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Usar hoje
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const lastWeek = new Date();
                lastWeek.setDate(now.getDate() - 6);
                setStartDate(toDateInputValue(lastWeek));
                setEndDate(toDateInputValue(now));
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Ultimos 7 dias
            </button>
          </div>
        </section>
      ) : null}

      {actionError ? (
        <section className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </section>
      ) : null}

      <OrdersManagementTable
        title={activeTab === "ativos" ? "Pedidos em andamento" : "Pedidos finalizados"}
        description={
          activeTab === "ativos"
            ? "Acompanhe os pedidos recebidos e atualize cada etapa da operacao."
            : "Consulte pedidos entregues ou cancelados e filtre o historico pelo periodo desejado."
        }
        orders={filteredOrders}
        emptyStateTitle={
          activeTab === "ativos"
            ? "Nenhum pedido ativo neste periodo"
            : "Nenhum pedido finalizado neste periodo"
        }
        emptyStateDescription="Ajuste o periodo para consultar outra faixa de pedidos."
        onAdvanceStatus={handleAdvanceStatus}
        onCancelOrder={handleCancelOrder}
        onDeleteOrder={handleDeleteOrder}
        onViewDetails={handleViewDetails}
        pendingOrderId={pendingOrderId}
      />
    </AdminShell>
  );
}
