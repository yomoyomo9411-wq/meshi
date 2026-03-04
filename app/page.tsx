"use client";

import dynamic from "next/dynamic";

// さっき作った MapComponent.tsx を読み込む
// ssr: false にすることで、エラーの原因だった「サーバー側での実行」を禁止します
const Map = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <p>地図を読み込み中...</p> 
});

export default function Home() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <h1 style={{ padding: "10px" }}>Meishi Map</h1>
      <Map />
    </main>
  );
}