"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import QRCode from "qrcode";
import {
  Home,
  CreditCard,
  QrCode,
  MessageCircle,
  IdCard,
} from "lucide-react";

import { auth } from "../lib/firebase";
import { fetchProfile, type ProfileDoc } from "../lib/profileClient";

type TabKey = "home" | "cards" | "scan" | "chat" | "meisi" | null;

export default function ExchangePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [payloadText, setPayloadText] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [pressedTab, setPressedTab] = useState<TabKey>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setProfile(null);
        setQrDataUrl("");
        setPayloadText("");
        setStatus("先にログインしてください（/me でログイン）");
        return;
      }

      setStatus("プロフィールを読み込み中…");
      try {
        const p = await fetchProfile(u.uid);
        setProfile(p);

        const payload = `meshi://profile?uid=${encodeURIComponent(u.uid)}`;
        setPayloadText(payload);

        const url = await QRCode.toDataURL(payload, {
          margin: 1,
          scale: 10,
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(url);

        setStatus("");
      } catch (e) {
        console.error(e);
        setStatus("QR生成に失敗しました。Firestore設定を確認してください。");
      }
    });

    return () => unsub();
  }, []);

  const canShow = useMemo(() => !!user && !!qrDataUrl, [user, qrDataUrl]);

  const navButtonBase: React.CSSProperties = {
    position: "relative",
    padding: "10px 4px",
    minHeight: 64,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "11px",
    cursor: "pointer",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: `
      linear-gradient(135deg,
        rgba(99,102,241,0.22) 0%,
        rgba(168,85,247,0.18) 35%,
        rgba(59,130,246,0.20) 70%,
        rgba(255,255,255,0.08) 100%)
    `,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 0 rgba(255,255,255,0.04),
      0 6px 16px rgba(0,0,0,0.18)
    `,
    transition:
      "transform 0.16s ease, box-shadow 0.18s ease, background 0.18s ease",
  };

  const activeNavButton: React.CSSProperties = {
    ...navButtonBase,
    border: "1px solid rgba(255,255,255,0.24)",
    background: `
      linear-gradient(135deg,
        rgba(129,140,248,0.34) 0%,
        rgba(192,132,252,0.28) 35%,
        rgba(96,165,250,0.32) 70%,
        rgba(255,255,255,0.14) 100%)
    `,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -1px 0 rgba(255,255,255,0.06),
      0 10px 24px rgba(76,110,245,0.28),
      0 2px 10px rgba(168,85,247,0.20)
    `,
  };

  const getPressedButtonStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    if (!isPressed) {
      return isActive ? activeNavButton : navButtonBase;
    }

    return {
      ...(isActive ? activeNavButton : navButtonBase),
      transform: "scale(0.96)",
      boxShadow: isActive
        ? `
          inset 0 1px 0 rgba(255,255,255,0.28),
          0 0 18px rgba(255,255,255,0.24),
          0 0 28px rgba(125,211,252,0.28),
          0 0 40px rgba(168,85,247,0.24)
        `
        : `
          inset 0 1px 0 rgba(255,255,255,0.20),
          0 0 14px rgba(255,255,255,0.18),
          0 0 24px rgba(125,211,252,0.22),
          0 0 34px rgba(168,85,247,0.20)
        `,
    };
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    lineHeight: 1,
    whiteSpace: "nowrap",
    opacity: 0.95,
    transition: "all 0.16s ease",
  };

  const activeLabelStyle: React.CSSProperties = {
    ...labelStyle,
    fontWeight: 800,
    opacity: 1,
  };

  const iconStyle: React.CSSProperties = {
    filter: "drop-shadow(0 0 8px rgba(125,211,252,0.45))",
    transition: "all 0.16s ease",
  };

  const activeIconStyle: React.CSSProperties = {
    filter:
      "drop-shadow(0 0 10px rgba(255,255,255,0.55)) drop-shadow(0 0 14px rgba(96,165,250,0.50))",
    transition: "all 0.16s ease",
  };

  const getPressedLabelStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeLabelStyle : labelStyle;

    if (!isPressed) return base;

    return {
      ...base,
      color: "#ffffff",
      textShadow: `
        0 0 6px rgba(255,255,255,0.95),
        0 0 12px rgba(255,255,255,0.85),
        0 0 18px rgba(253,230,138,0.75),
        0 0 28px rgba(125,211,252,0.55),
        0 0 40px rgba(168,85,247,0.45)
      `,
      letterSpacing: "0.02em",
      transform: "translateY(-1px)",
    };
  };

  const getPressedIconStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeIconStyle : iconStyle;

    if (!isPressed) return base;

    return {
      ...base,
      filter: `
        drop-shadow(0 0 6px rgba(255,255,255,0.95))
        drop-shadow(0 0 14px rgba(253,230,138,0.80))
        drop-shadow(0 0 22px rgba(125,211,252,0.60))
        drop-shadow(0 0 30px rgba(168,85,247,0.45))
      `,
      transform: "scale(1.06)",
    };
  };

  const pressHandlers = (tab: Exclude<TabKey, null>) => ({
    onTouchStart: () => setPressedTab(tab),
    onTouchEnd: () => setPressedTab(null),
    onTouchCancel: () => setPressedTab(null),
    onMouseDown: () => setPressedTab(tab),
    onMouseUp: () => setPressedTab(null),
    onMouseLeave: () => setPressedTab(null),
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        paddingBottom: 128,
        color: "white",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#020617",
        backgroundImage: `
          radial-gradient(circle at 12% 88%, rgba(56,189,248,0.42) 0%, rgba(56,189,248,0.18) 18%, rgba(56,189,248,0.00) 42%),
          radial-gradient(circle at 68% 30%, rgba(168,85,247,0.40) 0%, rgba(168,85,247,0.16) 20%, rgba(168,85,247,0.00) 46%),
          radial-gradient(circle at 82% 12%, rgba(59,130,246,0.24) 0%, rgba(59,130,246,0.10) 16%, rgba(59,130,246,0.00) 36%),
          linear-gradient(180deg, #071224 0%, #040b18 48%, #020617 100%)
        `,
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 120px 80px, rgba(255,255,255,0.85), transparent),
            radial-gradient(1.5px 1.5px at 220px 160px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 320px 60px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 420px 140px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 520px 40px, rgba(255,255,255,0.95), transparent),
            radial-gradient(1.5px 1.5px at 620px 180px, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 720px 100px, rgba(255,255,255,0.9), transparent),
            radial-gradient(1.5px 1.5px at 820px 50px, rgba(255,255,255,0.85), transparent),
            radial-gradient(2px 2px at 920px 170px, rgba(255,255,255,0.95), transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "1000px 220px",
          opacity: 0.9,
        }}
      />

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
        <span className="shooting-star shooting-star-3" />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
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

        <div style={{ fontSize: 18, fontWeight: 800 }}>交換用QR</div>
      </div>

      {status && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {status}
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "grid",
          gap: 12,
          justifyItems: "center",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
        }}
      >
        {!user ? (
          <div style={{ fontWeight: 800, opacity: 0.9 }}>
            ログインが必要です（/me でログイン）
          </div>
        ) : !canShow ? (
          <div style={{ fontWeight: 800, opacity: 0.9 }}>QR生成中…</div>
        ) : (
          <>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              このQRを相手に読み取ってもらってください
            </div>

            <img
              src={qrDataUrl}
              alt="exchange-qr"
              style={{
                width: 280,
                height: 280,
                borderRadius: 16,
                background: "white",
                boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
              }}
            />

            <div
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                QRに紐づくプロフィール（確認用）
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="me"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 800, opacity: 0.8 }}>No</div>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>
                    {profile?.name || "（名前未設定）"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {profile?.affiliation || "（所属未設定）"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>
                  QRの中身（デバッグ用）
                </div>
                <code
                  style={{
                    display: "block",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    background: "rgba(0,0,0,0.35)",
                    padding: 10,
                    borderRadius: 12,
                  }}
                >
                  {payloadText}
                </code>
              </div>
            </div>

            <button
              onClick={() => router.push("/me")}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 14,
                border: "none",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                fontWeight: 900,
              }}
            >
              プロフィールを編集する（/me）
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .shooting-star {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 1);
          box-shadow:
            0 0 10px rgba(255, 255, 255, 1),
            0 0 18px rgba(125, 211, 252, 0.9),
            0 0 30px rgba(56, 189, 248, 0.45);
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
          transform-origin: right center;
          background: linear-gradient(
            270deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(125, 211, 252, 0.55) 25%,
            rgba(125, 211, 252, 0.18) 55%,
            rgba(255, 255, 255, 0) 100%
          );
          filter: blur(1px);
          border-radius: 999px;
        }

        .shooting-star-1 {
          top: 90px;
          left: -140px;
          animation: meteor 7s linear infinite;
          animation-delay: 0s;
        }

        .shooting-star-2 {
          top: 170px;
          left: -240px;
          animation: meteor 8.5s linear infinite;
          animation-delay: 2.2s;
        }

        .shooting-star-3 {
          top: 130px;
          left: -320px;
          animation: meteor 9.2s linear infinite;
          animation-delay: 4.6s;
        }

        @keyframes meteor {
          0% {
            transform: translateX(0) translateY(0) rotate(25deg);
            opacity: 0;
          }
          8% {
            opacity: 0.95;
          }
          18% {
            opacity: 1;
          }
          38% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(1100px) translateY(480px) rotate(25deg);
            opacity: 0;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          left: 10,
          right: 10,
          bottom: 10,
          zIndex: 2000,
          padding: 10,
          borderRadius: 28,
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,0.12) 0%,
              rgba(255,255,255,0.06) 100%)
          `,
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: `
            0 14px 36px rgba(0,0,0,0.30),
            inset 0 1px 0 rgba(255,255,255,0.12)
          `,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={getPressedButtonStyle(false, pressedTab === "home")}
          {...pressHandlers("home")}
        >
          <Home
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "home")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "home")}>
            ホーム
          </span>
        </button>

        <button
          onClick={() => router.push("/cards")}
          style={getPressedButtonStyle(false, pressedTab === "cards")}
          {...pressHandlers("cards")}
        >
          <CreditCard
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "cards")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "cards")}>
            名刺一覧
          </span>
        </button>

        <button
          onClick={() => router.push("/scan")}
          style={getPressedButtonStyle(true, pressedTab === "scan")}
          {...pressHandlers("scan")}
        >
          <QrCode
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(true, pressedTab === "scan")}
          />
          <span style={getPressedLabelStyle(true, pressedTab === "scan")}>
            交換
          </span>
        </button>

        <button
          onClick={() => router.push("/chat")}
          style={getPressedButtonStyle(false, pressedTab === "chat")}
          {...pressHandlers("chat")}
        >
          <MessageCircle
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "chat")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "chat")}>
            チャット
          </span>
        </button>

        <button
          onClick={() => router.push("/meisi")}
          style={getPressedButtonStyle(false, pressedTab === "meisi")}
          {...pressHandlers("meisi")}
        >
          <IdCard
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "meisi")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "meisi")}>
            My名刺
          </span>
        </button>
      </div>
    </div>
  );
}