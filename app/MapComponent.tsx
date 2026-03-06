"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

// 別ファイルから星を読み込む
import { blueShinyStarIcon, yellowShinyStarIcon } from "./MapIcon";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { fetchEncountersByOwner } from "./lib/encounterClient";

const TOYAMA_PREF_UNIV: [number, number] = [36.706, 137.213];

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: true }); }, [center, zoom, map]);
  return null;
}

export default function MapComponent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>(TOYAMA_PREF_UNIV);
  const [markerPos, setMarkerPos] = useState<[number, number]>(TOYAMA_PREF_UNIV);
  const [status, setStatus] = useState("現在地を取得中…");
  const zoom = 15;

  // データ取得
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { setEncounters([]); return; }
      try {
        const list = await fetchEncountersByOwner(u.uid);
        setEncounters(list);
      } catch (e) { console.error(e); }
    });
    return () => unsub();
  }, []);

  // 現在地取得
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("この端末では位置情報が使えません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示中");
      },
      () => {
        setStatus("位置情報が取得できませんでした。"); // 要望のメッセージ
        setCenter(TOYAMA_PREF_UNIV);
        setMarkerPos(TOYAMA_PREF_UNIV);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const refetchLocation = () => {
    setStatus("現在地を再取得中…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示中");
      },
      () => setStatus("位置情報が取得できませんでした。"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const safeCenter = useMemo(() => center, [center]);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP" />
        <Recenter center={safeCenter} zoom={zoom} />

        {/* 自分の現在地：キラキラ青い星 */}
        <Marker position={markerPos} icon={blueShinyStarIcon as L.DivIcon}>
          <Popup><div style={{ textAlign: "center", fontWeight: 700 }}>あなた</div></Popup>
        </Marker>

        {/* 他の人：黄色（最新）or 青（過去） */}
        {encounters.map((item) => (
          <Marker 
            key={item.id} 
            position={[item.lat, item.lng]} 
            icon={item.isLatest ? (yellowShinyStarIcon as L.DivIcon) : (blueShinyStarIcon as L.DivIcon)}
          >
            <Popup>
              <div style={{ fontSize: 14, minWidth: 160 }}>
                <div style={{ fontWeight: 800 }}>{item.snapshot?.name || "名前未設定"}</div>
                <div style={{ fontSize: "12px" }}>{item.snapshot?.affiliation}</div>
                <div style={{ fontSize: "11px", marginTop: 8 }}>場所：{item.address || "不明"}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ステータスバー */}
      <div style={{ position: "fixed", top: 10, left: 10, right: 10, zIndex: 2000, padding: "10px 12px", background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 12, fontSize: 14, textAlign: "center" }}>
        {status}
      </div>

      {/* QRスキャン */}
      <button onClick={() => router.push("/scan")} style={{ position: "fixed", bottom: 160, right: 16, zIndex: 2000, width: 64, height: 64, borderRadius: 16, border: "none", background: "#22c55e", color: "white", fontWeight: 900, fontSize: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>QR</button>

      {/* 現在地へ */}
      <button onClick={refetchLocation} style={{ position: "fixed", bottom: 88, right: 16, zIndex: 2000, padding: "12px 14px", borderRadius: 999, border: "none", background: "#2563eb", color: "white", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>現在地へ</button>

      {/* 下部4ボタン */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2000, padding: 12, background: "rgba(0,0,0,0.55)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <button onClick={() => router.push("/scan")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "#22c55e", color: "#111827", fontWeight: 800, fontSize: "12px" }}>QRスキャン</button>
        <button onClick={() => router.push("/me")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "white", color: "#111827", fontWeight: 800, fontSize: "12px" }}>編集</button>
        <button onClick={() => router.push("/meisi")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#111827", fontWeight: 800, fontSize: "12px" }}>My名刺</button>
        <button onClick={() => router.push("/cards")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "#60a5fa", color: "#111827", fontWeight: 800, fontSize: "12px" }}>一覧</button>
      </div>
    </div>
  );
}