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

  // 共通フィルター（紫）
const purpleFilter = `
  <filter id="glow-purple" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur stdDeviation="1.0" result="blur1"/>
    <feGaussianBlur stdDeviation="2.8" result="blur2"/>
    <feMerge>
      <feMergeNode in="blur2"/>
      <feMergeNode in="blur2"/>
      <feMergeNode in="blur1"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>`;

// --- 3. 自分の位置（紫の球） ---
export const purpleOrbIcon = typeof window !== "undefined"
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" height="40px" style="overflow: visible;">
          <defs>${purpleFilter}</defs>

          <circle cx="12" cy="12" r="9" fill="#7C3AED" filter="url(#glow-purple)" opacity="0.9"/>
          <circle cx="12" cy="12" r="6" fill="#A78BFA" filter="url(#glow-purple)"/>
          <circle cx="12" cy="12" r="3" fill="white" filter="url(#glow-purple)"/>

        </svg>`,
      className: "custom-orb-icon",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    })
  : null;

  // --- 4. 現在地ピン（青いピン型） ---
export const StarPinIcon = typeof window !== "undefined"
  ? L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="32px" height="42px" style="overflow: visible;">
          <defs>
            <linearGradient id="starNebulaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fee2e2" />
              <stop offset="100%" stop-color="#991b1b" />
            </linearGradient>

            <filter id="whiteAura" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
              <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="white" flood-opacity="0.4"/>
            </filter>

            <filter id="hazyCore" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="5" result="moya" />
            </filter>
          </defs>

          <ellipse cx="12" cy="30" rx="8" ry="3" fill="white" opacity="0.15" filter="blur(3px)" />

          <g filter="url(#whiteAura)">
            <path 
              d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" 
              fill="url(#starNebulaGradient)" 
              opacity="0.95"
            />
          </g>

          <circle cx="12" cy="11" r="10" fill="white" opacity="0.35" filter="url(#hazyCore)" />
          <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.9" filter="blur(1.5px)" />
        </svg>`,
      className: "custom-star-pin",
      iconSize: [27, 37],   // ← 小さくしました
      iconAnchor: [16, 42], // ← 下端の中央に固定
      popupAnchor: [0, -35],
    })
  : null;