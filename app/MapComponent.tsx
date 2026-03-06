"use client";

import { useEffect, useMemo, useState } from "react";
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

import { blueShinyStarIcon, yellowShinyStarIcon } from "./MapIcon";
import EncounterStoryOverlay from "./components/EncounterStoryOverlay";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./lib/firebase";
import {
  fetchEncountersByOwner,
  fetchEncounterHistoryByOwnerAndOther,
} from "./lib/encounterClient";

const INITIAL_CENTER: [number, number] = [36.706, 137.213];

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
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [encounters, setEncounters] = useState<any[]>([]);

  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState("現在地を取得中…");
  const [isLocationError, setIsLocationError] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  // 出会い星座モード
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyItems, setStoryItems] = useState<any[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);

  const zoom = 15;

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
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setCenter(latlng);
        setMarkerPos(latlng);
        setStatus("現在地を表示中");
        setIsLocationError(false);
      },
      (err) => {
        console.error(err);
        setStatus("位置情報が取得できませんでした。");
        setIsLocationError(true);
        setMarkerPos(null);
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
    setStoryOpen(false);
    setStoryLoading(false);
    setStoryItems([]);
    setStoryIndex(0);
    router.push("/");
  };

  const currentStoryItem = storyItems[storyIndex] ?? null;

  const mapCenter = useMemo<[number, number]>(() => {
    if (storyOpen && currentStoryItem) {
      return [currentStoryItem.lat, currentStoryItem.lng];
    }
    return center;
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
    if (storyOpen) return;

    const focusOtherUid = searchParams.get("focusOtherUid");
    if (!focusOtherUid) return;

    void openLatestStoryByOtherUid(focusOtherUid);
  }, [user, encounters, storyOpen, searchParams]);

  if (!mounted) return null;

  return (
    <>
      <div
        style={{
          height: "100vh",
          width: "100%",
          position: "relative",
          background: "#111827",
        }}
      >
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

          {/* 自分の現在地 */}
          {markerPos && (
            <Marker position={markerPos} icon={blueShinyStarIcon as L.DivIcon}>
              {!storyOpen && (
                <Popup>
                  <div style={{ textAlign: "center", fontWeight: 700 }}>
                    あなた
                  </div>
                </Popup>
              )}
            </Marker>
          )}

          {/* 通常モード：全部の星を表示（少しだけ位置をずらして重なり対策） */}
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
                    position={[lat + latOffset, lng + lngOffset]}
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

          {/* 出会い星座モード：発光ライン */}
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

          {/* 出会い星座モード：その人の星だけ表示 */}
          {storyOpen &&
            storyItems.map((item, index) => {
              const isCurrent = index === storyIndex;

              return (
                <Marker
                  key={item.id ?? `${item.otherUid}-${index}`}
                  position={[item.lat, item.lng]}
                  icon={
                    isCurrent
                      ? (yellowShinyStarIcon as L.DivIcon)
                      : (blueShinyStarIcon as L.DivIcon)
                  }
                  zIndexOffset={isCurrent ? 1000 : 500}
                  eventHandlers={{
                    click: () => setStoryIndex(index),
                  }}
                />
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
            fontWeight: isLocationError ? "bold" : "normal",
            transition: "all 0.3s",
          }}
        >
          {storyOpen
            ? "出会い星座モード：左右スワイプで履歴をたどれます"
            : status}
        </div>

        {/* 右下ボタン */}
        {!storyOpen && (
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
        )}

        {/* 下部メニュー */}
        {!storyOpen && (
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
        )}
      </div>

      {/* 上60%のオーバーレイ */}
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