"use client";

import React, { useState } from "react"; // useStateを追加
import { TROPHY_LIST } from "./constants";
import { X } from "lucide-react"; // 閉じるボタン用にインポート（なければ既存のアイコンライブラリに合わせてください）

export function TrophyGallery({ count }: { count: number }) {
  // 選択されたトロフィーを管理するステート
  const [selectedTrophy, setSelectedTrophy] = useState<null | (typeof TROPHY_LIST)[0]>(null);

  return (
    <>
      <div style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 24,
        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: "#fde68a", textAlign: "center" }}>
          🏆 獲得トロフィー
        </div>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}>
          {TROPHY_LIST.map((t) => {
            const isUnlocked = count >= t.threshold;
            const Icon = t.icon;
            
            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedTrophy(t)} // クリックでステート更新
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer", // クリックできることを示す
                  transition: "transform 0.1s active",
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: isUnlocked ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
                  display: "grid",
                  placeItems: "center",
                  border: isUnlocked ? `2px solid ${t.color}` : "2px solid rgba(255,255,255,0.1)",
                  filter: isUnlocked ? `drop-shadow(0 0 12px ${t.color}88)` : "grayscale(1) opacity(0.2)",
                }}>
                  <Icon size={32} color={isUnlocked ? t.color : "#fff"} />
                </div>
                <div style={{ 
                  fontSize: 10, 
                  textAlign: "center", 
                  fontWeight: 800, 
                  color: isUnlocked ? "white" : "rgba(255,255,255,0.3)" 
                }}>
                  {t.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedTrophy && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} // モーダル内のクリックは無視
            style={{
              width: "100%",
              maxWidth: 320,
              background: "#0f172a", // 深い紺色
              border: `1px solid ${selectedTrophy.color}44`,
              borderRadius: 32,
              padding: 32,
              position: "relative",
              textAlign: "center",
              boxShadow: `0 0 30px ${selectedTrophy.color}22`,
            }}
          >
            {/* 閉じるボタン */}
            <button 
              onClick={() => setSelectedTrophy(null)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                color: "rgba(255,255,255,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
            >
              <X size={24} />
            </button>

            {/* トロフィーアイコン大 */}
            <div style={{
              width: 96,
              height: 96,
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: `${selectedTrophy.color}15`,
              display: "grid",
              placeItems: "center",
              border: `2px solid ${selectedTrophy.color}`,
              boxShadow: `0 0 20px ${selectedTrophy.color}44`,
            }}>
              <selectedTrophy.icon size={48} color={selectedTrophy.color} />
            </div>

            <h3 style={{ 
              fontSize: 22, 
              fontWeight: 900, 
              color: selectedTrophy.color,
              marginBottom: 12
            }}>
              {selectedTrophy.label}
            </h3>
            
            <p style={{ 
              fontSize: 14, 
              color: "#cbd5e1", 
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              {selectedTrophy.description}
            </p>

            {/* 進捗状況バー */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.5)"
            }}>
              獲得条件: {selectedTrophy.threshold} 人と繋がる
              <div style={{
                height: 6,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 3,
                marginTop: 8,
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min((count / selectedTrophy.threshold) * 100, 100)}%`,
                  background: selectedTrophy.color,
                  boxShadow: `0 0 10px ${selectedTrophy.color}`,
                  transition: "width 1s ease-out"
                }} />
              </div>
              <div style={{ marginTop: 6, textAlign: "right" }}>
                {count} / {selectedTrophy.threshold}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// MiniTrophyShelf はそのまま（変更なし）
function MiniTrophyShelf({ count }: { count: number }) {
  // ... (既存のコード)
}