"use client";

import React from "react";
import { PartyPopper } from "lucide-react";
import { TROPHY_LIST } from "./constants";

export function TrophyUnlockOverlay({ trophyId, onClose }: { trophyId: string | null, onClose: () => void }) {
  const trophy = TROPHY_LIST.find(t => t.id === trophyId);
  if (!trophy) return null;

  const Icon = trophy.icon;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(12px)",
      display: "grid",
      placeItems: "center",
      animation: "fadeIn 0.5s ease-out forwards",
    }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ marginBottom: 20, animation: "popIn 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49)" }}>
          <PartyPopper size={48} color="#fde68a" style={{ margin: "0 auto" }} />
        </div>
        
        <h2 style={{ color: "#fde68a", fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          トロフィー獲得！
        </h2>
        <p style={{ color: "white", fontSize: 14, opacity: 0.8, marginBottom: 32 }}>
          {trophy.description}
        </p>

        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: `4px solid ${trophy.color}`,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 32px",
          boxShadow: `0 0 40px ${trophy.color}88`,
          animation: "float 3s ease-in-out infinite"
        }}>
          <Icon size={60} color={trophy.color} />
        </div>

        <h3 style={{ color: "white", fontSize: 20, fontWeight: 900, marginBottom: 40 }}>
          「{trophy.label}」
        </h3>

        <button
          onClick={onClose}
          style={{
            padding: "14px 40px",
            borderRadius: 999,
            border: "none",
            background: trophy.color,
            color: "black",
            fontWeight: 900,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          閉じる
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 
          0% { transform: scale(0); }
          80% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}