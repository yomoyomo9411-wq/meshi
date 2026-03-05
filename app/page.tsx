"use client"; // 追加

import dynamic from "next/dynamic";

// 地図を「ブラウザ専用（ssr: false）」として読み込む
const Map = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div style={{ height: "100vh", backgroundColor: "#f3f4f6" }}>地図を読み込み中...</div>
});

export default function Home() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <Map />
    </main>
  );
}