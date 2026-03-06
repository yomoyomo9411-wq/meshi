import L from "leaflet";

export const blueShinyStarIcon = typeof window !== "undefined" 
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32px" height="42px">
          <!-- ピンの影（少し浮かせるように見せる） -->
          <ellipse cx="12" cy="22" rx="5" ry="2" fill="black" opacity="0.2" />
          <!-- ピンの本体（標準的な青） -->
          <path 
            d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z" 
            fill="#2563eb" 
          />
          <!-- ピンの中央の白い円 -->
          <circle cx="12" cy="8" r="3" fill="white" />
        </svg>
      `,
      className: "custom-standard-pin",
      iconSize: [32, 42],
      iconAnchor: [16, 42], // ピンの先端（下）を正確に現在地に合わせる
      popupAnchor: [0, -40], // ポップアップが出る位置
    })
  : null;