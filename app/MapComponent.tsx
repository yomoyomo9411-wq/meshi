"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { blueShinyStarIcon } from "./MapIcon";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

// Firebase関連
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

  // Firebaseから画像を取得
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserIcon(userDoc.data().icon || user.photoURL);
        } else {
          setUserIcon(user.photoURL);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 現在地の初期取得
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

  // 【ここが抜けていました！】現在地を再取得する関数
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

  // アイコン拡大画面
  if (showLargeIcon) {
    return (
      <div style={{ 
        width: "100vw", height: "100vh", backgroundColor: "#111827", 
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" 
      }}>
        <div style={{ position: "relative", marginBottom: "30px" }}>
          <div style={{
            position: "absolute", inset: -15, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.6) 0%, transparent 70%)",
            filter: "blur(10px)"
          }} />
          {userIcon ? (
            <img src={userIcon} alt="Profile" style={{ 
              width: "250px", height: "250px", borderRadius: "50%", 
              border: "5px solid white", position: "relative", objectFit: "cover" 
            }} />
          ) : (
            <div style={{ width: "250px", height: "250px", borderRadius: "50%", backgroundColor: "#374151" }} />
          )}
        </div>
        <button 
          onClick={() => setShowLargeIcon(false)}
          style={{
            padding: "12px 40px", borderRadius: "30px", border: "none",
            backgroundColor: "white", color: "#111827", fontWeight: "bold", fontSize: "16px"
          }}
        >
          地図に戻る
        </button>
      </div>
    );
  }

  // 通常の地図画面
  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer center={TOKYO_STATION} zoom={zoom} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          url="https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP"
        />
        <Recenter center={safeCenter} zoom={zoom} />
        <Marker 
          position={markerPos} 
          icon={blueShinyStarIcon as L.DivIcon}
          eventHandlers={{
            click: () => setShowLargeIcon(true),
          }}
        />
      </MapContainer>

      {/* 右下：現在地へボタン */}
      <button
        onClick={refetchLocation}
        style={{ position: "fixed", bottom: 85, right: 16, zIndex: 2000, padding: "12px 14px", borderRadius: 999, border: "none", background: "#2563eb", color: "white", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
      >
        現在地へ
      </button>

      {/* 下部ボタン */}
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