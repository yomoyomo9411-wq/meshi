"use client";

import React from 'react';
import { X } from 'lucide-react';
import { TROPHY_LIST } from './constants';

type Trophy = (typeof TROPHY_LIST)[number];

interface TrophyDetailModalProps {
  trophy: Trophy | null;
  onClose: () => void;
  count: number; // 進捗表示のために現在のカウントも受け取るようにします
}

export const TrophyDetailModal = ({ trophy, onClose, count }: TrophyDetailModalProps) => {
  if (!trophy) return null;

  return (
    <div 
      // ★背景の onClick={onClose} を削除しました
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.85)", // 少し暗めにして集中させる
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: 320,
          background: "#111827", // 少し深みのある色
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 32,
          padding: "40px 24px 24px", // 上を少し広めに
          position: "relative",
          textAlign: "center",
          boxShadow: `0 20px 50px rgba(0,0,0,0.5)`,
        }}
      >
        {/* 閉じるボタン（右上） */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            color: "rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          <X size={20} />
        </button>

        {/* トロフィーアイコン */}
        <div style={{
          width: 100,
          height: 100,
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: `${trophy.color}10`,
          display: "grid",
          placeItems: "center",
          border: `2px solid ${trophy.color}44`,
          boxShadow: `0 0 30px ${trophy.color}22`,
        }}>
          <trophy.icon size={50} color={trophy.color} />
        </div>

        <h3 style={{ fontSize: 24, fontWeight: 900, color: "white", marginBottom: 8 }}>
          {trophy.label}
        </h3>
        
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>
          {trophy.description}
        </p>

        {/* 進捗バーのエリア */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 20,
          padding: "20px 16px",
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
            獲得条件: {trophy.threshold} 人と繋がる
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min((count / trophy.threshold) * 100, 100)}%`,
              background: trophy.color,
              boxShadow: `0 0 15px ${trophy.color}aa`,
            }} />
          </div>
          <div style={{ marginTop: 8, textAlign: "right", fontSize: 12, fontWeight: "bold", color: "white" }}>
            {count} / {trophy.threshold}
          </div>
        </div>

        {/* ★下の閉じるボタンを追加 */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};