"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";


// 標準のピンがNext.js環境で壊れやすいので、CDNの画像で固定
const blueStarIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="36px" height="36px" style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.869 1.4-8.168-5.934-5.787 8.2-1.192z"/>
    </svg>
  `,
  className: "custom-star-icon",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});
// ▲ ここまで追加

// 富山県立大学（ざっくり）
// 正確な緯度経度が分かれば差し替えてOK
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
  const [showProfile, setShowProfile] = useState(false); // 最初はfalse（地図表示）
  const zoom = 15;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("この端末/ブラウザでは位置情報が使えません。");
      setCenter(TOYAMA_PREF_UNIV);
      setMarkerPos(TOYAMA_PREF_UNIV);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: LatLngExpression = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setStatus(
          "位置情報を取得できませんでした（許可が必要です）。富山県立大学を中心に表示します。"
        );
        setCenter(TOYAMA_PREF_UNIV);
        setMarkerPos(TOYAMA_PREF_UNIV);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  }, []);

  const refetchLocation = () => {
    if (!("geolocation" in navigator)) return;

    setStatus("現在地を再取得中…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: LatLngExpression = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },
      () => {
        setStatus("位置情報を取得できませんでした（許可を確認してください）。");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const safeCenter = useMemo(() => center, [center]);

  // 修正場所：return ( のすぐ上
if (showProfile) {
  return (
    <div style={{ 
      width: "100vw", 
      height: "100vh", 
      backgroundColor: "white", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center" 
    }}>
      {/* 閉じられなくなると困るので、戻るボタンだけ置いておきます */}
      <button onClick={() => setShowProfile(false)}>地図に戻る</button>
    </div>
  );
}

// ここから下は元の return ( ... ) の内容
  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={TOKYO_STATION}
        zoom={zoom}
        style={{ height: "100%", width: "100%" , zIndex: 0}}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Recenter center={safeCenter} zoom={zoom} />

<Marker 
  position={markerPos} 
  icon={blueStarIcon as L.DivIcon}
  eventHandlers={{
    click: () => {
      setShowProfile(true); // クリックされたらスイッチをオン（true）にする
    },
  }}
>
  {/* Popupはあってもなくても大丈夫です */}
</Marker>
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
          background: "rgba(0,0,0,0.6)",
          color: "white",
          borderRadius: 12,
          fontSize: 14,
          //backdropFilter: "blur(6px)",
        }}
      >
        {status}
      </div>

      {/* 右下：現在地へ */}
      <button
        onClick={refetchLocation}
        style={{
          position: "fixed",
          bottom: 72,
          right: 16,
          zIndex: 2000,
          padding: "12px 14px",
          borderRadius: 999,
          border: "none",
          background: "#2563eb",
          color: "white",
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        現在地へ
      </button>

      {/* 下部：マイページボタン（スマホ用） */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2000,
          padding: 12,
          background: "rgba(0,0,0,0.55)",
          //backdropFilter: "blur(8px)",
        }}
      >
        <button
          onClick={() => router.push("/me")}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "none",
            background: "#f59e0b",
            color: "#111827",
            fontWeight: 800,
            fontSize: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          マイページ
        </button>
      </div>
    </div>
  );
}