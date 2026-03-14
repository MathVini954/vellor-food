import { useEffect, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { OfferModal } from "../components/OfferModal";
import { OffersList } from "../components/OffersList";
import type { AdminSection, CategoryOption, FeatureAccess, MenuProduct, Offer } from "../types/dashboard";

type OffersManagementPageProps = {
  restaurantName: string;
  userName: string;
  featureAccess: FeatureAccess;
  availableProducts: MenuProduct[];
  availableCategories: CategoryOption[];
  initialOffers: Offer[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onSaveOffer: (offer: Omit<Offer, "id">, existingId?: string) => Promise<void>;
  onToggleOfferStatus: (offerId: string, status: Offer["status"]) => Promise<void>;
};

export function OffersManagementPage({
  restaurantName,
  userName,
  featureAccess,
  availableProducts,
  availableCategories,
  initialOffers,
  onLogout,
  onNavigate,
  onSaveOffer,
  onToggleOfferStatus,
}: OffersManagementPageProps) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  useEffect(() => {
    setOffers(initialOffers);
  }, [initialOffers]);

  function handleCreate() {
    setEditingOffer(null);
    setIsModalOpen(true);
  }

  function handleEdit(offer: Offer) {
    setEditingOffer(offer);
    setIsModalOpen(true);
  }

  async function handleToggleStatus(offerId: string) {
    const target = offers.find((offer) => offer.id === offerId);

    if (!target) {
      return;
    }

    const nextStatus = target.status === "Ativa" ? "Inativa" : "Ativa";

    setOffers((current) =>
      current.map((offer) => (offer.id === offerId ? { ...offer, status: nextStatus } : offer)),
    );

    await onToggleOfferStatus(offerId, nextStatus);
  }

  async function handleSave(offer: Omit<Offer, "id">, existingId?: string) {
    await onSaveOffer(offer, existingId);
  }

  return (
    <>
      <AdminShell
        activeSection="Ofertas"
        restaurantName={restaurantName}
        userName={userName}
        featureAccess={featureAccess}
        pageTitle="Ofertas e promocoes"
        pageSubtitle="Crie campanhas conectadas ao catalogo para abastecer os destaques do mobile."
        onLogout={onLogout}
        onNavigate={onNavigate}
        action={
          <button
            className="action-primary"
            type="button"
            onClick={handleCreate}
          >
            + Nova oferta
          </button>
        }
      >
        <OffersList offers={offers} onEdit={handleEdit} onToggleStatus={handleToggleStatus} />
      </AdminShell>

      <OfferModal
        isOpen={isModalOpen}
        availableProducts={availableProducts}
        availableCategories={availableCategories}
        initialOffer={editingOffer}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
