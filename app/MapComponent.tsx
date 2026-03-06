"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { auth } from "./lib/firebase";
import { fetchEncountersByOwner } from "./lib/encounterClient";

const customPinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Lumina Us 最新の星（金）
const goldStarIcon = L.divIcon({
  html: `
  <div style="
    width:70px;
    height:70px;
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
  ">

    <div style="
      position:absolute;
      width:70px;
      height:70px;
      border-radius:50%;
      background: radial-gradient(circle,
        rgba(255,220,100,0.55) 0%,
        rgba(255,200,50,0.25) 40%,
        rgba(255,200,50,0) 70%
      );
      filter: blur(3px);
    "></div>

    <svg viewBox="0 0 100 100"
      width="60"
      height="60"
      style="
        position:relative;
        z-index:2;
        filter:
          drop-shadow(0 0 6px rgba(255,215,80,0.9))
          drop-shadow(0 0 16px rgba(255,200,0,0.6));
      ">

      <polygon
        points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35"
        fill="#FFD84D"
      />

    </svg>

  </div>
  `,
  className: "",
  iconSize: [70,70],
  iconAnchor: [35,35],
  popupAnchor: [0,-30],
});

const blueStarIcon = L.divIcon({
  html: `
  <div style="
    width:60px;
    height:60px;
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
  ">

    <div style="
      position:absolute;
      width:60px;
      height:60px;
      border-radius:50%;
      background: radial-gradient(circle,
        rgba(120,180,255,0.45) 0%,
        rgba(120,180,255,0.18) 40%,
        rgba(120,180,255,0) 70%
      );
      filter: blur(2px);
    "></div>

    <svg viewBox="0 0 100 100"
      width="50"
      height="50"
      style="
        position:relative;
        z-index:2;
        filter: drop-shadow(0 0 6px rgba(80,150,255,0.6));
      ">

      <polygon
        points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35"
        fill="#3B82F6"
      />


    </svg>


  </div>
  `,
  className:"",
  iconSize:[60,60],
  iconAnchor:[30,30],
  popupAnchor:[0,-24],
});


const TOYAMA_PREF_UNIV: [number, number] = [36.706, 137.213];
const TOKYO_STATION: [number, number] = [35.681236, 139.767125];

function Recenter({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

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

  // Firebaseから画像を取得
  useEffect(() => {

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
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("この端末/ブラウザでは位置情報が使えません。");
      setCenter(TOYAMA_PREF_UNIV);
      setMarkerPos(TOYAMA_PREF_UNIV);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },

      () => {
        setStatus("位置情報を取得できませんでした。富山県立大学を中心に表示します。");
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

  // 【ここが抜けていました！】現在地を再取得する関数
  const refetchLocation = () => {
    if (!("geolocation" in navigator)) return;

    setStatus("現在地を再取得中…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {

        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示しています。");
      },
      () => {
        setStatus("位置情報を取得できませんでした。");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const safeCenter = useMemo(() => center, [center]);

const formatTime = (createdAt: any) => {
  const sec = createdAt?.seconds;
  if (!sec) return "保存直後";
  return new Date(sec * 1000).toLocaleString("ja-JP");
};

// アイコン拡大画面
if (showLargeIcon) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#111827",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", marginBottom: "30px" }}>
        <div
          style={{
            position: "absolute",
            inset: -15,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37, 99, 235, 0.6) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
        {userIcon ? (
          <img
            src={userIcon}
            alt="Profile"
            style={{
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              border: "5px solid white",
              position: "relative",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              backgroundColor: "#374151",
            }}
          />
        )}
      </div>
      <button
        onClick={() => setShowLargeIcon(false)}
        style={{
          padding: "12px 40px",
          borderRadius: "30px",
          border: "none",
          backgroundColor: "white",
          color: "#111827",
          fontWeight: "bold",
          fontSize: "16px",
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

          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />
        <Recenter center={safeCenter} zoom={zoom} />


        <Marker position={markerPos} icon={customPinIcon}>
          <Popup>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 700 }}>現在地</div>
              <div>{status}</div>
            </div>
          </Popup>
        </Marker>

        {encounters.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={item.isLatest ? goldStarIcon : blueStarIcon}
          >
            <Popup>
              <div style={{ fontSize: 14, minWidth: 200 }}>
                <div style={{ fontWeight: 800 }}>
                  {item.snapshot?.name || "名前未設定"}
                </div>
                <div style={{ marginTop: 4 }}>
                  {item.snapshot?.affiliation || "所属未設定"}
                </div>
                <div style={{ marginTop: 8 }}>
                  交換時間：{formatTime(item.createdAt)}
                </div>
                <div style={{ marginTop: 4 }}>
                  交換場所：{item.address || "住所不明"}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
        }}
      >
        {status}
      </div>

      <button
        onClick={() => router.push("/scan")}
        style={{
          position: "fixed",
          bottom: 160,
          right: 16,
          zIndex: 2000,
          width: 64,
          height: 64,
          borderRadius: 16,
          border: "none",
          background: "#22c55e",
          color: "#111827",
          fontWeight: 900,
          fontSize: 28,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        QR
      </button>

      <button
        onClick={refetchLocation}
        style={{
          position: "fixed",
          bottom: 88,
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


      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2000,
          padding: 12,
          background: "rgba(0,0,0,0.55)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        <button
          onClick={() => router.push("/me")}
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            border: "none",
            background: "#22c55e",
            color: "#111827",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          マイページ編集
        </button>

        <button
          onClick={() => router.push("/meisi")}
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            border: "none",
            background: "#f59e0b",
            color: "#111827",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          My名刺
        </button>

        <button
          onClick={() => router.push("/cards")}
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            border: "none",
            background: "#60a5fa",
            color: "#111827",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          名刺一覧
        </button>

      </div>
    </div>
  );
}