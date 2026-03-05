import L from "leaflet";

export const blueShinyStarIcon = typeof window !== "undefined" 
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50px" height="50px" style="overflow: visible;">
          <defs>
            <!-- 輝きを凝縮し、発光を強めるフィルター -->
            <filter id="luminous-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1.5" result="blur1"/> <!-- 芯の光 -->
              <feGaussianBlur stdDeviation="4" result="blur2"/>   <!-- 広がる光 -->
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur2"/> <!-- 青い光を2層重ねて濃くする -->
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/> <!-- 本体の星 -->
              </feMerge>
            </filter>
          </defs>

          <!-- 1. 最背面：広範囲に広がる鮮やかな青いオーラ -->
          <path 
            d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" 
            fill="#2563eb" 
            filter="url(#luminous-glow)" 
            opacity="0.9"
            transform="scale(1.5) translate(-4, -4)"
          />

          <!-- 2. 中面：さらに眩しい水色の輝き -->
          <path 
            d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" 
            fill="#60a5fa" 
            filter="url(#luminous-glow)" 
            transform="scale(1.1) translate(-1.1, -1.1)"
          />

          <!-- 3. 前面：最も鋭く光る白い星（本体） -->
          <path 
            d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" 
            fill="white" 
            filter="url(#luminous-glow)"
          />

          <!-- 4. 中心：突き抜けるような光のライン（細く、鋭く） -->
          <rect x="11.8" y="5" width="0.4" height="14" fill="white" filter="url(#luminous-glow)" />
          <rect x="5" y="11.8" width="14" height="0.4" fill="white" filter="url(#luminous-glow)" />
        </svg>
      `,
      className: "custom-star-icon",
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    })
  : null;