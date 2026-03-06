"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createCustomPin } from "./MapIcon";
// 既存のインポートにこれを追加（パスは環境に合わせて ./lib/profileClient に調整）
import { fetchProfile } from "./lib/profileClient";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

import { auth, db } from "./lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [showLargeIcon, setShowLargeIcon] = useState(false);
  const zoom = 15;

  // ★ 修正ポイント：ログイン監視の useEffect はこれ「1つだけ」にします
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUserIcon(null);
        return;
      }

      try {
        // 名刺ページと全く同じ関数を使ってプロフィールを読み込む
        const p = await fetchProfile(u.uid);
        
        if (p && p.photoURL) {
          // Googleの初期アイコンURLが含まれている場合は無視するガード
          if (!p.photoURL.includes("googleusercontent.com")) {
            console.log("名刺ページと同じ画像を読み込みました:", p.photoURL);
            setUserIcon(p.photoURL);
          } else {
            setUserIcon(null); // Googleの初期アイコンなら白くする
          }
        } else {
          setUserIcon(null);
        }
      } catch (e) {
        console.error("プロフィールの読み込みに失敗:", e);
        setUserIcon(null);
      }
    });

    return () => unsub();
  }, []);

  // 現在地の初期取得（ここも整理しました）
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },
      null,
      { enableHighAccuracy: true, timeout: 8000 }
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

  if (showLargeIcon) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#111827", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", marginBottom: "30px" }}>
          <div style={{ position: "absolute", inset: -15, borderRadius: "50%", background: "radial-gradient(circle, rgba(37, 99, 235, 0.6) 0%, transparent 70%)", filter: "blur(10px)" }} />
          {userIcon ? (
            <img src={userIcon} alt="Profile" style={{ width: "250px", height: "250px", borderRadius: "50%", border: "5px solid white", position: "relative", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "250px", height: "250px", borderRadius: "50%", backgroundColor: "#374151" }} />
          )}
        </div>
        <button onClick={() => setShowLargeIcon(false)} style={{ padding: "12px 40px", borderRadius: "30px", border: "none", backgroundColor: "white", color: "#111827", fontWeight: "bold", fontSize: "16px" }}>
          地図に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer center={TOKYO_STATION} zoom={zoom} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP" />
        <Recenter center={safeCenter} zoom={zoom} />
        <Marker position={markerPos} icon={createCustomPin(userIcon)} eventHandlers={{ click: () => setShowLargeIcon(true) }} />
      </MapContainer>

      <button onClick={refetchLocation} style={{ position: "fixed", bottom: 85, right: 16, zIndex: 2000, padding: "12px 14px", borderRadius: 999, border: "none", background: "#2563eb", color: "white", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
        現在地へ
      </button>

      <div style={{ position: "fixed", bottom: 20, left: 20, right: 20, zIndex: 2000, display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/me")} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "white", fontWeight: 800 }}>
            編集
          </button>
          <button onClick={() => router.push("/meisi")} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "#f59e0b", color: "white", fontWeight: 800 }}>
            名刺
          </button>
      </div>
    </div>
  );
}