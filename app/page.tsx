"use client";

import dynamic from "next/dynamic";

// 地図コンポーネントをサーバー側で読み込まない（ssr: false）
const Map = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: "100vh", width: "100vw", display: "flex", 
      justifyContent: "center", alignItems: "center", 
      backgroundColor: "#0b1220", color: "white" 
    }}>
      地図を読み込み中...
    </div>
  )
});

export default function Home() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <Map />
    </main>
  );
}