import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Clinic } from "@/context/AppContext";

type Props = {
  clinics: Clinic[];
  center: [number, number];
  zoom: number;
  onSelect: (c: Clinic) => void;
  bookLabel: string;
};

export default function MapBasic({ clinics, center, zoom, onSelect, bookLabel }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "" }).addTo(mapRef.current);
    } else {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (markersRef.current) {
      markersRef.current.clearLayers();
    } else {
      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }
    clinics.forEach((c) => {
      const marker = L.marker([c.lat, c.lng]);
      const content = document.createElement("div");
      content.innerHTML = `<strong>${c.name}</strong><br/><button class="awaazsehat-map-button" style="margin-top:4px; text-decoration:underline;">${bookLabel}</button>`;
      marker.bindPopup(content);
      marker.on("popupopen", () => {
        const btn = content.querySelector(".awaazsehat-map-button");
        btn?.addEventListener("click", () => onSelect(c), { once: true });
      });
      marker.addTo(markersRef.current!);
    });
  }, [clinics, onSelect, bookLabel]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
