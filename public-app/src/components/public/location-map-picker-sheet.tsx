"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, { type DivIcon } from "leaflet";

export type SelectedMapAddress = {
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  formattedAddress: string;
};

type LocationMapPickerSheetProps = {
  open: boolean;
  slug: string;
  restaurantCenter: {
    latitude: number | null;
    longitude: number | null;
  };
  onClose: () => void;
  onApply: (address: SelectedMapAddress) => void;
};

const pinIcon: DivIcon = L.divIcon({
  className: "custom-map-pin",
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#e3342f;color:white;box-shadow:0 10px 24px rgba(227,52,47,0.32);border:3px solid rgba(255,255,255,0.92);">
      <div style="width:8px;height:8px;border-radius:999px;background:white;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapEvents({
  onSelect,
}: {
  onSelect: (position: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapViewUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

export function LocationMapPickerSheet({
  open,
  slug,
  restaurantCenter,
  onClose,
  onApply,
}: LocationMapPickerSheetProps) {
  const defaultCenter = useMemo(
    () => ({
      latitude: restaurantCenter.latitude ?? -23.55052,
      longitude: restaurantCenter.longitude ?? -46.633308,
    }),
    [restaurantCenter.latitude, restaurantCenter.longitude],
  );
  const [position, setPosition] = useState(defaultCenter);
  const [isResolving, setIsResolving] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<SelectedMapAddress | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setPosition(defaultCenter);
    setResolvedAddress(null);
    setError("");

    if (!("geolocation" in navigator)) {
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        });
        setIsLocatingUser(false);
      },
      () => {
        setIsLocatingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  }, [defaultCenter, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsResolving(true);
        setError("");

        const response = await fetch(`/api/public/restaurants/${slug}/location-from-pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(position),
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Nao foi possivel localizar esse ponto.");
        }

        setResolvedAddress(payload as SelectedMapAddress);
      } catch (resolveError) {
        if (controller.signal.aborted) {
          return;
        }

        setResolvedAddress(null);
        setError(
          resolveError instanceof Error
            ? resolveError.message
            : "Nao foi possivel localizar esse ponto.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsResolving(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [open, position, slug]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm">
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] rounded-t-[32px] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Sua localidade
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Escolha o ponto no mapa</h2>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <button
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#111827] px-4 py-3 text-sm font-semibold text-white"
            type="button"
            onClick={() => {
              if (!("geolocation" in navigator)) {
                setError("Seu navegador nao permite usar localizacao atual.");
                return;
              }

              setIsLocatingUser(true);
              navigator.geolocation.getCurrentPosition(
                (result) => {
                  setPosition({
                    latitude: result.coords.latitude,
                    longitude: result.coords.longitude,
                  });
                  setIsLocatingUser(false);
                },
                () => {
                  setError("Nao foi possivel usar sua localizacao atual.");
                  setIsLocatingUser(false);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 12000,
                },
              );
            }}
          >
            <Navigation size={16} />
            {isLocatingUser ? "Buscando sua localizacao..." : "Usar minha localizacao atual"}
          </button>

          <div className="overflow-hidden rounded-[26px] border border-slate-200">
            <MapContainer
              center={[position.latitude, position.longitude]}
              zoom={16}
              scrollWheelZoom={false}
              style={{ height: 320, width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewUpdater latitude={position.latitude} longitude={position.longitude} />
              <MapEvents onSelect={setPosition} />
              <Marker
                draggable
                icon={pinIcon}
                position={[position.latitude, position.longitude]}
                eventHandlers={{
                  dragend(event) {
                    const nextPosition = event.target.getLatLng();
                    setPosition({
                      latitude: nextPosition.lat,
                      longitude: nextPosition.lng,
                    });
                  },
                }}
              />
            </MapContainer>
          </div>

          <div className="mt-4 rounded-[22px] border border-slate-200 bg-[#fbfbfb] px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ef] text-[#e3342f]">
                <MapPin size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {isResolving ? "Localizando endereco..." : "Endereco encontrado"}
                </p>
                {resolvedAddress ? (
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>{resolvedAddress.formattedAddress}</p>
                    <p>
                      {resolvedAddress.street || "Rua nao encontrada"}
                      {resolvedAddress.number ? `, ${resolvedAddress.number}` : ""}
                    </p>
                    <p>
                      {resolvedAddress.neighborhood || "Bairro nao identificado"}
                      {resolvedAddress.zipCode ? ` • CEP ${resolvedAddress.zipCode}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Toque no mapa ou arraste o pin para identificar a localidade.
                  </p>
                )}
                {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              className="flex-1 rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-[18px] bg-[#e3342f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              type="button"
              disabled={!resolvedAddress || isResolving}
              onClick={() => {
                if (!resolvedAddress) {
                  return;
                }

                onApply(resolvedAddress);
                onClose();
              }}
            >
              Usar este ponto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
