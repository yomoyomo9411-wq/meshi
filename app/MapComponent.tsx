"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

// 標準のピンがNext.js環境で壊れやすいので、CDNの画像で固定
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ▼ ここは必要なら調整してください（富山県立大学の緯度経度）
// ※ざっくり値です。正確な座標が分かれば差し替えるのがベスト。
const TOYAMA_PREF_UNIV: LatLngExpression = [36.706, 137.213];

// 東京駅（万一のフォールバック用）
const TOKYO_STATION: LatLngExpression = [35.681236, 139.767125];

function Recenter({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

export default function MapComponent() {
  const [center, setCenter] = useState<LatLngExpression>(TOYAMA_PREF_UNIV);
  const [markerPos, setMarkerPos] = useState<LatLngExpression>(TOYAMA_PREF_UNIV);
  const [status, setStatus] = useState<string>("現在地を取得中…");
  const zoom = 15;

  // 現在地取得（初回のみ）
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("この端末/ブラウザでは位置情報が使えません。");
      // 位置情報が使えない場合でも、とりあえず富山県立大中心で表示
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
        // 許可が拒否された/タイムアウト等
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

  // 右下の「現在地へ」ボタン用（押した時に再取得）
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

  // Leafletの中心点が配列かどうかを安定させる（再レンダ時の事故防止）
  const safeCenter = useMemo(() => center, [center]);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={TOKYO_STATION} // 初期値は何でもOK（Recenterで必ず動かす）
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* centerが更新されたら地図をそこへ移動 */}
        <Recenter center={safeCenter} zoom={zoom} />

        <Marker position={markerPos} icon={customIcon}>
          <Popup>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 700 }}>現在地</div>
              <div>{status}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* ステータス表示（スマホで見やすく） */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          padding: "10px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "white",
          borderRadius: 12,
          fontSize: 14,
          backdropFilter: "blur(6px)",
        }}
      >
        {status}
      </div>

      {/* 現在地へボタン */}
      <button
        onClick={refetchLocation}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
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
    </div>
  );
}