"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { EncounterDoc } from "../lib/encounterClient";

import { TROPHY_LIST } from "../achivements/constants"; // パスは適宜調整してください
import { fetchLatestCardsByOwner } from "../lib/encounterClient";
import { Fragment } from "react";

type Props = {
  open: boolean;
  items: (EncounterDoc & { id?: string })[];
  currentIndex: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
};

export default function EncounterProfileModal({
  open,
  items,
  currentIndex,
  onChangeIndex,
  onClose,
  
}: Props) {
  const touchStartXRef = useRef<number | null>(null);

  const current = items[currentIndex];

  const [otherCardCount, setOtherCardCount] = useState(0);

  // 🟢 この画面が開いたとき or 履歴を切り替えたときに相手の枚数を数える
  useEffect(() => {
    if (open && current?.otherUid) {
      fetchLatestCardsByOwner(current.otherUid).then((cards) => {
        setOtherCardCount(cards.length);
      });
    }
  }, [open, current?.otherUid]);

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

  // 長すぎるときは先頭を優先して短縮
  if (address.length <= 42) return address;

  return address.slice(0, 42) + "…";
};

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < items.length - 1;

  const labelText = useMemo(() => {
    if (items.length <= 1) return "当時のプロフィール";
    if (currentIndex === 0) return "最新のプロフィール";
    return `${currentIndex + 1}件目の履歴`;
  }, [items.length, currentIndex]);

  if (!open || !current) return null;

  const handlePrev = () => {
    if (!canPrev) return;
    onChangeIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    onChangeIndex(currentIndex + 1);
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartXRef.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? null;
    if (endX == null) return;

    const diff = endX - touchStartXRef.current;

    // 左へスワイプ -> 次（古い履歴）
    if (diff < -50 && canNext) {
      onChangeIndex(currentIndex + 1);
    }

    // 右へスワイプ -> 前（新しい履歴）
    if (diff > 50 && canPrev) {
      onChangeIndex(currentIndex - 1);
    }

    touchStartXRef.current = null;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          width: "min(94vw, 460px)",
          maxHeight: "92vh",
          overflow: "auto",
          position: "relative",
          borderRadius: 28,
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
        {/* 星空レイヤ */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: 28,
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
            padding: "16px 16px 0 16px",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: 14,
              color: "#fde68a",
              letterSpacing: "0.04em",
            }}
          >
            {labelText}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "none",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* 名刺本体 */}
        <div
          style={{
            marginTop: 10,
            display: "grid",
            placeItems: "center",
            position: "relative",
            zIndex: 1,
            padding: "0 14px 14px 14px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 420,
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

            <div style={{
              position: "absolute",
              left: "8%",
              bottom: "5%",
              width: "45%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "5px",
              zIndex: 10,
            }}>
              {TROPHY_LIST.map((t) => {
                const isUnlocked = otherCardCount >= t.threshold; // ★相手用なので otherCardCount
                const Icon = t.icon;
                return (
                  <div key={t.id} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: isUnlocked ? 1 : 0.25,
                    filter: isUnlocked ? `drop-shadow(0 0 5px ${t.color}aa)` : "none",
                  }}>
                    <Icon size={18} color={isUnlocked ? t.color : "#4b5563"} strokeWidth={isUnlocked ? 2.5 : 1.2} fill="none" />
                  </div>
                );
              })}
            </div>

{/* 上部：交換時間・場所 */}
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
    fontSize: "clamp(10px, 1.8vw, 13px)",
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
                top: "13.2%",
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
                top: "31.8%",
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
                top: "40%",
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
                top: "58.5%",
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

            {/* 履歴 */}
           {/* 1. 活動履歴：縦は中央揃え、横は左揃え */}
            <div
              style={{
                position: "absolute",
                top: "57%",
                left: "12%",     // ★左側に少し余白を作る
                width: "76%",    // ★横幅を少し絞ってバランスを調整
                height: "18%",
                display: "flex",
                alignItems: "center",     // ★縦方向は中央揃え
                justifyContent: "center", // ★文章ブロック自体は真ん中に配置
                
                // ★ここがポイント：横方向のテキストを左揃えにする
                textAlign: "left", 
                
                fontSize: "clamp(9px, 1.4vw, 11px)",
                lineHeight: 1.5,
                color: "#4b5563",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <div style={{ width: "100%" }}>
                {/* 200文字制限 */}
                {current.snapshot?.history ? current.snapshot.history.slice(0, 200) : ""}
              </div>
            </div>

            {/* 2. トロフィー一覧：サイズアップ ＆ 存在感強化 */}
            <div style={{
              position: "absolute",
              left: "20%",
              bottom: "20%",   // QRコードの頭と高さを合わせる
              width: "50%",    // 横幅を少し広げてゆったり並べる
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "10px",     // 間隔を少し広げて見やすく
              zIndex: 10,
              // ★隠し味：トロフィーの下にうっすらと高級感のある影を置く
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
            }}>
              {TROPHY_LIST.map((t) => {
                // 自分の名刺なら cardCount、相手なら otherCardCount にしてください
                const isUnlocked = otherCardCount >= t.threshold; 
                const Icon = t.icon;
                return (
                  <div key={t.id} style={{ 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // 獲得済みはクッキリ、未獲得はシルエットとして存在感を残す
                    opacity: isUnlocked ? 1 : 0.2,
                    // ★獲得済みはネオンのような強い光を放つ
                    filter: isUnlocked 
                      ? `drop-shadow(0 0 10px ${t.color}) drop-shadow(0 0 20px ${t.color}44)` 
                      : "none",
                    transition: "all 0.3s ease"
                  }}>
                    <Icon 
                      size={26} // ★デカくしました！（18 -> 26）
                      color={isUnlocked ? t.color : "#4b5563"} 
                      // 線の太さを上げて存在感を出す
                      strokeWidth={isUnlocked ? 2.8 : 1.5} 
                      fill="none" 
                    />
                  </div>
                );
              })}
            </div>

            {/* --- この下にQRコードのボタンが続きます --- */}

            position: "absolute",
            </div>
        </div>

        {/* 履歴ナビゲーション */}
        {items.length > 1 && (
          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: "0 16px 16px 16px",
              display: "grid",
              gap: 10,
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
                ← 新しい履歴
              </button>

              <div
                style={{
                  minWidth: 90,
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
                古い履歴 →
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                opacity: 0.75,
                color: "white",
              }}
            >
              左右にスワイプして履歴を切り替えられます
            </div>
          </div>
        )}
      </div>
    </div>
  );
}