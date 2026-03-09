"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import OpeningSplash from "./components/OpeningSplash";

// 地図をSSRしない
const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0b1220",
        color: "white",
      }}
    >
      地図を読み込み中...
    </div>
  ),
});

export default function Home() {
  const [showOpening, setShowOpening] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const played = sessionStorage.getItem("openingPlayed");

    if (!played) {
      setShowOpening(true);
    }

    setChecked(true);
  }, []);

  const finishOpening = () => {
    sessionStorage.setItem("openingPlayed", "true");
    setShowOpening(false);
  };

  if (!checked) return null;

  return (
    <>
      {showOpening && <OpeningSplash onFinish={finishOpening} />}
      {!showOpening && (
        <main style={{ margin: 0, padding: 0 }}>
          <Map />
        </main>
      )}
    </>
  );
}