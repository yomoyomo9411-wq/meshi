"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Home,
  CreditCard,
  QrCode,
  MessageCircle,
  IdCard,
} from "lucide-react";
import { Fragment } from "react";

import { blueShinyStarIcon, yellowShinyStarIcon } from "./MapIcon";
import EncounterStoryOverlay from "./components/EncounterStoryOverlay";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import {
  fetchEncountersByOwner,
  fetchEncounterHistoryByOwnerAndOther,
} from "./lib/encounterClient";

import { collection, onSnapshot } from "firebase/firestore";

type TabKey = "home" | "cards" | "scan" | "chat" | "meisi" | null;

function Recenter({
  center,
  zoom,
  offsetY = 0,
}: {
  center: [number, number];
  zoom: number;
  offsetY?: number;
}) {
  const map = useMap();

  useEffect(() => {
    const target = L.latLng(center[0], center[1]);
    const point = map.project(target, zoom);
    const shiftedPoint = L.point(point.x, point.y - offsetY);
    const shiftedCenter = map.unproject(shiftedPoint, zoom);

    map.setView(shiftedCenter, zoom, { animate: true });
  }, [center, zoom, offsetY, map]);

  return null;
}

export default function MapComponent() {
  const router = useRouter();
    useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {
        alert("位置情報が取得できませんでした");
        router.back();
      }
    );
  }, [router]);
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [encounters, setEncounters] = useState<any[]>([]);

  const [center, setCenter] = useState<[number, number] | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState("現在地を取得中…");
  const [isLocationError, setIsLocationError] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  const [storyOpen, setStoryOpen] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyItems, setStoryItems] = useState<any[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);

  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [pressedTab, setPressedTab] = useState<TabKey>(null);

  const zoom = 15;
  const handledFocusOtherUidRef = useRef<string | null>(null);

    const getOffsetLatLng = (lat: number, lng: number, id?: string) => {
    const idStr = id || "0";
    const n1 = parseInt(idStr.slice(-2), 16);
    const n2 = parseInt(idStr.slice(-3), 16);
    const latOffset = ((Number.isFinite(n1) ? n1 : 0) % 10 - 5) * 0.00003;
    const lngOffset = ((Number.isFinite(n2) ? n2 : 0) % 10 - 5) * 0.00003;
    return [lat + latOffset, lng + lngOffset] as [number, number];
  };
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);

    return () => window.removeEventListener("resize", updateViewportHeight);
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
    const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
    setCenter(latlng);
    setMarkerPos(latlng);
    setStatus("現在地を表示中");
    setIsLocationError(false);
    setLocationReady(true); // ←追加
  },
  (err) => {
    console.error(err);
    setStatus("位置情報が取得できませんでした。");
    setIsLocationError(true);
    setMarkerPos(null);
    setLocationReady(true); // ←追加
  },
  { enableHighAccuracy: true, timeout: 8000 }
);
  };

  useEffect(() => {
    if (mounted) handleGeolocation();
  }, [mounted]);

  const openStoryFromEncounter = async (item: any) => {
    if (!user) return;

    setStoryOpen(true);
    setStoryLoading(true);

    try {
      const history = await fetchEncounterHistoryByOwnerAndOther(
        user.uid,
        item.otherUid
      );

      if (!history || history.length === 0) {
        setStoryItems([item]);
        setStoryIndex(0);
        return;
      }

      const index = history.findIndex((h: any) => h.id === item.id);
      setStoryItems(history);
      setStoryIndex(index >= 0 ? index : 0);
    } catch (e) {
      console.error(e);
      setStoryItems([item]);
      setStoryIndex(0);
    } finally {
      setStoryLoading(false);
    }
  };

  const openLatestStoryByOtherUid = async (otherUid: string) => {
    if (!user) return;

    const latest = encounters.find(
      (item) => item.otherUid === otherUid && item.isLatest === true
    );

    if (!latest) return;

    await openStoryFromEncounter(latest);
  };

  const closeStory = () => {
    const from = searchParams.get("from");

    setStoryOpen(false);
    setStoryLoading(false);
    setStoryItems([]);
    setStoryIndex(0);

    if (from === "cards") {
      router.replace("/cards");
    } else {
      router.replace("/");
    }
  };

  const currentStoryItem = storyItems[storyIndex] ?? null;

  const mapCenter = useMemo<[number, number] | null>(() => {
  if (storyOpen && currentStoryItem) {
    return [currentStoryItem.lat, currentStoryItem.lng];
  }
  return center ?? null; // null も許容
}, [storyOpen, currentStoryItem, center]);

  const mapOffsetY = useMemo(() => {
    if (!storyOpen) return 0;
    return Math.round(viewportHeight * 0.2);
  }, [storyOpen, viewportHeight]);

  const currentLinePositions = useMemo<[number, number][]>(() => {
    if (!storyOpen || storyItems.length === 0) return [];

    return [...storyItems]
      .slice()
      .reverse()
      .map((item) => [item.lat, item.lng] as [number, number]);
  }, [storyOpen, storyItems]);

  useEffect(() => {
    if (!user) return;
    if (encounters.length === 0) return;

    const focusOtherUid = searchParams.get("focusOtherUid");

    if (!focusOtherUid) {
      handledFocusOtherUidRef.current = null;
      return;
    }

    if (handledFocusOtherUidRef.current === focusOtherUid) {
      return;
    }

    if (storyOpen) {
      return;
    }

    handledFocusOtherUidRef.current = focusOtherUid;
    void openLatestStoryByOtherUid(focusOtherUid);
  }, [user, encounters, storyOpen, searchParams]);

  useEffect(() => {
  if (!user) return;

  const unsub = onSnapshot(collection(db, "chatRooms"), (snap) => {

    let unread = false;

    snap.docs.forEach((doc) => {

      const roomId = doc.id;

      if (!roomId.includes(user.uid)) return;

      const data = doc.data();

      const count = data?.[`unreadCount_${user.uid}`] ?? 0;

      if (count > 0) {
        unread = true;
      }

    });

    setHasUnreadChat(unread);

  });

  return () => unsub();
}, [user]);

  const navButtonBase: React.CSSProperties = {
    position: "relative",
    padding: "10px 4px",
    minHeight: 64,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "11px",
    cursor: "pointer",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: `
      linear-gradient(135deg,
        rgba(99,102,241,0.22) 0%,
        rgba(168,85,247,0.18) 35%,
        rgba(59,130,246,0.20) 70%,
        rgba(255,255,255,0.08) 100%)
    `,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 0 rgba(255,255,255,0.04),
      0 6px 16px rgba(0,0,0,0.18)
    `,
    transition:
      "transform 0.16s ease, box-shadow 0.18s ease, background 0.18s ease",
  };

  const activeNavButton: React.CSSProperties = {
    ...navButtonBase,
    border: "1px solid rgba(255,255,255,0.24)",
    background: `
      linear-gradient(135deg,
        rgba(129,140,248,0.34) 0%,
        rgba(192,132,252,0.28) 35%,
        rgba(96,165,250,0.32) 70%,
        rgba(255,255,255,0.14) 100%)
    `,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -1px 0 rgba(255,255,255,0.06),
      0 10px 24px rgba(76,110,245,0.28),
      0 2px 10px rgba(168,85,247,0.20)
    `,
  };

  const getPressedButtonStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    if (!isPressed) {
      return isActive ? activeNavButton : navButtonBase;
    }

    return {
      ...(isActive ? activeNavButton : navButtonBase),
      transform: "scale(0.96)",
      boxShadow: isActive
        ? `
          inset 0 1px 0 rgba(255,255,255,0.28),
          0 0 18px rgba(255,255,255,0.24),
          0 0 28px rgba(125,211,252,0.28),
          0 0 40px rgba(168,85,247,0.24)
        `
        : `
          inset 0 1px 0 rgba(255,255,255,0.20),
          0 0 14px rgba(255,255,255,0.18),
          0 0 24px rgba(125,211,252,0.22),
          0 0 34px rgba(168,85,247,0.20)
        `,
    };
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    lineHeight: 1,
    whiteSpace: "nowrap",
    opacity: 0.95,
    transition: "all 0.16s ease",
  };

  const activeLabelStyle: React.CSSProperties = {
    ...labelStyle,
    fontWeight: 800,
    opacity: 1,
    color: "#fde68a",
  };

  const iconStyle: React.CSSProperties = {
    filter: "drop-shadow(0 0 8px rgba(125,211,252,0.45))",
    transition: "all 0.16s ease",
  };

  const activeIconStyle: React.CSSProperties = {
        color: "#fde68a",
    filter: `
      drop-shadow(0 0 6px rgba(255,255,255,0.95))
      drop-shadow(0 0 14px rgba(253,230,138,0.80))
      drop-shadow(0 0 22px rgba(125,211,252,0.60))
      drop-shadow(0 0 30px rgba(168,85,247,0.45))
    `,
    transition: "all 0.16s ease",
  };

  const getPressedLabelStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeLabelStyle : labelStyle;

    if (!isPressed) return base;

    return {
      ...base,
      color: "#ffffff",
      textShadow: `
        0 0 6px rgba(255,255,255,0.95),
        0 0 12px rgba(255,255,255,0.85),
        0 0 18px rgba(253,230,138,0.75),
        0 0 28px rgba(125,211,252,0.55),
        0 0 40px rgba(168,85,247,0.45)
      `,
      letterSpacing: "0.02em",
      transform: "translateY(-1px)",
    };
  };

  const getPressedIconStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeIconStyle : iconStyle;

    if (!isPressed) return base;

    return {
      ...base,
      filter: `
        drop-shadow(0 0 6px rgba(255,255,255,0.95))
        drop-shadow(0 0 14px rgba(253,230,138,0.80))
        drop-shadow(0 0 22px rgba(125,211,252,0.60))
        drop-shadow(0 0 30px rgba(168,85,247,0.45))
      `,
      transform: "scale(1.06)",
    };
  };

  const pressHandlers = (tab: Exclude<TabKey, null>) => ({
    onTouchStart: () => setPressedTab(tab),
    onTouchEnd: () => setPressedTab(null),
    onTouchCancel: () => setPressedTab(null),
    onMouseDown: () => setPressedTab(tab),
    onMouseUp: () => setPressedTab(null),
    onMouseLeave: () => setPressedTab(null),
  });

  if (!mounted) return null;

  return (
    <>
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#111827",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ flex: 1, position: "relative", width: "100%" }}>
          {!locationReady && (
  <div
    style={{
      height: "100%",
      display: "grid",
      placeItems: "center",
      color: "white",
      fontSize: 16,
      fontWeight: 700,
    }}
  >
    {isLocationError
      ? "位置情報が取得できませんでした"
      : "位置情報を取得しています…"}
  </div>
)}
          {locationReady && mapCenter ? (
  <MapContainer
    center={mapCenter}
    zoom={zoom}
    style={{ height: "100%", width: "100%", zIndex: 0 }}
  >
    <TileLayer
      attribution='&copy; <a href="http://jawg.io">&copy; <b>Jawg</b>Maps</a>'
      url="https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP"
    />

    <Recenter center={mapCenter} zoom={zoom} offsetY={mapOffsetY} />

    {!storyOpen &&
      encounters
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
              position={getOffsetLatLng(lat, lng, item.id)}
              icon={
                item.isLatest
                  ? (yellowShinyStarIcon as L.DivIcon)
                  : (blueShinyStarIcon as L.DivIcon)
              }
              eventHandlers={{
                click: () => {
                  void openStoryFromEncounter(item);
                },
              }}
            />
          );
        })}

    {storyOpen && currentLinePositions.length >= 2 && (
      <>
        <Polyline
          positions={currentLinePositions}
          pathOptions={{
            color: "rgba(253, 230, 138, 0.18)",
            weight: 18,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Polyline
          positions={currentLinePositions}
          pathOptions={{
            color: "rgba(125, 211, 252, 0.28)",
            weight: 10,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Polyline
          positions={currentLinePositions}
          pathOptions={{
            color: "#fde68a",
            weight: 4,
            opacity: 0.98,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </>
    )}

    {storyOpen &&
      storyItems.map((item, index) => {
        const isCurrent = index === storyIndex;

        return (
          <Fragment key={item.id ?? `${item.otherUid}-${index}`}>
            {isCurrent && (
              <Marker
                position={getOffsetLatLng(item.lat, item.lng, item.id)}
                icon={L.divIcon({
                  className: "",
                  html: `
                    <div style="
                      width:40px;
                      height:40px;
                      border-radius:50%;
                      border:3px solid #fde68a;
                      box-shadow:
                        0 0 12px rgba(253,230,138,0.9),
                        0 0 20px rgba(125,211,252,0.7);
                        pointer-events:none
                    "></div>
                  `,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20],
                })}
                interactive={false}
              />
            )}

            <Marker
              position={getOffsetLatLng(item.lat, item.lng, item.id)}
              icon={
                item.isLatest
                  ? (yellowShinyStarIcon as L.DivIcon)
                  : (blueShinyStarIcon as L.DivIcon)
              }
              zIndexOffset={isCurrent ? 1000 : 500}
              eventHandlers={{
                click: () => setStoryIndex(index),
              }}
            />
          </Fragment>
        );
      })}
  </MapContainer>
) : (
  <div
    style={{
      height: "100%",
      display: "grid",
      placeItems: "center",
      color: "white",
      fontSize: 16,
      fontWeight: 700,
    }}
  >
    {isLocationError
      ? "位置情報が取得できませんでした"
      : "位置情報を取得しています…"}
  </div>
)}
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
              WebkitBackdropFilter: "blur(4px)",
              fontWeight: isLocationError ? "bold" : "normal",
              transition: "all 0.3s",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            {storyOpen
              ? "出会い星座モード：左右スワイプで履歴をたどれます"
              : status}
          </div>

          {!storyOpen && (
            <button
              onClick={handleGeolocation}
              style={{
                position: "fixed",
                bottom: 110,
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
          )}

          {!storyOpen && (
            <div
              style={{
                position: "fixed",
                left: 10,
                right: 10,
                bottom: 10,
                zIndex: 2000,
                padding: 10,
                borderRadius: 28,
                background: `
                  linear-gradient(135deg,
                    rgba(255,255,255,0.12) 0%,
                    rgba(255,255,255,0.06) 100%)
                `,
                border: "1px solid rgba(255,255,255,0.16)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: `
                  0 14px 36px rgba(0,0,0,0.30),
                  inset 0 1px 0 rgba(255,255,255,0.12)
                `,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                gap: 8,
              }}
            >
              <button
                onClick={() => router.push("/")}
                style={getPressedButtonStyle(true, pressedTab === "home")}
                {...pressHandlers("home")}
              >
                <Home
                  size={20}
                  strokeWidth={2.2}
                  style={getPressedIconStyle(true, pressedTab === "home")}
                />
                <span style={getPressedLabelStyle(true, pressedTab === "home")}>
                  ホーム
                </span>
              </button>

              <button
                onClick={() => router.push("/cards")}
                style={getPressedButtonStyle(false, pressedTab === "cards")}
                {...pressHandlers("cards")}
              >
                <CreditCard
                  size={20}
                  strokeWidth={2.2}
                  style={getPressedIconStyle(false, pressedTab === "cards")}
                />
                <span
                  style={getPressedLabelStyle(false, pressedTab === "cards")}
                >
                  名刺一覧
                </span>
              </button>

              <button
                onClick={() => router.push("/scan")}
                style={getPressedButtonStyle(false, pressedTab === "scan")}
                {...pressHandlers("scan")}
              >
                <QrCode
                  size={20}
                  strokeWidth={2.2}
                  style={getPressedIconStyle(false, pressedTab === "scan")}
                />
                <span style={getPressedLabelStyle(false, pressedTab === "scan")}>
                  交換
                </span>
              </button>

              <button
                onClick={() => router.push("/chat")}
                style={getPressedButtonStyle(false, pressedTab === "chat")}
                {...pressHandlers("chat")}
              >
                <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
                  <MessageCircle
                    size={20}
                    strokeWidth={2.2}
                    style={getPressedIconStyle(false, pressedTab === "chat")}
                  />
                  {hasUnreadChat && (
                    <span
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -4,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#ef4444",
                        boxShadow: "0 0 10px rgba(239,68,68,0.7)",
                      }}
                    />
                  )}
                </div>
                <span style={getPressedLabelStyle(false, pressedTab === "chat")}>
                  チャット
                </span>
              </button>

              <button
                onClick={() => router.push("/meisi")}
                style={getPressedButtonStyle(false, pressedTab === "meisi")}
                {...pressHandlers("meisi")}
              >
                <IdCard
                  size={20}
                  strokeWidth={2.2}
                  style={getPressedIconStyle(false, pressedTab === "meisi")}
                />
                <span
                  style={getPressedLabelStyle(false, pressedTab === "meisi")}
                >
                  My名刺
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {storyOpen && !storyLoading && (
        <EncounterStoryOverlay
          open={storyOpen}
          items={storyItems}
          currentIndex={storyIndex}
          onChangeIndex={setStoryIndex}
          onClose={closeStory}
        />
      )}

      {storyOpen && storyLoading && (
        <div
          onClick={closeStory}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4999,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          読み込み中…
        </div>
      )}
    </>
  );
}