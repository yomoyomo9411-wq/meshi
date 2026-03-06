"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

import { LatLngExpression } from "leaflet";

const MapContainer: any = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer: any = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker: any = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup: any = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function Map() {
  const position: LatLngExpression = [35.681236, 139.767125];

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer 
  attribution='&copy; <a href="http://jawg.io">&copy; <b>Jawg</b>Maps</a>'
  url="https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=NHWvUktBDK3kzJjFz7kRdQH1LCdExfAWu2A3Z7IhtcZIH68tQsv9PUk517dyDtPP"
/>
      <Marker position={position}>
        <Popup>東京駅</Popup>
      </Marker>
    </MapContainer>
  );
}
