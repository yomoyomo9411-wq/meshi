"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../lib/firebase";
import {
  fetchLatestCardsByOwner,
  markEncountersAsRead,
} from "../lib/encounterClient";

export default function CardsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBanner, setShowNewBanner] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchLatestCardsByOwner(u.uid);
        setCards(data);

        const hasUnread = data.some((item) => item.isUnread === true);
        setShowNewBanner(hasUnread);

        if (hasUnread) {
          await markEncountersAsRead(u.uid);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const formatTime = (createdAt: any) => {
    const sec = createdAt?.seconds;
    if (!sec) return "保存直後";
    return new Date(sec * 1000).toLocaleString("ja-JP");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        padding: 16,
        position: "relative",
        overflow: "hidden",

        backgroundColor: "#020617",
        backgroundImage: `
          radial-gradient(circle at 12% 88%, rgba(56,189,248,0.40), transparent 40%),
          radial-gradient(circle at 68% 30%, rgba(168,85,247,0.40), transparent 45%),
          radial-gradient(circle at 82% 12%, rgba(59,130,246,0.25), transparent 40%),
          linear-gradient(180deg,#071224 0%,#040b18 50%,#020617 100%)
        `,
      }}
    >
      {/* 星背景 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 120px 80px, white, transparent),
            radial-gradient(1.5px 1.5px at 220px 160px, white, transparent),
            radial-gradient(2px 2px at 320px 60px, white, transparent),
            radial-gradient(1.5px 1.5px at 420px 140px, white, transparent),
            radial-gradient(2px 2px at 520px 40px, white, transparent),
            radial-gradient(1.5px 1.5px at 620px 180px, white, transparent),
            radial-gradient(2px 2px at 720px 100px, white, transparent),
            radial-gradient(1.5px 1.5px at 820px 50px, white, transparent),
            radial-gradient(2px 2px at 920px 170px, white, transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "1000px 220px",
          opacity: 0.8,
        }}
      />

      {/* 流れ星 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <span className="shooting-star shooting-star-1" />
        <span className="shooting-star shooting-star-2" />
      </div>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "none",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            fontWeight: 700,
          }}
        >
          ← 地図へ
        </button>

        <div style={{ fontSize: 18, fontWeight: 900 }}>名刺一覧</div>
      </div>

      {showNewBanner && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "linear-gradient(90deg,#f59e0b,#fde68a)",
            color: "#111827",
            fontWeight: 900,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          新しい名刺が追加されました
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 16 }}>読み込み中…</div>
      ) : cards.length === 0 ? (
        <div style={{ marginTop: 16, opacity: 0.85 }}>
          まだ交換した名刺がありません。
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
          {cards.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/?focusOtherUid=${item.otherUid}&from=cards`)}
              style={{
                borderRadius: 18,
                padding: 16,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(6px)",
                display: "grid",
                gap: 12,
                textAlign: "left",
                color: "white",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.snapshot?.photoURL ? (
                    <img
                      src={item.snapshot.photoURL}
                      alt="snapshot"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 800, opacity: 0.85 }}>No</div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {item.snapshot?.name || "名前未設定"}
                  </div>
                  <div style={{ opacity: 0.85, marginTop: 4 }}>
                    {item.snapshot?.affiliation || "所属未設定"}
                  </div>
                </div>
              </div>

              {item.snapshot?.history?.trim() && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                  }}
                >
                  {item.snapshot.history}
                </div>
              )}

              <div style={{ fontSize: 13, opacity: 0.85 }}>
                最新の交換時間：{formatTime(item.createdAt)}
              </div>

              <div style={{ fontSize: 13, opacity: 0.85 }}>
                最新の交換場所：{item.address || "住所不明"}
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .shooting-star {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: white;
          box-shadow: 0 0 10px white;
          opacity: 0;
        }

        .shooting-star::after {
          content: "";
          position: absolute;
          top: 50%;
          right: 2px;
          width: 140px;
          height: 2px;
          transform: translateY(-50%);
          background: linear-gradient(
            270deg,
            rgba(255, 255, 255, 0.9),
            rgba(125, 211, 252, 0.4),
            transparent
          );
          border-radius: 999px;
        }

        .shooting-star-1 {
          top: 100px;
          left: -200px;
          animation: meteor 8s linear infinite;
        }

        .shooting-star-2 {
          top: 200px;
          left: -300px;
          animation: meteor 9s linear infinite;
          animation-delay: 3s;
        }

        @keyframes meteor {
          0% {
            transform: translateX(0) translateY(0) rotate(25deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateX(1100px) translateY(450px) rotate(25deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}