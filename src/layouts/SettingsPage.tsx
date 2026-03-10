import { useEffect, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { FormSelect } from "../components/FormSelect";
import { IosToggle } from "../components/IosToggle";
import type { AdminSection, FeatureAccess, RestaurantSettings } from "../types/dashboard";

type SettingsPageProps = {
  restaurantSlug: string;
  restaurantName: string;
  userName: string;
  initialSettings: RestaurantSettings;
  featureAccess: FeatureAccess;
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onSaveSettings: (settings: RestaurantSettings) => Promise<void>;
};

type SettingsTab = "Restaurante" | "Operacao" | "Pagamento" | "Aparencia";
type RestaurantStatusMode = "auto" | "forced_open" | "forced_closed";
type RestaurantHourEntry = {
  weekday: number;
  open: string;
  close: string;
  closed: boolean;
};

const tabs: SettingsTab[] = ["Restaurante", "Operacao", "Pagamento", "Aparencia"];
const brazilStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const weekdayLabels = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];
const defaultRestaurantHours = weekdayLabels.map((_, weekday) => ({
  weekday,
  open: "",
  close: "",
  closed: false,
})) satisfies RestaurantHourEntry[];

function normalizeHourEntries(entries?: Partial<RestaurantHourEntry>[]) {
  return defaultRestaurantHours.map((defaultEntry) => {
    const currentEntry = entries?.find((entry) => entry.weekday === defaultEntry.weekday);

    return {
      weekday: defaultEntry.weekday,
      open: String(currentEntry?.open ?? ""),
      close: String(currentEntry?.close ?? ""),
      closed: Boolean(currentEntry?.closed ?? false),
    };
  });
}

function serializeWorkingHours(
  restaurantHours: RestaurantHourEntry[],
  restaurantStatus: RestaurantStatusMode,
) {
  return JSON.stringify({
    restaurantHours,
    restaurantStatus,
  });
}

function parseWorkingHours(value: string): {
  restaurantHours: RestaurantHourEntry[];
  restaurantStatus: RestaurantStatusMode;
} {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return {
      restaurantHours: normalizeHourEntries(),
      restaurantStatus: "auto" as RestaurantStatusMode,
    };
  }

  try {
    const parsed = JSON.parse(normalizedValue) as {
      restaurantHours?: Partial<RestaurantHourEntry>[];
      restaurantStatus?: RestaurantStatusMode;
    };

    return {
      restaurantHours: normalizeHourEntries(parsed.restaurantHours),
      restaurantStatus:
        parsed.restaurantStatus === "forced_open" || parsed.restaurantStatus === "forced_closed"
          ? parsed.restaurantStatus
          : "auto",
    };
  } catch {
    const matchedHours = normalizedValue.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);

    if (!matchedHours) {
      return {
        restaurantHours: normalizeHourEntries(),
        restaurantStatus: "auto" as RestaurantStatusMode,
      };
    }

    const [, open, close] = matchedHours;
    return {
      restaurantHours: normalizeHourEntries(
        defaultRestaurantHours.map((entry) => ({
          ...entry,
          open,
          close,
          closed: false,
        })),
      ),
      restaurantStatus: "auto" as RestaurantStatusMode,
    };
  }
}

