import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { StatusBadge } from "../components/StatusBadge";
import type {
  AdminSection,
  DiningTable,
  FeatureAccess,
  Order,
  OrderStatus,
  TableSession,
} from "../types/dashboard";

type EditableDiningTable = {
  id?: string;
  identifier: string;
  label: string;
  area: string;
  seats: number | null;
  isActive: boolean;
};

type TablesManagementPageProps = {
  restaurantName: string;
  userName: string;
  featureAccess: FeatureAccess;
  diningTables: DiningTable[];
  tableSessions: TableSession[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onSaveTables: (tables: EditableDiningTable[]) => Promise<void>;
  onAdvanceStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCloseSession: (sessionId: string) => Promise<void>;
  onTransferSession: (sessionId: string, targetTableId: string) => Promise<void>;
  onMergeSession: (sessionId: string, targetSessionId: string) => Promise<void>;
};

const tableNextStatusMap: Record<Exclude<OrderStatus, "Entregue" | "Cancelado">, OrderStatus> = {
  Novo: "Em preparo",
  Aceito: "Em preparo",
  "Em preparo": "Enviado",
  Enviado: "Entregue",
};

function createEmptyTableRow(): EditableDiningTable {
  return {
    identifier: "",
    label: "",
    area: "",
    seats: 4,
    isActive: true,
  };
}

export function TablesManagementPage({
  restaurantName,
  userName,
  featureAccess,
  diningTables,
  tableSessions,
  onLogout,
  onNavigate,
  onSaveTables,
  onAdvanceStatus,
  onCancelOrder,
  onDeleteOrder,
  onCloseSession,
  onTransferSession,
  onMergeSession,
}: TablesManagementPageProps) {
  const [tableRows, setTableRows] = useState<EditableDiningTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [savingTables, setSavingTables] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [transferTargetTableId, setTransferTargetTableId] = useState("");
  const [mergeTargetSessionId, setMergeTargetSessionId] = useState("");

  useEffect(() => {
    setTableRows(
      diningTables.map((table) => ({
        id: table.id,
        identifier: table.identifier,
        label: table.label,
        area: table.area,
        seats: table.seats,
        isActive: table.isActive,
      })),
    );

    if (!selectedTableId || diningTables.some((table) => table.id === selectedTableId)) {
      return;
    }

    setSelectedTableId(diningTables[0]?.id ?? null);
  }, [diningTables, selectedTableId]);

  const selectedTable = useMemo(
    () => diningTables.find((table) => table.id === selectedTableId) ?? null,
    [diningTables, selectedTableId],
  );
  const selectedSession = useMemo(
    () =>
      selectedTable?.openSessionId
        ? tableSessions.find((session) => session.id === selectedTable.openSessionId) ?? null
        : null,
    [selectedTable, tableSessions],
  );

  useEffect(() => {
    setTransferTargetTableId("");
    setMergeTargetSessionId("");
  }, [selectedSession?.id]);

  const availableTransferTables = diningTables.filter(
    (table) => table.id !== selectedTable?.id && table.status === "Livre" && table.isActive,
  );
  const availableMergeSessions = tableSessions.filter(
    (session) => session.id !== selectedSession?.id && session.status === "Aberta",
  );
  const qrCodeUrl = featureAccess.digitalMenuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(featureAccess.digitalMenuUrl)}`
    : null;

  async function handleCopyLink() {
    if (!featureAccess.digitalMenuUrl) {
      return;
    }

    await navigator.clipboard.writeText(featureAccess.digitalMenuUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleSaveTableLayout() {
    setActionError("");
    setSavingTables(true);

    try {
      await onSaveTables(tableRows);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Nao foi possivel salvar a distribuicao de mesas.",
      );
    } finally {
      setSavingTables(false);
    }
  }

  async function handleAdvanceOrder(order: Order) {
    const nextStatus = tableNextStatusMap[order.status as keyof typeof tableNextStatusMap];

    if (!nextStatus) {
      return;
    }

    setActionError("");
    setPendingActionId(order.id);

    try {
      await onAdvanceStatus(order.id, nextStatus);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Falha ao atualizar o pedido.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleCancelOrder(orderId: string) {
    setActionError("");
    setPendingActionId(orderId);

    try {
      await onCancelOrder(orderId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Falha ao cancelar o pedido.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleDeleteOrder(orderId: string) {
    setActionError("");
    setPendingActionId(orderId);

    try {
      await onDeleteOrder(orderId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Falha ao excluir o pedido.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleCloseSession() {
    if (!selectedSession) {
      return;
    }

    setActionError("");
    setPendingActionId(selectedSession.id);

    try {
      await onCloseSession(selectedSession.id);
      setSelectedTableId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Falha ao encerrar a comanda.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleTransferSession() {
    if (!selectedSession || !transferTargetTableId) {
      return;
    }

    setActionError("");
    setPendingActionId(selectedSession.id);

    try {
      await onTransferSession(selectedSession.id, transferTargetTableId);
      setSelectedTableId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Falha ao transferir a comanda.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleMergeSession() {
    if (!selectedSession || !mergeTargetSessionId) {
      return;
    }

    setActionError("");
    setPendingActionId(selectedSession.id);

    try {
      await onMergeSession(selectedSession.id, mergeTargetSessionId);
      setSelectedTableId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Falha ao mesclar a comanda.");
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <AdminShell
      activeSection="Mesas"
      restaurantName={restaurantName}
      userName={userName}
      featureAccess={featureAccess}
      pageTitle="Gestao de mesas"
      pageSubtitle="Controle de comanda presencial, link fixo do cardapio digital e distribuicao das mesas."
      onLogout={onLogout}
      onNavigate={onNavigate}
      aside={
        <div className="space-y-5">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Cardapio digital
            </p>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">
              {featureAccess.digitalMenuEnabled ? "Link estavel liberado" : "Pacote desativado"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {featureAccess.digitalMenuEnabled
                ? "Use este link e QR fixos para impressao nas mesas. Eles nao dependem do slug do restaurante."
                : "Ative o pacote no owner para liberar o cardapio de mesa e o QR fixo."}
            </p>

            {featureAccess.digitalMenuUrl ? (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                <p className="break-all font-medium text-slate-900">{featureAccess.digitalMenuUrl}</p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-3 rounded-2xl bg-[#111827] px-4 py-2 text-xs font-semibold text-white"
                >
                  {copied ? "Link copiado" : "Copiar link"}
                </button>
              </div>
            ) : null}

            {qrCodeUrl ? (
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <img className="mx-auto h-44 w-44 rounded-2xl" src={qrCodeUrl} alt="QR code do cardapio digital" />
              </div>
            ) : null}
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Pacotes
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Gerencial: {featureAccess.adminEnabled ? "Liberado" : "Bloqueado"}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                App mobile: {featureAccess.publicOrderingEnabled ? "Liberado" : "Bloqueado"}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Cardapio digital: {featureAccess.digitalMenuEnabled ? "Liberado" : "Bloqueado"}
              </div>
            </div>
          </section>
        </div>
      }
    >
      {actionError ? (
        <section className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_35px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Mapa das mesas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada quadrado representa uma mesa configurada. Clique para abrir a comanda.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            {diningTables.filter((table) => table.status === "Ocupada").length} ocupadas / {diningTables.length} totais
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {diningTables.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => setSelectedTableId(table.id)}
              className={`rounded-[26px] border p-5 text-left transition ${
                table.status === "Ocupada"
                  ? "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300"
                  : "border-slate-200 bg-[#fcfcfd] hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{table.identifier}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">{table.label}</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    table.status === "Ocupada"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pedidos</p>
                  <p className="mt-2 font-semibold text-slate-900">{table.orderCount}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total</p>
                  <p className="mt-2 font-semibold text-slate-900">{table.total}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                {table.area || "Sem area definida"}
                {table.seats ? ` • ${table.seats} lugares` : ""}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_35px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Distribuicao das mesas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ajuste nome, identificador, area e lugares de cada mesa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTableRows((current) => [...current, createEmptyTableRow()])}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Adicionar mesa
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {tableRows.map((table, index) => (
            <div
              key={`${table.id ?? "new"}-${index}`}
              className="grid gap-3 rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-4 xl:grid-cols-[140px_1.2fr_1fr_110px_120px_72px]"
            >
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Identificador"
                value={table.identifier}
                onChange={(event) =>
                  setTableRows((current) =>
                    current.map((entry, rowIndex) =>
                      rowIndex === index ? { ...entry, identifier: event.target.value } : entry,
                    ),
                  )
                }
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Nome da mesa"
                value={table.label}
                onChange={(event) =>
                  setTableRows((current) =>
                    current.map((entry, rowIndex) =>
                      rowIndex === index ? { ...entry, label: event.target.value } : entry,
                    ),
                  )
                }
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Area"
                value={table.area}
                onChange={(event) =>
                  setTableRows((current) =>
                    current.map((entry, rowIndex) =>
                      rowIndex === index ? { ...entry, area: event.target.value } : entry,
                    ),
                  )
                }
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Lugares"
                type="number"
                min={1}
                value={table.seats ?? ""}
                onChange={(event) =>
                  setTableRows((current) =>
                    current.map((entry, rowIndex) =>
                      rowIndex === index
                        ? {
                            ...entry,
                            seats: event.target.value ? Number(event.target.value) : null,
                          }
                        : entry,
                    ),
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  setTableRows((current) =>
                    current.map((entry, rowIndex) =>
                      rowIndex === index ? { ...entry, isActive: !entry.isActive } : entry,
                    ),
                  )
                }
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  table.isActive ? "bg-[#111827] text-white" : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {table.isActive ? "Ativa" : "Inativa"}
              </button>
              <button
                type="button"
                onClick={() => setTableRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSaveTableLayout}
            disabled={savingTables}
            className="rounded-2xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingTables ? "Salvando..." : "Salvar distribuicao"}
          </button>
        </div>
      </section>

      {selectedTable ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{selectedTable.identifier}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{selectedTable.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableId(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-h-[70vh] overflow-y-auto border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
                {selectedSession ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Comanda</p>
                        <p className="mt-3 text-lg font-semibold text-slate-950">{selectedSession.id}</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total</p>
                        <p className="mt-3 text-lg font-semibold text-slate-950">{selectedSession.total}</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Clientes</p>
                        <p className="mt-3 text-lg font-semibold text-slate-950">{selectedSession.customerCount}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {selectedSession.orders.map((order) => {
                        const primaryAction =
                          tableNextStatusMap[order.status as keyof typeof tableNextStatusMap];
                        const isFinalized = order.status === "Entregue" || order.status === "Cancelado";
                        const isPending = pendingActionId === order.id;

                        return (
                          <article
                            key={order.id}
                            className="rounded-[24px] border border-slate-200 bg-white p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-400">{order.id}</p>
                                <h4 className="mt-1 text-lg font-semibold text-slate-950">{order.customer}</h4>
                                <p className="mt-2 text-sm text-slate-500">
                                  {order.paymentMethodLabel} • {order.time}
                                </p>
                                <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
                                  Pedido de mesa entra direto em producao
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <StatusBadge status={order.status} />
                                <span className="text-sm font-semibold text-slate-950">{order.total}</span>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={`${order.id}-${item.name}`}
                                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                                >
                                  <span>{item.name}</span>
                                  <span className="font-semibold text-slate-900">{item.quantity}x</span>
                                </div>
                              ))}
                            </div>

                            {order.notes ? (
                              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                                Observacao: {order.notes}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {primaryAction ? (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    void handleAdvanceOrder(order);
                                  }}
                                  className="rounded-2xl bg-[#111827] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  {isPending ? "Processando..." : primaryAction}
                                </button>
                              ) : null}
                              {!isFinalized ? (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    void handleCancelOrder(order.id);
                                  }}
                                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 disabled:opacity-60"
                                >
                                  Cancelar pedido
                                </button>
                              ) : null}
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  void handleDeleteOrder(order.id);
                                }}
                                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
                              >
                                Excluir pedido
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                    Esta mesa esta livre no momento.
                  </div>
                )}
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                {selectedSession ? (
                  <div className="space-y-5">
                    <section className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Abrangencia</p>
                      <h4 className="mt-3 text-lg font-semibold text-slate-950">
                        {selectedSession.customerNames.join(", ")}
                      </h4>
                      <p className="mt-2 text-sm text-slate-500">
                        Aberta em {new Date(selectedSession.openedAt).toLocaleString("pt-BR")}
                      </p>
                    </section>

                    <section className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-5">
                      <h4 className="text-sm font-semibold text-slate-950">Encerrar mesa</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Fecha a comanda no caixa, marca os pedidos da mesa como pagos e reconhece a receita.
                      </p>
                      <button
                        type="button"
                        onClick={handleCloseSession}
                        disabled={pendingActionId === selectedSession.id}
                        className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {pendingActionId === selectedSession.id ? "Encerrando..." : "Encerrar mesa"}
                      </button>
                    </section>

                    <section className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-5">
                      <h4 className="text-sm font-semibold text-slate-950">Transferir mesa</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Move a comanda inteira para outra mesa livre.
                      </p>
                      <select
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        value={transferTargetTableId}
                        onChange={(event) => setTransferTargetTableId(event.target.value)}
                      >
                        <option value="">Selecione a mesa</option>
                        {availableTransferTables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleTransferSession}
                        disabled={!transferTargetTableId || pendingActionId === selectedSession.id}
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                      >
                        Transferir comanda
                      </button>
                    </section>

                    <section className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-5">
                      <h4 className="text-sm font-semibold text-slate-950">Mesclar mesas</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Junta esta comanda em outra mesa que ja esteja aberta.
                      </p>
                      <select
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        value={mergeTargetSessionId}
                        onChange={(event) => setMergeTargetSessionId(event.target.value)}
                      >
                        <option value="">Selecione a comanda</option>
                        {availableMergeSessions.map((session) => (
                          <option key={session.id} value={session.id}>
                            {session.tableLabel}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleMergeSession}
                        disabled={!mergeTargetSessionId || pendingActionId === selectedSession.id}
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                      >
                        Mesclar comanda
                      </button>
                    </section>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-5 text-sm leading-6 text-slate-500">
                    Quando a mesa receber pedidos, a comanda aparecera aqui com itens, valores e acoes de operacao.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
