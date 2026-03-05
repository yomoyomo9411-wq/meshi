import L from "leaflet";

export const blueShinyStarIcon = typeof window !== "undefined" 
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" height="40px" style="overflow: visible;">
          <defs>
            <!-- 小さなサイズでもシャープに光るよう調整したフィルター -->
            <filter id="luminous-glow-tiny" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1.0" result="blur1"/> <!-- 芯：よりシャープに -->
              <feGaussianBlur stdDeviation="2.8" result="blur2"/> <!-- 広がり：控えめに -->
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- 1. 背面：青いオーラ（サイズに合わせてスケール調整） -->
          <path 
            d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" 
            fill="#2563eb" 
            filter="url(#luminous-glow-tiny)" 
            opacity="0.9"
            transform="scale(1.4) translate(-3.4, -3.4)"
          />

          <!-- 2. 中面：鮮やかな水色 -->
          <path 
            d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" 
            fill="#60a5fa" 
            filter="url(#luminous-glow-tiny)" 
            transform="scale(1.1) translate(-1.1, -1.1)"
          />

          <!-- 3. 前面：白い星本体 -->
          <path 
            d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" 
            fill="white" 
            filter="url(#luminous-glow-tiny)"
          />

          <!-- 4. 中心：鋭い十字（細さを維持してキラキラ感を出す） -->
          <rect x="11.85" y="6" width="0.3" height="12" fill="white" filter="url(#luminous-glow-tiny)" />
          <rect x="6" y="11.85" width="12" height="0.3" fill="white" filter="url(#luminous-glow-tiny)" />
        </svg>
      `,
      className: "custom-star-icon",
      iconSize: [40, 40], // 50から40にサイズダウン
      iconAnchor: [20, 20], // アンカーも中心に合わせる
    })
  : null;