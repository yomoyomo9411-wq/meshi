"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <p style={{ padding: 12 }}>地図を読み込み中...</p>,
});

export default function Home() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <Map />
    </main>
  );
}