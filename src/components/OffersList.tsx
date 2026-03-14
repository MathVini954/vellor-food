import { OfferStatusBadge } from "./OfferStatusBadge";
import type { Offer } from "../types/dashboard";

type OffersListProps = {
  offers: Offer[];
  onEdit: (offer: Offer) => void;
  onToggleStatus: (offerId: string) => void;
};

export function OffersList({ offers, onEdit, onToggleStatus }: OffersListProps) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[color:var(--border-soft)] px-5 py-5">
        <p className="section-label">Comercial</p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">Ofertas e Promocoes</h1>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Crie campanhas para aumentar vendas, promover categorias e destacar pratos do dia.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full divide-y divide-[color:var(--border-soft)]">
          <thead className="bg-[color:var(--surface-muted)] text-left text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
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
          <tbody className="divide-y divide-[color:var(--border-soft)] bg-white/82 text-sm text-[color:var(--text-muted)]">
            {offers.map((offer) => (
              <tr key={offer.id} className="transition hover:bg-white">
                <td className="px-5 py-4">
                  <div className="font-semibold text-[color:var(--text-strong)]">{offer.name}</div>
                  <div className="mt-1 text-xs text-[color:var(--text-muted)]">Inicio: {offer.startDate}</div>
                </td>
                <td className="px-5 py-4">{offer.type}</td>
                <td className="px-5 py-4 font-medium text-[color:var(--text-strong)]">{offer.discount}</td>
                <td className="px-5 py-4">{offer.appliesTo}</td>
                <td className="px-5 py-4">{offer.endDate}</td>
                <td className="px-5 py-4">
                  <OfferStatusBadge status={offer.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-[210px] gap-2">
                    <button
                      className="action-secondary !rounded-xl !px-3 !py-2 !text-xs"
                      type="button"
                      onClick={() => onEdit(offer)}
                    >
                      Editar
                    </button>
                    <button
                      className="action-warning !rounded-xl !px-3 !py-2 !text-xs"
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
