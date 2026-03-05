"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { blueShinyStarIcon } from "./MapIcon";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

const TOYAMA_PREF_UNIV: LatLngExpression = [36.706, 137.213];
const TOKYO_STATION: LatLngExpression = [35.681236, 139.767125];

function Recenter({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent() {
  const router = useRouter();

  const [center, setCenter] = useState<LatLngExpression>(TOYAMA_PREF_UNIV);
  const [markerPos, setMarkerPos] = useState<LatLngExpression>(TOYAMA_PREF_UNIV);
  const [status, setStatus] = useState<string>("現在地を取得中…");
  const zoom = 15;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("位置情報が使えません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },
      () => setStatus("位置情報を取得できませんでした。"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  const refetchLocation = () => {
    setStatus("現在地を再取得中…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },
      () => setStatus("位置情報を取得できませんでした。"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const safeCenter = useMemo(() => center, [center]);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <style>{`
        .leaflet-tile-pane {
          filter: brightness(0.5) contrast(1.2) saturate(0.8);
        }
      `}</style>
      <MapContainer
        center={TOKYO_STATION}
        zoom={zoom}
        style={{ height: "100%", width: "100%" , zIndex: 0}}
      >
        <TileLayer
          attribution='&copy; <a href="http://jawg.io">&copy; <b>Jawg</b>Maps</a>'
          url="https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP"
        />

        <Recenter center={safeCenter} zoom={zoom} />

        <Marker 
          position={markerPos} 
          icon={blueShinyStarIcon as L.DivIcon}
          eventHandlers={{
            click: () => {
              router.push("/me"); // 【重要】これで本物のマイページに飛びます
            },
          }}
        />
      </MapContainer>

      {/* ステータスバー */}
      <div style={{ position: "fixed", top: 10, left: 10, right: 10, zIndex: 2000, padding: "10px 12px", background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 12, fontSize: 14 }}>
        {status}
      </div>

      {/* 右下：現在地へ */}
      <button
        onClick={refetchLocation}
        style={{ position: "fixed", bottom: 72, right: 16, zIndex: 2000, padding: "12px 14px", borderRadius: 999, border: "none", background: "#2563eb", color: "white", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
      >
        現在地へ
      </button>

      {/* 下部：マイページボタン */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2000, padding: 12, background: "rgba(0,0,0,0.55)" }}>
        <button
          onClick={() => router.push("/me")}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "none", background: "#f59e0b", color: "#111827", fontWeight: 800, fontSize: 16 }}
        >
          マイページ
        </button>
      </div>
    </div>
  );
}