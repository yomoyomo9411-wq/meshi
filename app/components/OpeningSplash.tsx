"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onFinish: () => void;
};

export default function OpeningSplash({ onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCanSkip(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  const handleEnded = () => {
    onFinish();
  };

  const handleSkip = () => {
    if (!canSkip) return;
    onFinish();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "black",
        display: "grid",
        placeItems: "center",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source src="/opening.mp4" type="video/mp4" />
      </video>

      <button
        onClick={handleSkip}
        style={{
          position: "absolute",
          right: 16,
          bottom: 24,
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.14)",
          color: "white",
          fontWeight: 800,
          opacity: canSkip ? 1 : 0.5,
        }}
      >
        スキップ
      </button>
    </div>
  );
}