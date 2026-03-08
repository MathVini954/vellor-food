"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Phone, UserRound } from "lucide-react";
import { useRestaurantStore } from "./restaurant-store-provider";
import type { PublicCustomerSession, PublicRestaurant } from "@/types/public";

type IdentificationPageClientProps = {
  slug: string;
  restaurant: PublicRestaurant;
  initialCustomer: PublicCustomerSession | null;
};

export function IdentificationPageClient({
  slug,
  restaurant,
  initialCustomer,
}: IdentificationPageClientProps) {
  const router = useRouter();
  const { setCustomer, setGuestAllowed } = useRestaurantStore();
  const [name, setName] = useState(initialCustomer?.name ?? "");
  const [phone, setPhone] = useState(initialCustomer?.phone ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleIdentify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`/api/public/restaurants/${slug}/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Nao foi possivel identificar voce agora.");
      setLoading(false);
      return;
    }

    setCustomer(payload.customer);
    setGuestAllowed(true);
    router.push(`/r/${slug}`);
    router.refresh();
  }

  async function handleContinueAsGuest() {
    setGuestLoading(true);
    setError("");

    const response = await fetch(`/api/public/restaurants/${slug}/guest`, {
      method: "POST",
    });

    if (!response.ok) {
      setError("Nao foi possivel liberar o acesso ao cardapio.");
      setGuestLoading(false);
      return;
    }

    setGuestAllowed(true);
    router.push(`/r/${slug}`);
    router.refresh();
  }

  return (
    <div className="px-5 pb-10 pt-5 sm:pt-6">
      <section className="overflow-hidden rounded-[34px] bg-[#111827] text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
        <div className="relative">
          {restaurant.logoUrl ? (
            <div className="absolute inset-0 opacity-30">
              <img className="h-full w-full object-cover" src={restaurant.logoUrl} alt={restaurant.name} />
            </div>
          ) : null}
          <div className="relative bg-[linear-gradient(180deg,rgba(17,24,39,0.82),rgba(17,24,39,0.96))] px-6 py-8">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
              {restaurant.name}
            </span>
            <h1 className="mt-5 text-[30px] font-bold leading-tight">
              Seu pedido comeca aqui.
            </h1>
            <p className="mt-3 max-w-[280px] text-sm leading-7 text-white/72">
              Identifique-se agora para acelerar o checkout ou siga como convidado e decida depois.
            </p>
          </div>
        </div>
      </section>

      <form className="mt-6 rounded-[30px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]" onSubmit={handleIdentify}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
            <UserRound size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Identificar-se agora</h2>
            <p className="text-sm text-slate-500">Nome e telefone para reaproveitar seus dados.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <input
            className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
            placeholder="Seu nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="w-full rounded-[18px] border border-slate-200 bg-[#fbfbfb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#e3342f]"
            placeholder="Seu telefone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#e3342f] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(227,52,47,0.28)] disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Continuando..." : "Continuar"}
          <ArrowRight size={16} />
        </button>
      </form>

      <section className="mt-4 rounded-[30px] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ff] text-[#2563eb]">
            <Phone size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Continuar sem cadastro por enquanto</h2>
            <p className="text-sm text-slate-500">
              Voce pode ver o menu agora, mas a identificacao sera obrigatoria no checkout.
            </p>
          </div>
        </div>

        <button
          className="mt-5 w-full rounded-[20px] border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          type="button"
          onClick={handleContinueAsGuest}
          disabled={guestLoading}
        >
          {guestLoading ? "Abrindo menu..." : "Ver cardapio agora"}
        </button>
      </section>

      {error ? (
        <div className="mt-4 rounded-[20px] border border-[#ffd7d4] bg-[#fff4f2] px-4 py-3 text-sm text-[#b5302c]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
