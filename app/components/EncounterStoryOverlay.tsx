"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Instagram, Twitter, Link2, Github } from "lucide-react";
import type { EncounterDoc } from "../lib/encounterClient";

function AutoFontDiv({
  text,
  currentIndex,
}: {
  text: string;
  currentIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(20);

  useEffect(() => {
    const resizeText = () => {
      if (!containerRef.current || !textRef.current) return;

      const maxWidth = containerRef.current.offsetWidth - 4;
      const maxHeight = containerRef.current.offsetHeight - 2;

      let size = 24;
      const minSize = 12;

      textRef.current.style.fontSize = size + "px";

      while (
        (textRef.current.scrollWidth > maxWidth ||
          textRef.current.scrollHeight > maxHeight) &&
        size > minSize
      ) {
        size -= 1;
        textRef.current.style.fontSize = size + "px";
      }

      setFontSize(size);
    };

    resizeText();
    const timer = setTimeout(resizeText, 50);
    return () => clearTimeout(timer);
  }, [text, currentIndex]);

  let textColor = "#ffffff";
  if (text !== "記録なし") {
    textColor = currentIndex === 0 ? "#fde68a" : "#38bdf8";
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: "52%",
        top: 0,
        bottom: 0,
        transform: "translateX(-50%)",
        width: "210px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <div
        ref={textRef}
        style={{
          fontWeight: 900,
          fontSize,
          lineHeight: 1.1,
          textShadow: "0 0 12px rgba(0,0,0,0.5)",
          color: textColor,
          wordBreak: "normal",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  items: (EncounterDoc & { id?: string })[];
  currentIndex: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
};

function parseSns(raw?: string) {
  if (!raw?.trim()) {
    return {
      instagram: "",
      x: "",
      otherSns: "",
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      instagram: parsed?.instagram ?? "",
      x: parsed?.x ?? "",
      otherSns: parsed?.otherSns ?? "",
    };
  } catch {
    return {
      instagram: "",
      x: "",
      otherSns: raw ?? "",
    };
  }
}

function buildHref(value: string) {
  const s = value.trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.includes(".")) return `https://${s}`;
  return "";
}

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

  const snsLinks = useMemo(() => {
    const parsed = parseSns(current?.snapshot?.sns ?? "");

    return [
      {
        label: "Instagram",
        value: parsed.instagram,
        href: buildHref(parsed.instagram),
        icon: Instagram,
      },
      {
        label: "X",
        value: parsed.x,
        href: buildHref(parsed.x),
        icon: Twitter,
      },
      {
        label: "GitHub",
        value: parsed.otherSns,
        href: buildHref(parsed.otherSns),
        icon: Github,
      },
      {
        label: "Link",
        value: parsed.otherSns,
        href: buildHref(parsed.otherSns),
        icon: Link2,
      },
    ]
      .filter((item) => item.value.trim().length > 0 && item.href)
      .filter((item, _index, arr) => {
        if (item.label !== "Link") return true;
        return !arr.some((x) => x.label === "GitHub");
      });
  }, [current?.snapshot?.sns]);

  const snapshotCardBaseSrc = useMemo(() => {
    if (current?.snapshot?.cardDesign === "card-base3") {
      return "/card-base3.png";
    }
    if (current?.snapshot?.cardDesign === "card-base2") {
      return "/cars-base2.png";
    }
    return "/card-base.png";
  }, [current?.snapshot?.cardDesign]);

  if (!open || !current) return null;

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartXRef.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? null;
    if (endX == null) return;

    const diff = endX - touchStartXRef.current;

    if (diff < -50 && canNext) {
      onChangeIndex(currentIndex + 1);
    }

    if (diff > 50 && canPrev) {
      onChangeIndex(currentIndex - 1);
    }

    touchStartXRef.current = null;
  };

  const eventLabel = current.eventName?.trim() || "";

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

          {/* イベント名 + 閉じるボタン */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              minHeight: 60,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                opacity: 0.7,
                color: "#ffffff",
                zIndex: 2,
              }}
            >
              イベント名：
            </div>

            <AutoFontDiv
              text={eventLabel || "記録なし"}
              currentIndex={currentIndex}
            />

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                fontSize: 22,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              ×
            </button>
          </div>

          <div
            key={`${current.id ?? "item"}-${currentIndex}`}
            style={{
              marginTop: -8,
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
                width: "min(78vw, 370px)",
                filter: "drop-shadow(0 12px 34px rgba(0,0,0,0.38))",
              }}
            >
              <img
                src={snapshotCardBaseSrc}
                alt="card-base"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 24,
                }}
              />

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
                  fontSize: "clamp(8px, 1.35vw, 10px)",
                  lineHeight: 1.4,
                  backdropFilter: "blur(6px)",
                  display: "grid",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(11px, 1.8vw, 14px)",
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
                    currentIndex === 0
                      ? "0 0 0 6px rgba(255,214,94,0.35), 0 0 30px rgba(255,214,94,0.55), 0 0 70px rgba(255,214,94,0.35)"
                      : "0 0 0 6px rgba(125,211,252,0.35), 0 0 30px rgba(125,211,252,0.55), 0 0 70px rgba(125,211,252,0.35)",
                }}
              >
                {current.snapshot?.photoURL ? (
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
                  fontSize: "clamp(22px, 4.1vw, 36px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                }}
              >
                {current.snapshot?.name || "名前未設定"}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "39.9%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "74%",
                  textAlign: "center",
                  color: "#1f174d",
                  fontWeight: 600,
                  fontSize: "clamp(8px, 1.45vw, 13px)",
                  lineHeight: 1.24,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {current.snapshot?.affiliation || "所属未設定"}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "47.3%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "74%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                {snsLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      style={{
                        width: 58,
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "999px",
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(255,255,255,0.72)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
                        }}
                      >
                        <Icon
                          size={18}
                          strokeWidth={2.2}
                          style={{ color: "#374151" }}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: "clamp(8px, 1.1vw, 9px)",
                          lineHeight: 1.15,
                          fontWeight: 700,
                          color: "#4b5563",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </div>
                    </a>
                  );
                })}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "60.2%",
                  left: "8%",
                  width: "84%",
                  textAlign: "left",
                  fontSize: "clamp(7.5px, 1.15vw, 10px)",
                  lineHeight: 1.24,
                  color: "#4b5563",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {current.snapshot?.history || ""}
              </div>
            </div>
          </div>

          {items.length > 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 2,
                zIndex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: currentIndex === 0 ? "#fde68a" : "#ffffff",
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  textShadow:
                    currentIndex === 0
                      ? "0 0 8px rgba(253,230,138,0.6)"
                      : "none",
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.2),
                    0 6px 16px rgba(0,0,0,0.4)
                  `,
                }}
              >
                {currentIndex === 0
                  ? "NEW!"
                  : `${currentIndex + 1} / ${items.length}`}
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