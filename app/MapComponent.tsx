"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

// アイコン関連
import { createCustomPin } from "./MapIcon";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { fetchProfile } from "./lib/profileClient";
import { fetchEncountersByOwner } from "./lib/encounterClient";

// --- チームが作成した星アイコンの定義 ---
const goldStarIcon = L.divIcon({
  html: `<div style="width:70px;height:70px;display:flex;align-items:center;justify-content:center;position:relative;"><div style="position:absolute;width:70px;height:70px;border-radius:50%;background: radial-gradient(circle,rgba(255,220,100,0.55) 0%,rgba(255,200,50,0.25) 40%,rgba(255,200,50,0) 70%);filter: blur(3px);"></div><svg viewBox="0 0 100 100" width="60" height="60" style="position:relative;z-index:2;filter:drop-shadow(0 0 6px rgba(255,215,80,0.9)) drop-shadow(0 0 16px rgba(255,200,0,0.6));"><polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill="#FFD84D"/></svg></div>`,
  className: "", iconSize: [70, 70], iconAnchor: [35, 35], popupAnchor: [0, -30],
});

const blueStarIcon = L.divIcon({
  html: `<div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;position:relative;"><div style="position:absolute;width:60px;height:60px;border-radius:50%;background: radial-gradient(circle,rgba(120,180,255,0.45) 0%,rgba(120,180,255,0.18) 40%,rgba(120,180,255,0) 70%);filter: blur(2px);"></div><svg viewBox="0 0 100 100" width="50" height="50" style="position:relative;z-index:2;filter: drop-shadow(0 0 6px rgba(80,150,255,0.6));"><polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill="#3B82F6"/></svg></div>`,
  className: "", iconSize: [60, 60], iconAnchor: [30, 30], popupAnchor: [0, -24],
});

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
  const [userIcon, setUserIcon] = useState<string | null>(null);
  
  const [center, setCenter] = useState<[number, number]>(TOYAMA_PREF_UNIV);
  const [markerPos, setMarkerPos] = useState<[number, number]>(TOYAMA_PREF_UNIV);
  const [status, setStatus] = useState("現在地を取得中…");
  const zoom = 15;

  // 1. ログイン監視 ＋ プロフィール画像取得 ＋ 出会い履歴取得
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setEncounters([]);
        setUserIcon(null);
        return;
      }
      try {
        // 自分のアイコン取得
        const p = await fetchProfile(u.uid);
        if (p && p.photoURL && !p.photoURL.includes("googleusercontent.com")) {
          setUserIcon(p.photoURL);
        }
        // 出会った人のデータ取得
        const list = await fetchEncountersByOwner(u.uid);
        setEncounters(list);
      } catch (e) { console.error(e); }
    });
    return () => unsub();
  }, []);

  // 2. 現在地の取得（エラーハンドリング付き）
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("位置情報が使えません。");
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
        setStatus("位置情報が取得できませんでした。"); // ← ご要望の表記
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

  const formatTime = (createdAt: any) => {
    const sec = createdAt?.seconds;
    return sec ? new Date(sec * 1000).toLocaleString("ja-JP") : "最近";
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        {/* 明るい Jawg Terrain */}
        <TileLayer url="https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP" />
        <Recenter center={safeCenter} zoom={zoom} />

        {/* あなたの現在地ピン（アイコン入り） */}
        <Marker position={markerPos} icon={createCustomPin(userIcon)}>
          <Popup>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700 }}>あなた</div>
              <div style={{ fontSize: "12px" }}>{status}</div>
            </div>
          </Popup>
        </Marker>

        {/* チームの出会った人の星 */}
        {encounters.map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]} icon={item.isLatest ? goldStarIcon : blueStarIcon}>
            <Popup>
              <div style={{ fontSize: 14, minWidth: 180 }}>
                <div style={{ fontWeight: 800 }}>{item.snapshot?.name || "名前未設定"}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{item.snapshot?.affiliation}</div>
                <hr style={{ margin: "8px 0", border: "0.5px solid #eee" }} />
                <div style={{ fontSize: "11px" }}>時間：{formatTime(item.createdAt)}</div>
                <div style={{ fontSize: "11px" }}>場所：{item.address || "不明"}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ステータスバー（エラーもここに表示されます） */}
      <div style={{ position: "fixed", top: 10, left: 10, right: 10, zIndex: 2000, padding: "10px 12px", background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 12, fontSize: 14, textAlign: "center" }}>
        {status}
      </div>

      {/* QRスキャンボタン（右中） */}
      <button onClick={() => router.push("/scan")} style={{ position: "fixed", bottom: 160, right: 16, zIndex: 2000, width: 64, height: 64, borderRadius: 16, border: "none", background: "#22c55e", color: "white", fontWeight: 900, fontSize: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
        QR
      </button>

      {/* 現在地へボタン（右下） */}
      <button onClick={refetchLocation} style={{ position: "fixed", bottom: 88, right: 16, zIndex: 2000, padding: "12px 14px", borderRadius: 999, border: "none", background: "#2563eb", color: "white", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
        現在地へ
      </button>

      {/* 下部ボタン（4つ） */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2000, padding: 12, background: "rgba(0,0,0,0.55)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <button onClick={() => router.push("/scan")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "#22c55e", color: "#111827", fontWeight: 800, fontSize: "12px" }}>QRスキャン</button>
        <button onClick={() => router.push("/me")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "white", color: "#111827", fontWeight: 800, fontSize: "12px" }}>編集</button>
        <button onClick={() => router.push("/meisi")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#111827", fontWeight: 800, fontSize: "12px" }}>My名刺</button>
        <button onClick={() => router.push("/cards")} style={{ padding: "12px 4px", borderRadius: 10, border: "none", background: "#60a5fa", color: "#111827", fontWeight: 800, fontSize: "12px" }}>一覧</button>
      </div>
    </div>
  );
}