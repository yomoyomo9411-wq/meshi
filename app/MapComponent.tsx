"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";


// 標準のピンがNext.js環境で壊れやすいので、CDNの画像で固定
const blueShinyStarIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" height="40px">
      <defs>
        <!-- 青い光のぼかし設定 -->
        <filter id="blue-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- 外側の青い光の層 -->
      <path 
        d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.869 1.4-8.168-5.934-5.787 8.2-1.192z" 
        fill="#3b82f6" 
        filter="url(#blue-glow)"
      />
      <!-- 内側の明るい芯（少し水色を混ぜた白） -->
      <path 
        d="M12 2.5l2.9 5.9 6.5 0.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-0.9z" 
        fill="#e0f2fe" 
        fill-opacity="0.95"
      />
    </svg>
  `,
  className: "custom-star-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
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
  attribution='&copy; <a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP"
/>

        <Recenter center={safeCenter} zoom={zoom} />

<Marker 
  position={markerPos} 
  icon={blueShinyStarIcon as L.DivIcon}
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

//test