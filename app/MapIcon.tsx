import L from "leaflet";

export const createCustomPin = (imageUrl: string | null) => {
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="45px" height="60px" style="overflow: visible;">
        <ellipse cx="12" cy="30" rx="7" ry="3" fill="black" opacity="0.2" />
        <path 
          d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" 
          fill="#2563eb" 
        />
        <!-- 中心の白い土台（画像がない時はここが真っ白に見えます） -->
        <circle cx="12" cy="11.5" r="8.5" fill="white" />
        
        <defs>
          <clipPath id="avatarClip">
            <circle cx="12" cy="11.5" r="7.5" />
          </clipPath>
        </defs>
        
        <!-- imageUrlがある（Firestoreから取得できた）時だけ画像を表示 -->
        ${imageUrl ? `
          <image 
            x="4.5" y="4" 
            width="15" height="15" 
            href="${imageUrl}" 
            clip-path="url(#avatarClip)" 
            preserveAspectRatio="xMidYMid slice"
          />
        ` : ''}
      </svg>
    `,
    className: "custom-user-pin",
    iconSize: [45, 60],
    iconAnchor: [22.5, 60],
  });
};