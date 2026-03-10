"use client";

import { useEffect, useRef, useState } from "react";

export default function OpeningSplash({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSkip(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, []);

  const finishSafely = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onFinish();
    }, 280);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        overflow: "hidden",
        opacity: isClosing ? 0 : 1,
        transition: "opacity 0.28s ease",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finishSafely}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          backgroundColor: "#000",
        }}
      >
        <source src="/opening.mp4" type="video/mp4" />
      </video>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.00) 30%, rgba(0,0,0,0.10) 65%, rgba(0,0,0,0.38) 100%)",
        }}
      />

      <button
        onClick={finishSafely}
        style={{
          position: "absolute",
          right: "max(12px, env(safe-area-inset-right))",
          bottom: "max(18px, calc(env(safe-area-inset-bottom) + 12px))",
          padding: "10px 14px",
          minHeight: 42,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(255,255,255,0.14)",
          color: "white",
          fontWeight: 800,
          fontSize: 13,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: showSkip ? 1 : 0,
          transform: showSkip ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          cursor: "pointer",
          maxWidth: "calc(100vw - 24px)",
        }}
      >
        スキップ
      </button>
    </div>
  );
}