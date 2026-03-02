import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Clinic } from "@/context/AppContext";

try {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
} catch {
  const _ignore = true;
}

type Props = {
  clinics: Clinic[];
  center: [number, number];
  zoom: number;
  onSelect: (c: Clinic) => void;
  bookLabel: string;
};

export default function LeafletMap({ clinics, center, zoom, onSelect, bookLabel }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} key={`${center[0]}-${center[1]}`}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {clinics.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]}>
          <Popup>
            <strong>{c.name}</strong>
            <br />
            <button onClick={() => onSelect(c)} className="mt-1 text-sm text-primary font-semibold underline">
              {bookLabel}
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