export function SettingsPage({
  restaurantSlug,
  restaurantName,
  userName,
  initialSettings,
  featureAccess,
  onLogout,
  onNavigate,
  onSaveSettings,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Restaurante");
  const [settings, setSettings] = useState<RestaurantSettings>(initialSettings);
  const [restaurantHours, setRestaurantHours] = useState<RestaurantHourEntry[]>(() =>
    parseWorkingHours(initialSettings.operation.workingHours).restaurantHours,
  );
  const [restaurantStatus, setRestaurantStatus] = useState<RestaurantStatusMode>(() =>
    parseWorkingHours(initialSettings.operation.workingHours).restaurantStatus,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const explicitPublicAppBaseUrl = (import.meta.env.VITE_PUBLIC_APP_BASE_URL as string | undefined)?.replace(/\/$/, "");
  const adminApiBaseUrl = (import.meta.env.VITE_ADMIN_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
  const derivedPublicAppBaseUrl = adminApiBaseUrl?.replace(/\/api\/admin$/, "");
  const publicAppBaseUrl =
    explicitPublicAppBaseUrl ||
    derivedPublicAppBaseUrl ||
    window.location.origin;
  const publicRestaurantUrl = `${publicAppBaseUrl}/r/${restaurantSlug}`;
  const [showDigitalMenuQr, setShowDigitalMenuQr] = useState(false);
  const digitalMenuUrl = featureAccess.digitalMenuUrl;
  const digitalMenuQrCodeUrl = digitalMenuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(digitalMenuUrl)}`
    : null;

  useEffect(() => {
    setSettings(initialSettings);
    const parsedWorkingHours = parseWorkingHours(initialSettings.operation.workingHours);
    setRestaurantHours(parsedWorkingHours.restaurantHours);
    setRestaurantStatus(parsedWorkingHours.restaurantStatus);
  }, [initialSettings]);

  async function handleCopyLink(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setSaveMessage(successMessage);
    } catch {
      setSaveMessage("Nao foi possivel copiar o link.");
    }

    window.setTimeout(() => setSaveMessage(""), 2500);
  }

  async function handleImageFileSelection(
    file: File | null,
    onLoaded: (value: string) => void,
  ) {
    if (!file) {
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
      reader.readAsDataURL(file);
    });

    onLoaded(dataUrl);
  }

  async function handleSave() {
    setIsSaving(true);
    await onSaveSettings(settings);
    setSaveMessage("Alteracoes salvas.");
    window.setTimeout(() => setSaveMessage(""), 2500);
    setIsSaving(false);
  }

  function syncWorkingHours(
    nextRestaurantHours: RestaurantHourEntry[],
    nextRestaurantStatus: RestaurantStatusMode = restaurantStatus,
  ) {
    setRestaurantHours(nextRestaurantHours);
    setRestaurantStatus(nextRestaurantStatus);
    setSettings((current) => ({
      ...current,
      operation: {
        ...current.operation,
        workingHours: serializeWorkingHours(nextRestaurantHours, nextRestaurantStatus),
      },
    }));
  }

  function updateHourEntry(
    weekday: number,
    field: "open" | "close" | "closed",
    value: string | boolean,
  ) {
    const nextRestaurantHours = restaurantHours.map((entry) =>
      entry.weekday === weekday
        ? {
            ...entry,
            [field]: value,
          }
        : entry,
    );

    syncWorkingHours(nextRestaurantHours);
  }

  function applyHoursToTarget(targetWeekdays: number[]) {
    const sourceEntry = restaurantHours.find((entry) => entry.open || entry.close);

    if (!sourceEntry) {
      return;
    }

    const nextRestaurantHours = restaurantHours.map((entry) =>
      targetWeekdays.includes(entry.weekday)
        ? {
            ...entry,
            open: sourceEntry.open,
            close: sourceEntry.close,
            closed: false,
          }
        : entry,
    );

    syncWorkingHours(nextRestaurantHours);
  }

  function updateRestaurantStatus(nextStatus: RestaurantStatusMode) {
    syncWorkingHours(restaurantHours, nextStatus);
  }

  function renderRestaurantTab() {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Nome do restaurante</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.restaurant.name}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                restaurant: { ...current.restaurant, name: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Logo</span>
          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {settings.restaurant.logo ? (
                  <img
                    alt="Preview da logo"
                    className="h-full w-full object-cover"
                    src={settings.restaurant.logo}
                  />
                ) : (
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Sem logo
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-white px-4 py-4 text-sm font-medium text-orange-700 transition hover:border-orange-400 hover:bg-orange-50">
                  <input
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={async (event) => {
                      const [file] = Array.from(event.target.files ?? []);
                      await handleImageFileSelection(file ?? null, (value) =>
                        setSettings((current) => ({
                          ...current,
                          restaurant: { ...current.restaurant, logo: value },
                        })),
                      );
                      event.currentTarget.value = "";
                    }}
                  />
                  Selecionar arquivo da logo
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400"
                    placeholder="Ou cole uma URL da logo"
                    value={settings.restaurant.logo}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        restaurant: { ...current.restaurant, logo: event.target.value },
                      }))
                    }
                  />
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        restaurant: { ...current.restaurant, logo: "" },
                      }))
                    }
                  >
                    Remover
                  </button>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Aceita imagens do computador. O arquivo e convertido e salvo junto com as
                  configuracoes da operacao.
                </p>
              </div>
            </div>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">WhatsApp</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.restaurant.whatsapp}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                restaurant: { ...current.restaurant, whatsapp: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Endereco</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.restaurant.address}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                restaurant: { ...current.restaurant, address: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Cidade</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.restaurant.city}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                restaurant: { ...current.restaurant, city: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">UF</span>
          <FormSelect
              value={settings.restaurant.state}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  restaurant: { ...current.restaurant, state: event.target.value },
                }))
              }
          >
              <option value="">Selecione</option>
              {brazilStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
          </FormSelect>
        </label>

        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Link do app web do restaurante</p>
            <p className="mt-1 text-sm text-slate-500">
              Esse e o endereco publico do app web que o cliente acessa para fazer pedidos.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="block truncate font-medium">{publicRestaurantUrl}</span>
            </div>
            <div className="flex gap-3">
              <button
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={() => {
                  void handleCopyLink(publicRestaurantUrl, "Link do app web copiado.");
                }}
              >
                Copiar link
              </button>
              <button
                className="rounded-2xl bg-[#171b38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1730]"
                type="button"
                onClick={() => window.open(publicRestaurantUrl, "_blank", "noopener,noreferrer")}
              >
                Abrir app web
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Link do cardapio digital</p>
            <p className="mt-1 text-sm text-slate-500">
              Esse e o link fixo do cardapio de mesa deste restaurante. Use para QR code e
              materiais impressos nas mesas.
            </p>
          </div>

          {featureAccess.digitalMenuEnabled && digitalMenuUrl ? (
            <>
              <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="block truncate font-medium">{digitalMenuUrl}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    type="button"
                    onClick={() => {
                      void handleCopyLink(digitalMenuUrl, "Link do cardapio digital copiado.");
                    }}
                  >
                    Copiar link
                  </button>
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    type="button"
                    onClick={() => setShowDigitalMenuQr((current) => !current)}
                  >
                    {showDigitalMenuQr ? "Ocultar QR code" : "Gerar QR code"}
                  </button>
                  <button
                    className="rounded-2xl bg-[#171b38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1730]"
                    type="button"
                    onClick={() => window.open(digitalMenuUrl, "_blank", "noopener,noreferrer")}
                  >
                    Abrir cardapio digital
                  </button>
                </div>
              </div>

              {showDigitalMenuQr && digitalMenuQrCodeUrl ? (
                <div className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex justify-center">
                      <img
                        alt="QR code do cardapio digital"
                        className="h-52 w-52 rounded-3xl border border-slate-200 bg-white p-3"
                        src={digitalMenuQrCodeUrl}
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900">
                        QR code fixo deste restaurante
                      </p>
                      <p className="text-sm leading-6 text-slate-500">
                        Esse QR aponta para o cardapio digital de mesa e nao muda enquanto o token
                        do restaurante permanecer o mesmo.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          type="button"
                          onClick={() => window.open(digitalMenuQrCodeUrl, "_blank", "noopener,noreferrer")}
                        >
                          Abrir imagem do QR
                        </button>
                        <a
                          className="rounded-2xl bg-[#171b38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1730]"
                          href={digitalMenuQrCodeUrl}
                          download={`qr-cardapio-${restaurantSlug}.png`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Baixar QR code
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-5 py-5 text-sm leading-6 text-slate-500">
              O pacote de cardapio digital ainda nao esta liberado para este restaurante.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderOperationTab() {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Horario de funcionamento</span>
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={() => applyHoursToTarget([0, 1, 2, 3, 4, 5, 6])}
              >
                Aplicar horario para todos os dias
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={() => applyHoursToTarget([1, 2, 3, 4, 5])}
              >
                Aplicar para dias uteis
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={() => applyHoursToTarget([0, 6])}
              >
                Aplicar para fim de semana
              </button>
            </div>

            <div className="space-y-3">
              {restaurantHours.map((entry) => (
                <div
                  key={entry.weekday}
                  className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 lg:grid-cols-[180px_1fr_1fr_220px]"
                >
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-slate-900">
                      {weekdayLabels[entry.weekday]}
                    </span>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Abertura
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      type="time"
                      value={entry.open}
                      disabled={entry.closed}
                      onChange={(event) => updateHourEntry(entry.weekday, "open", event.target.value)}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Fechamento
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      type="time"
                      value={entry.close}
                      disabled={entry.closed}
                      onChange={(event) => updateHourEntry(entry.weekday, "close", event.target.value)}
                    />
                  </label>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <span className="text-sm font-medium text-slate-700">Fechado neste dia</span>
                    <IosToggle
                      checked={entry.closed}
                      onChange={(checked) => updateHourEntry(entry.weekday, "closed", checked)}
                      label={`Fechado em ${weekdayLabels[entry.weekday]}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Status do restaurante</p>
                <p className="mt-1 text-sm text-slate-500">
                  Escolha se a operacao segue os horarios cadastrados ou se fica forçada manualmente.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <button
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    restaurantStatus === "auto"
                      ? "border-[#171b38] bg-[#171b38] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  type="button"
                  onClick={() => updateRestaurantStatus("auto")}
                >
                  Automatico
                  <span className={`mt-1 block text-xs ${restaurantStatus === "auto" ? "text-white/80" : "text-slate-500"}`}>
                    Segue os horarios cadastrados
                  </span>
                </button>

                <button
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    restaurantStatus === "forced_open"
                      ? "border-[#171b38] bg-[#171b38] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  type="button"
                  onClick={() => updateRestaurantStatus("forced_open")}
                >
                  Aberto manualmente
                  <span className={`mt-1 block text-xs ${restaurantStatus === "forced_open" ? "text-white/80" : "text-slate-500"}`}>
                    Fica aberto independentemente do horario
                  </span>
                </button>

                <button
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    restaurantStatus === "forced_closed"
                      ? "border-[#171b38] bg-[#171b38] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  type="button"
                  onClick={() => updateRestaurantStatus("forced_closed")}
                >
                  Fechado manualmente
                  <span className={`mt-1 block text-xs ${restaurantStatus === "forced_closed" ? "text-white/80" : "text-slate-500"}`}>
                    Fica fechado independentemente do horario
                  </span>
                </button>
              </div>
            </div>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Pedido minimo</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.operation.minimumOrder}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                operation: { ...current.operation, minimumOrder: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Taxa de entrega</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.operation.deliveryFee}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                operation: { ...current.operation, deliveryFee: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Entrega gratis ate (km)</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.operation.freeDeliveryRadiusKm}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                operation: { ...current.operation, freeDeliveryRadiusKm: event.target.value },
              }))
            }
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <span className="text-sm font-medium text-slate-700">Entrega ativa</span>
          <IosToggle
            checked={settings.operation.deliveryActive}
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                operation: { ...current.operation, deliveryActive: checked },
              }))
            }
            label="Entrega ativa"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <span className="text-sm font-medium text-slate-700">Retirada ativa</span>
          <IosToggle
            checked={settings.operation.pickupActive}
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                operation: { ...current.operation, pickupActive: checked },
              }))
            }
            label="Retirada ativa"
          />
        </label>

        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
          <div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Regra de entrega</p>
              <p className="mt-1 text-sm text-slate-500">
                O cliente informa endereco e localidade no checkout. O sistema calcula a distancia
                ate o restaurante e aplica entrega gratis quando estiver dentro do raio definido em km.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Taxa base
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {settings.operation.deliveryFee || "R$ 0,00"}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Raio gratis
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {settings.operation.freeDeliveryRadiusKm || "0"} km
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Base de calculo
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Endereco do restaurante + endereco informado pelo cliente no checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPaymentTab() {
    return (
      <div className="grid gap-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <span className="text-sm font-medium text-slate-700">Dinheiro</span>
            <IosToggle
              checked={settings.payment.cash}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  payment: { ...current.payment, cash: checked },
                }))
              }
              label="Dinheiro"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <span className="text-sm font-medium text-slate-700">Pix</span>
            <IosToggle
              checked={settings.payment.pix}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  payment: { ...current.payment, pix: checked },
                }))
              }
              label="Pix"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <span className="text-sm font-medium text-slate-700">Cartao na entrega</span>
            <IosToggle
              checked={settings.payment.cardOnDelivery}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  payment: { ...current.payment, cardOnDelivery: checked },
                }))
              }
              label="Cartao na entrega"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          O pagamento e combinado diretamente entre restaurante e cliente, na entrega ou retirada.
        </div>
      </div>
    );
  }

  function renderAppearanceTab() {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Cor principal</span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              className="h-10 w-14 rounded-lg border border-slate-200"
              type="color"
              value={settings.appearance.primaryColor}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  appearance: { ...current.appearance, primaryColor: event.target.value },
                }))
              }
            />
            <span className="text-sm text-slate-700">{settings.appearance.primaryColor}</span>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Cor secundaria</span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              className="h-10 w-14 rounded-lg border border-slate-200"
              type="color"
              value={settings.appearance.secondaryColor}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  appearance: { ...current.appearance, secondaryColor: event.target.value },
                }))
              }
            />
            <span className="text-sm text-slate-700">{settings.appearance.secondaryColor}</span>
          </div>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Banner do site</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.appearance.banner}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                appearance: { ...current.appearance, banner: event.target.value },
              }))
            }
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Mensagem inicial</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            value={settings.appearance.welcomeMessage}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                appearance: { ...current.appearance, welcomeMessage: event.target.value },
              }))
            }
          />
        </label>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 lg:col-span-2">
          <div
            className="h-40 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.appearance.banner})` }}
          />
          <div
            className="space-y-3 px-5 py-5"
            style={{
              background: `linear-gradient(135deg, ${settings.appearance.primaryColor}, ${settings.appearance.secondaryColor})`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-white/75">Preview</p>
            <h3 className="text-2xl font-semibold text-white">{settings.restaurant.name}</h3>
            <p className="max-w-2xl text-sm leading-6 text-white/85">
              {settings.appearance.welcomeMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case "Restaurante":
        return renderRestaurantTab();
      case "Operacao":
        return renderOperationTab();
      case "Pagamento":
        return renderPaymentTab();
      case "Aparencia":
        return renderAppearanceTab();
      default:
        return null;
    }
  }

  return (
    <AdminShell
      activeSection="Configuracoes"
      restaurantName={restaurantName}
      userName={userName}
      pageTitle="Configuracoes do restaurante"
      pageSubtitle="Controle loja, operacao, pagamento, aparencia e a regra de entrega por distancia."
      onLogout={onLogout}
      onNavigate={onNavigate}
      action={
        <button
          className="rounded-2xl bg-[#171b38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1730] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar alteracoes"}
        </button>
      }
    >
      <section className="panel p-5 lg:p-6">
        {saveMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <div className={`${saveMessage ? "mt-5" : ""} flex flex-wrap gap-3 border-b border-slate-200 pb-5`}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-[#171b38] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">{renderTabContent()}</div>
      </section>
    </AdminShell>
  );
}
