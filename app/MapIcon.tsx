import L from "leaflet";

// 共通のフィルター設定（青用）
const blueFilter = `
  <filter id="glow-blue" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur stdDeviation="1.0" result="blur1"/>
    <feGaussianBlur stdDeviation="2.8" result="blur2"/>
    <feMerge>
      <feMergeNode in="blur2"/><feMergeNode in="blur2"/><feMergeNode in="blur1"/><feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>`;

// 共通のフィルター設定（黄色用）
const yellowFilter = `
  <filter id="glow-yellow" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur stdDeviation="1.0" result="blur1"/>
    <feGaussianBlur stdDeviation="2.8" result="blur2"/>
    <feMerge>
      <feMergeNode in="blur2"/><feMergeNode in="blur2"/><feMergeNode in="blur1"/><feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>`;

// --- 1. キラキラ星（青） ---
export const blueShinyStarIcon = typeof window !== "undefined"
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" height="40px" style="overflow: visible;">
          <defs>${blueFilter}</defs>
          <path d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" fill="#2563EB" filter="url(#glow-blue)" opacity="0.9" transform="scale(1.4) translate(-3.4, -3.4)"/>
          <path d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" fill="#60A5FA" filter="url(#glow-blue)" transform="scale(1.1) translate(-1.1, -1.1)"/>
          <path d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" fill="white" filter="url(#glow-blue)"/>
          <rect x="11.85" y="6" width="0.3" height="12" fill="white" filter="url(#glow-blue)" />
          <rect x="6" y="11.85" width="12" height="0.3" fill="white" filter="url(#glow-blue)" />
        </svg>`,
      className: "custom-star-icon",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    })
  : null;

// --- 2. キラキラ星（黄） ---
export const yellowShinyStarIcon = typeof window !== "undefined"
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" height="40px" style="overflow: visible;">
          <defs>${yellowFilter}</defs>
          <path d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" fill="#D97706" filter="url(#glow-yellow)" opacity="0.9" transform="scale(1.4) translate(-3.4, -3.4)"/>
          <path d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" fill="#FBBF24" filter="url(#glow-yellow)" transform="scale(1.1) translate(-1.1, -1.1)"/>
          <path d="M12 0c0 9 3 12 12 12c-9 0-12 3-12 12c0-9-3-12-12-12c9 0 12-3 12-12z" fill="white" filter="url(#glow-yellow)"/>
          <rect x="11.85" y="6" width="0.3" height="12" fill="white" filter="url(#glow-yellow)" />
          <rect x="6" y="11.85" width="12" height="0.3" fill="white" filter="url(#glow-yellow)" />
        </svg>`,
      className: "custom-star-icon",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    })
  : null;