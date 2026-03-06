"use client";

import { useMemo, useRef } from "react";
import type { EncounterDoc } from "../lib/encounterClient";

type Props = {
  open: boolean;
  items: (EncounterDoc & { id?: string })[];
  currentIndex: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
};

export default function EncounterStoryOverlay({
  open,
  items,
  currentIndex,
  onChangeIndex,
  onClose,
}: Props) {
  const touchStartXRef = useRef<number | null>(null);

  const current = items[currentIndex];

  const formatTime = (createdAt: any) => {
    const sec = createdAt?.seconds;
    if (!sec) return "保存直後";

    return new Date(sec * 1000).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortenAddress = (address?: string) => {
    if (!address) return "住所不明";
    if (address.length <= 42) return address;
    return address.slice(0, 42) + "…";
  };

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < items.length - 1;

  const subtitle = useMemo(() => {
    if (items.length <= 1) return "この出会いの記録";
    if (currentIndex === 0) return "最新の出会い";
    return `${currentIndex + 1}件目 / ${items.length}件`;
  }, [items.length, currentIndex]);

  if (!open || !current) return null;

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartXRef.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? null;
    if (endX == null) return;

    const diff = endX - touchStartXRef.current;

    // 左スワイプ -> 古い履歴
    if (diff < -50 && canNext) {
      onChangeIndex(currentIndex + 1);
    }

    // 右スワイプ -> 新しい履歴
    if (diff > 50 && canPrev) {
      onChangeIndex(currentIndex - 1);
    }

    touchStartXRef.current = null;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        pointerEvents: "none",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60vh",
          padding: 12,
          pointerEvents: "auto",
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.97) 0%, rgba(2,6,23,0.90) 74%, rgba(2,6,23,0.00) 100%)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            position: "relative",
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: "#020617",
            backgroundImage: `
              radial-gradient(circle at 12% 88%, rgba(56, 189, 248, 0.42) 0%, rgba(56, 189, 248, 0.18) 18%, rgba(56, 189, 248, 0.00) 42%),
              radial-gradient(circle at 68% 30%, rgba(168, 85, 247, 0.40) 0%, rgba(168, 85, 247, 0.16) 20%, rgba(168, 85, 247, 0.00) 46%),
              radial-gradient(circle at 82% 12%, rgba(59, 130, 246, 0.24) 0%, rgba(59, 130, 246, 0.10) 16%, rgba(59, 130, 246, 0.00) 36%),
              linear-gradient(180deg, #071224 0%, #040b18 48%, #020617 100%)
            `,
            boxShadow: "0 22px 60px rgba(0,0,0,0.48)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {/* 星空 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `
                radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.95), transparent),
                radial-gradient(2px 2px at 120px 80px, rgba(255,255,255,0.85), transparent),
                radial-gradient(1.5px 1.5px at 220px 160px, rgba(255,255,255,0.9), transparent),
                radial-gradient(2px 2px at 320px 60px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1.5px 1.5px at 420px 140px, rgba(255,255,255,0.9), transparent),
                radial-gradient(2px 2px at 520px 40px, rgba(255,255,255,0.95), transparent)
              `,
              backgroundRepeat: "repeat",
              backgroundSize: "700px 220px",
              opacity: 0.85,
            }}
          />

          {/* ヘッダー */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px 0 18px",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 16,
                  color: "#fde68a",
                  letterSpacing: "0.04em",
                }}
              >
                {current.snapshot?.name || "プロフィール"}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.72)",
                  fontWeight: 700,
                }}
              >
                {subtitle}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                border: "none",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                fontSize: 24,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* 名刺UI */}
          <div
            key={`${current.id ?? "item"}-${currentIndex}`}
            style={{
              marginTop: 8,
              display: "grid",
              placeItems: "center",
              position: "relative",
              zIndex: 1,
              padding: "0 14px 12px 14px",
              animation: "luminaCardSlide 0.28s ease",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "min(92vw, 430px)",
                filter: "drop-shadow(0 12px 34px rgba(0,0,0,0.38))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/card-base.png"
                alt="card-base"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 24,
                }}
              />

              {/* 上部情報バー */}
              <div
                style={{
                  position: "absolute",
                  top: "1.2%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "92%",
                  borderRadius: 16,
                  padding: "8px 12px",
                  background: "rgba(7,18,36,0.66)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
                  color: "white",
                  fontSize: "clamp(9px, 1.55vw, 11px)",
                  lineHeight: 1.45,
                  backdropFilter: "blur(6px)",
                  display: "grid",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(12px, 2vw, 15px)",
                    fontWeight: 700,
                  }}
                >
                  {formatTime(current.createdAt)}
                </div>

                <div
                  style={{
                    opacity: 0.92,
                    wordBreak: "break-word",
                  }}
                >
                  {shortenAddress(current.address)}
                </div>
              </div>

              {/* アイコン */}
              <div
                style={{
                  position: "absolute",
                  top: "15.6%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "23.8%",
                  aspectRatio: "1 / 1",
                  borderRadius: "999px",
                  overflow: "hidden",
                  background: "#241672",
                  boxShadow:
                    "0 0 0 6px rgba(255,214,94,0.35), 0 0 30px rgba(255,214,94,0.55), 0 0 70px rgba(255,214,94,0.35)",
                }}
              >
                {current.snapshot?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.snapshot.photoURL}
                    alt="profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : null}
              </div>

              {/* 名前 */}
              <div
                style={{
                  position: "absolute",
                  top: "35.2%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "78%",
                  textAlign: "center",
                  color: "#22196f",
                  fontWeight: 900,
                  fontSize: "clamp(26px, 5vw, 42px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                }}
              >
                {current.snapshot?.name || "名前未設定"}
              </div>

              {/* 所属 */}
              <div
                style={{
                  position: "absolute",
                  top: "43.2%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "72%",
                  textAlign: "center",
                  color: "#1f174d",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 2vw, 17px)",
                  lineHeight: 1.35,
                }}
              >
                {current.snapshot?.affiliation || "所属未設定"}
              </div>

              {/* SNS */}
              <div
                style={{
                  position: "absolute",
                  top: "60%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "76%",
                  textAlign: "center",
                  fontSize: "clamp(11px, 1.9vw, 16px)",
                  lineHeight: 1.35,
                  color: "#4b5563",
                  wordBreak: "break-word",
                }}
              >
                {current.snapshot?.sns || ""}
              </div>

              {/* 活動履歴 */}
              <div
                style={{
                  position: "absolute",
                  top: "68%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "76%",
                  textAlign: "center",
                  fontSize: "clamp(10px, 1.8vw, 15px)",
                  lineHeight: 1.45,
                  color: "#4b5563",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {current.snapshot?.history || ""}
              </div>
            </div>
          </div>

          {/* 履歴切り替え */}
          {items.length > 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 10,
                zIndex: 1,
                padding: "0 16px 0 16px",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => canPrev && onChangeIndex(currentIndex - 1)}
                  disabled={!canPrev}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "none",
                    background: canPrev
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(255,255,255,0.06)",
                    color: canPrev ? "white" : "rgba(255,255,255,0.4)",
                    fontWeight: 900,
                  }}
                >
                  ← 新しい
                </button>

                <div
                  style={{
                    minWidth: 86,
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fde68a",
                  }}
                >
                  {currentIndex + 1} / {items.length}
                </div>

                <button
                  type="button"
                  onClick={() => canNext && onChangeIndex(currentIndex + 1)}
                  disabled={!canNext}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "none",
                    background: canNext
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(255,255,255,0.06)",
                    color: canNext ? "white" : "rgba(255,255,255,0.4)",
                    fontWeight: 900,
                  }}
                >
                  古い →
                </button>
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                左右にスワイプして履歴を切り替え
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes luminaCardSlide {
          0% {
            opacity: 0.4;
            transform: translateX(22px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}