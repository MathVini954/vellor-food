import { OfferStatusBadge } from "./OfferStatusBadge";
import type { Offer } from "../types/dashboard";

type OffersListProps = {
  offers: Offer[];
  onEdit: (offer: Offer) => void;
  onToggleStatus: (offerId: string) => void;
};

export function OffersList({ offers, onEdit, onToggleStatus }: OffersListProps) {
  return (
    <section className="panel overflow-hidden rounded-[28px]">
      <div className="border-b border-slate-200 px-5 py-5">
        <h1 className="text-2xl font-semibold text-slate-900">Ofertas e Promocoes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crie campanhas para aumentar vendas, promover categorias e destacar pratos do dia.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Nome da oferta</th>
              <th className="px-5 py-4">Tipo da oferta</th>
              <th className="px-5 py-4">Desconto aplicado</th>
              <th className="px-5 py-4">Aplicacao</th>
              <th className="px-5 py-4">Data de validade</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
            {offers.map((offer) => (
              <tr key={offer.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900">{offer.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Inicio: {offer.startDate}
                  </div>
                </td>
                <td className="px-5 py-4">{offer.type}</td>
                <td className="px-5 py-4 font-medium text-slate-900">{offer.discount}</td>
                <td className="px-5 py-4">{offer.appliesTo}</td>
                <td className="px-5 py-4">{offer.endDate}</td>
                <td className="px-5 py-4">
                  <OfferStatusBadge status={offer.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-[210px] gap-2">
                    <button
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      type="button"
                      onClick={() => onEdit(offer)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                      type="button"
                      onClick={() => onToggleStatus(offer.id)}
                    >
                      {offer.status === "Ativa" ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
