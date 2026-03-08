"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { SelectedMapAddress } from "./location-map-picker-sheet";
import { useRestaurantStore } from "./restaurant-store-provider";
import type {
  CheckoutFormState,
  DeliveryQuote,
  PaymentMethod,
  PublicCustomerSession,
  PublicRestaurant,
} from "@/types/public";

const LocationMapPickerSheet = dynamic(
  () =>
    import("./location-map-picker-sheet").then((module) => module.LocationMapPickerSheet),
  { ssr: false },
);

type CheckoutPageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  initialCustomer: PublicCustomerSession | null;
};

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "CARD_ON_DELIVERY", label: "Cartao na entrega" },
  { value: "PAY_ON_PICKUP", label: "Pagar na retirada" },
];

export function CheckoutPageClient({
  slug,
  restaurant,
  initialCustomer,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const {
    cart,
    subtotal,
    clearCart,
    customer,
    setCustomer,
    incrementCartItem,
    decrementCartItem,
  } = useRestaurantStore();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState("");
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState(customer?.address ?? initialCustomer?.address ?? "");
  const [streetNumber, setStreetNumber] = useState("");
  const [form, setForm] = useState<CheckoutFormState>({
    customerName: customer?.name ?? initialCustomer?.name ?? "",
    customerPhone: customer?.phone ?? initialCustomer?.phone ?? "",
    customerAddress: customer?.address ?? initialCustomer?.address ?? "",
    customerNeighborhood: customer?.neighborhood ?? initialCustomer?.neighborhood ?? "",
    orderType: "DELIVERY",
    paymentMethod: "PIX",
    notes: "",
  });

  useEffect(() => {
    if (!customer) {
      return;
    }

    setForm((current) => ({
      ...current,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address ?? current.customerAddress,
      customerNeighborhood: customer.neighborhood ?? current.customerNeighborhood,
    }));
    setStreet(customer.address ?? "");
  }, [customer]);

  useEffect(() => {
    const nextAddress = [
      street.trim(),
      streetNumber.trim(),
      zipCode.trim() ? `CEP ${zipCode.trim()}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    setForm((current) => ({
      ...current,
      customerAddress: nextAddress,
    }));
  }, [street, streetNumber, zipCode]);

  const enabledPaymentOptions = paymentOptions.filter((option) => {
    if (option.value === "CASH") {
      return restaurant.acceptCash;
    }
    if (option.value === "PIX") {
      return restaurant.acceptPix;
    }
    if (option.value === "CARD_ON_DELIVERY") {
      return restaurant.acceptCardOnDelivery;
    }
    return restaurant.pickupActive;
  });

  useEffect(() => {
    if (form.orderType === "DELIVERY" && !restaurant.deliveryActive && restaurant.pickupActive) {
      setForm((current) => ({ ...current, orderType: "PICKUP" }));
    }

    if (form.orderType === "PICKUP" && !restaurant.pickupActive && restaurant.deliveryActive) {
      setForm((current) => ({ ...current, orderType: "DELIVERY" }));
    }
  }, [form.orderType, restaurant.deliveryActive, restaurant.pickupActive]);

  useEffect(() => {
    if (!enabledPaymentOptions.some((option) => option.value === form.paymentMethod)) {
      setForm((current) => ({
        ...current,
        paymentMethod: enabledPaymentOptions[0]?.value ?? "PIX",
      }));
    }
  }, [enabledPaymentOptions, form.paymentMethod]);

  useEffect(() => {
    if (form.orderType !== "DELIVERY") {
      setDeliveryQuote(null);
      setDeliveryQuoteError("");
      setIsCalculatingDelivery(false);
      return;
    }

    const customerAddress = form.customerAddress.trim();
    const customerNeighborhood = form.customerNeighborhood.trim();

    if (!customerAddress || !customerNeighborhood) {
      setDeliveryQuote(null);
      setDeliveryQuoteError("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCalculatingDelivery(true);
        setDeliveryQuoteError("");

        const response = await fetch(`/api/public/restaurants/${slug}/delivery-quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerAddress,
            customerNeighborhood,
          }),
          signal: controller.signal,
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Nao foi possivel calcular a entrega.");
        }

        setDeliveryQuote(payload as DeliveryQuote);
      } catch (quoteError) {
        if (controller.signal.aborted) {
          return;
        }

        setDeliveryQuote(null);
        setDeliveryQuoteError(
          quoteError instanceof Error
            ? quoteError.message
            : "Nao foi possivel calcular a entrega.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsCalculatingDelivery(false);
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [form.customerAddress, form.customerNeighborhood, form.orderType, slug]);

  const deliveryFee =
    form.orderType === "DELIVERY" ? deliveryQuote?.deliveryFee ?? restaurant.deliveryFee : 0;
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);
  const minimumOrderReached = subtotal >= restaurant.minimumOrderValue;

  function prefersWhatsAppWeb() {
    if (typeof navigator === "undefined") {
      return false;
    }

    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent,
    );
  }

  function handleApplyMapLocation(address: SelectedMapAddress) {
    setZipCode(address.zipCode);
    setStreet(address.street || address.formattedAddress);
    setStreetNumber(address.number);
    setForm((current) => ({
      ...current,
      customerNeighborhood: address.neighborhood,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    let whatsappWindow: Window | null = null;

    if (!cart.length) {
      setError("Seu carrinho esta vazio.");
      return;
    }

    if (!restaurant.isOpen) {
      setError("O restaurante esta fechado e nao pode receber pedidos agora.");
      return;
    }

    if (form.orderType === "DELIVERY" && !restaurant.deliveryActive) {
      setError("A entrega esta desativada no momento.");
      return;
    }

    if (form.orderType === "PICKUP" && !restaurant.pickupActive) {
      setError("A retirada esta desativada no momento.");
      return;
    }

    if (!minimumOrderReached) {
      setError(
        `O pedido minimo para este restaurante e ${formatCurrency(restaurant.minimumOrderValue)}.`,
      );
      return;
    }

    if (!form.customerName || !form.customerPhone) {
      setError("Informe seu nome e telefone para concluir.");
      return;
    }

    if (form.orderType === "DELIVERY" && (!form.customerAddress || !form.customerNeighborhood)) {
      setError("Informe endereco e bairro para entrega.");
      return;
    }

    if (form.orderType === "DELIVERY" && deliveryQuoteError) {
      setError(deliveryQuoteError);
      return;
    }

    if (form.orderType === "DELIVERY" && !deliveryQuote) {
      setError("Aguarde o calculo da entrega antes de finalizar.");
      return;
    }

    whatsappWindow = window.open("", "_blank", "noopener,noreferrer");
    setIsSubmitting(true);

    const response = await fetch(`/api/public/restaurants/${slug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        customerNeighborhood: form.customerNeighborhood,
        orderType: form.orderType,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          customizations: item.customizations,
          selectedOptionIds: item.selectedOptionIds,
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      whatsappWindow?.close();
      setError(payload.error || "Nao foi possivel finalizar seu pedido.");
      setIsSubmitting(false);
      return;
    }

    setCustomer(payload.customer);
    clearCart();

    const whatsappTargetUrl =
      prefersWhatsAppWeb() && payload.whatsappWebUrl ? payload.whatsappWebUrl : payload.whatsappUrl;

    if (whatsappTargetUrl) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = whatsappTargetUrl;
      } else {
        window.location.href = whatsappTargetUrl;
      }
    }

    router.push(`/r/${slug}/pedido/${payload.orderId}/confirmacao`);
    router.refresh();
  }

  if (!cart.length) {
    return (
      <div className="px-5 pb-10">
        <header className="flex items-center gap-3">
          <Link
            href={`/r/${slug}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm text-slate-400">{restaurant.name}</p>
            <h1 className="text-[24px] font-bold text-slate-900">Finalizar pedido</h1>
          </div>
        </header>

        <section className="mt-10 rounded-[30px] bg-white px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
            <ReceiptText size={26} />
          </div>
          <h2 className="mt-5 text-[24px] font-bold text-slate-900">Seu carrinho esta vazio</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Volte ao menu, adicione seus pratos e retorne para concluir o pedido.
          </p>
          <Link
            href={`/r/${slug}/menu`}
            className="mt-6 inline-flex rounded-[18px] bg-[#e3342f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(227,52,47,0.24)]"
          >
            Ver cardapio
          </Link>
        </section>
      </div>
    );
  }

  return (
    <>
      <form id="checkout-form" className="px-5 pb-[240px] sm:pb-44" onSubmit={handleSubmit}>
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/r/${slug}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-sm text-slate-400">{restaurant.name}</p>
              <h1 className="text-[24px] font-bold text-slate-900">Finalizar pedido</h1>
            </div>
          </div>
          <div className="rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
            {cart.length} itens
          </div>
        </header>

        {!customer ? (
          <div className="mt-5 rounded-[24px] border border-[#ffd7d4] bg-[#fff4f2] px-5 py-4 text-sm text-[#b5302c]">
            Identificacao obrigatoria para concluir. Voce pode preencher abaixo ou{" "}
            <Link className="font-semibold underline" href={`/r/${slug}/identificacao`}>
              voltar para se identificar
            </Link>
            .
          </div>
        ) : null}

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
              <UserRound size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Conta e contato</h2>
              <p className="text-sm text-slate-500">Os dados ficam salvos para os proximos pedidos.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
              placeholder="Seu nome"
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
            />
            <input
              className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
              placeholder="Seu telefone"
              value={form.customerPhone}
              onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
            />
          </div>
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
              <MapPin size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Entrega ou retirada</h2>
              <p className="text-sm text-slate-500">Retirada remove a taxa de entrega automaticamente.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {restaurant.deliveryActive ? (
              <button
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  form.orderType === "DELIVERY"
                    ? "bg-[#111827] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                type="button"
                onClick={() => setForm((current) => ({ ...current, orderType: "DELIVERY" }))}
              >
                Entrega
              </button>
            ) : null}
            {restaurant.pickupActive ? (
              <button
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  form.orderType === "PICKUP"
                    ? "bg-[#111827] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                type="button"
                onClick={() => setForm((current) => ({ ...current, orderType: "PICKUP" }))}
              >
                Retirada
              </button>
            ) : null}
          </div>

          {form.orderType === "DELIVERY" ? (
            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
                placeholder="CEP"
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
              />
              <input
                className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
                placeholder="Rua"
                value={street}
                onChange={(event) => setStreet(event.target.value)}
              />
              <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
                <input
                  className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
                  placeholder="Bairro / localidade"
                  value={form.customerNeighborhood}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customerNeighborhood: event.target.value,
                    }))
                  }
                />
                <input
                  className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
                  placeholder="Numero"
                  value={streetNumber}
                  onChange={(event) => setStreetNumber(event.target.value)}
                />
              </div>
              <button
                className="flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
              >
                <MapPin size={16} />
                Selecionar no mapa
              </button>
              <div className="rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Regra de entrega
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Entrega gratis ate {restaurant.freeDeliveryRadiusKm.toFixed(1).replace(".", ",")} km
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fora desse raio, a taxa base aplicada e {formatCurrency(restaurant.deliveryFee)}.
                    </p>
                  </div>
                  {isCalculatingDelivery ? (
                    <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      Calculando...
                    </span>
                  ) : null}
                </div>
                {deliveryQuote ? (
                  <p className="mt-3 text-xs text-slate-600">
                    Distancia estimada: <span className="font-semibold text-slate-900">{deliveryQuote.distanceKm.toFixed(2).replace(".", ",")} km</span>.{" "}
                    {deliveryQuote.qualifiesForFreeDelivery
                      ? "Este endereco recebe entrega gratis."
                      : `Taxa aplicada: ${formatCurrency(deliveryQuote.deliveryFee)}.`}
                  </p>
                ) : null}
                {deliveryQuoteError ? (
                  <p className="mt-3 text-xs text-rose-600">{deliveryQuoteError}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
              <CreditCard size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pagamento</h2>
              <p className="text-sm text-slate-500">A forma escolhida vai registrada no pedido.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {enabledPaymentOptions.map((option) => (
              <button
                key={option.value}
                className={`rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${
                  form.paymentMethod === option.value
                    ? "bg-[#111827] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                type="button"
                onClick={() => setForm((current) => ({ ...current, paymentMethod: option.value }))}
              >
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            className="mt-4 min-h-28 w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
            placeholder="Observacoes para o restaurante"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
              <ReceiptText size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Resumo do pedido</h2>
              <p className="text-sm text-slate-500">Ajuste quantidades antes de enviar.</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#f8efe4]">
                  {item.imageUrl ? (
                    <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.name} />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.categoryName}</p>
                  {item.customizations.length ? (
                    <p className="mt-1 text-[11px] text-[#b5302c]">
                      {item.customizations.join(" • ")}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-[#178447]">
                    {formatCurrency((item.price + item.extraPrice) * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-[18px] bg-[#111827] px-2 py-2 text-white">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
                    type="button"
                    onClick={() => decrementCartItem(item.id)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-5 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
                    type="button"
                    onClick={() => incrementCartItem(item.id)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!minimumOrderReached ? (
            <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Falta {formatCurrency(restaurant.minimumOrderValue - subtotal)} para atingir o pedido
              minimo.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[20px] border border-[#ffd7d4] bg-[#fff4f2] px-4 py-3 text-sm text-[#b5302c]">
              {error}
            </div>
          ) : null}
        </section>
      </form>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="pointer-events-auto w-full max-w-[398px] rounded-[30px] bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <div className="rounded-[22px] bg-[#111827] px-4 py-3 text-white">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-white/70">
              <span>Taxa de entrega</span>
              <span>{deliveryFee === 0 ? "Gratis" : formatCurrency(deliveryFee)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold text-white">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            className="mt-3 w-full rounded-[22px] bg-[#e3342f] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(227,52,47,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            form="checkout-form"
            disabled={isSubmitting || !restaurant.isOpen}
          >
            {isSubmitting ? "Salvando pedido..." : "Finalizar pedido e abrir WhatsApp"}
          </button>
        </div>
      </div>

      <LocationMapPickerSheet
        open={isMapPickerOpen}
        slug={slug}
        restaurantCenter={{
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        }}
        onClose={() => setIsMapPickerOpen(false)}
        onApply={handleApplyMapLocation}
      />
    </>
  );
}
