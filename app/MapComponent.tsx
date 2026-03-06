"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { blueShinyStarIcon, yellowShinyStarIcon, purpleOrbIcon } from "./MapIcon";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { fetchEncountersByOwner } from "./lib/encounterClient";

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

export default function MapComponent() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [encounters, setEncounters] = useState<any[]>([]);

  const [center, setCenter] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState("現在地を取得中…");
  const [isLocationError, setIsLocationError] = useState(false);

  const zoom = 15;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setEncounters([]);
        return;
      }

      try {
        const list = await fetchEncountersByOwner(u.uid);
        setEncounters(list);
      } catch (e) {
        console.error(e);
      }
    });

    return () => unsub();
  }, [mounted]);

  const handleGeolocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus("この端末では位置情報が使えません。");
      setIsLocationError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setCenter(latlng);
        setStatus("現在地を表示中");
        setIsLocationError(false);
      },
      (err) => {
        console.error(err);
        setStatus("位置情報が取得できませんでした。");
        setIsLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (mounted) handleGeolocation();
  }, [mounted]);

  const safeCenter = useMemo(() => center, [center]);

  if (!mounted || !safeCenter) return null;

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        position: "relative",
        background: "#111827",
      }}
    >
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="http://jawg.io">&copy; <b>Jawg</b>Maps</a>'
          url="https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP"
        />

        <Recenter center={safeCenter} zoom={zoom} />


        {/* 出会った人の星 */}
        {encounters
          .filter((item) => {
            const lat = Number(item?.lat);
            const lng = Number(item?.lng);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .map((item) => {
            const lat = Number(item.lat);
            const lng = Number(item.lng);

            const id = String(item.id || "0");

            const n1 = parseInt(id.slice(-2), 16);
            const n2 = parseInt(id.slice(-3), 16);

            const latOffset =
              ((Number.isFinite(n1) ? n1 : 0) % 10 - 5) * 0.00003;

            const lngOffset =
              ((Number.isFinite(n2) ? n2 : 0) % 10 - 5) * 0.00003;

            return (
              <Marker
                key={item.id}
                position={[
                  lat + latOffset,
                  lng + lngOffset,
                ]}
                icon={
                  item.isLatest
                    ? (yellowShinyStarIcon as L.DivIcon)
                    : (blueShinyStarIcon as L.DivIcon)
                }
              >
                <Popup>
                  <div style={{ fontSize: 14, minWidth: 160 }}>
                    <div style={{ fontWeight: 800 }}>
                      {item.snapshot?.name || "名前未設定"}
                    </div>

                    <div style={{ fontSize: "12px" }}>
                      {item.snapshot?.affiliation}
                    </div>

                    <div style={{ fontSize: "11px", marginTop: 8 }}>
                      場所：{item.address || "不明"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* ステータスバー */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          right: 10,
          zIndex: 2000,
          padding: "10px 12px",
          background: isLocationError
            ? "rgba(220, 38, 38, 0.9)"
            : "rgba(0,0,0,0.7)",
          color: "white",
          borderRadius: 12,
          fontSize: 13,
          textAlign: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        {status}
      </div>

      {/* 現在地ボタン */}
      <button
        onClick={handleGeolocation}
        style={{
          position: "fixed",
          bottom: 90,
          right: 16,
          zIndex: 2000,
          padding: "12px 18px",
          borderRadius: 999,
          border: "none",
          background: isLocationError ? "#dc2626" : "#2563eb",
          color: "white",
          fontWeight: 700,
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          cursor: "pointer",
        }}
      >
        {isLocationError ? "再試行" : "現在地へ"}
      </button>

      {/* 下メニュー */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2000,
          padding: 12,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <button
          onClick={() => router.push("/scan")}
          style={{
            padding: "14px 4px",
            borderRadius: 12,
            border: "none",
            background: "#22c55e",
            color: "white",
            fontWeight: 800,
            fontSize: "12px",
          }}
        >
          QRスキャン
        </button>

        <button
          onClick={() => router.push("/me")}
          style={{
            padding: "14px 4px",
            borderRadius: 12,
            border: "none",
            background: "white",
            color: "#111827",
            fontWeight: 800,
            fontSize: "12px",
          }}
        >
          編集
        </button>

        <button
          onClick={() => router.push("/meisi")}
          style={{
            padding: "14px 4px",
            borderRadius: 12,
            border: "none",
            background: "#f59e0b",
            color: "#111827",
            fontWeight: 800,
            fontSize: "12px",
          }}
        >
          My名刺
        </button>

        <button
          onClick={() => router.push("/cards")}
          style={{
            padding: "14px 4px",
            borderRadius: 12,
            border: "none",
            background: "#60a5fa",
            color: "#111827",
            fontWeight: 800,
            fontSize: "12px",
          }}
        >
          一覧
        </button>
      </div>
    </div>
  );
}