"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LatLngExpression } from "leaflet";

// --- ここからマーカーの設定 ---
// 標準のピンがエラーになるので、手動でアイコンを作成します
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
// --- ここまで ---

export default function MapComponent() {
  const position: LatLngExpression = [35.681236, 139.767125]; // 東京駅

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* icon={customIcon} を追加して、上で作ったアイコンを指定します */}
        <Marker position={position} icon={customIcon}>
          <Popup>東京駅</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}