"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";
import {
  Home,
  CreditCard,
  QrCode,
  MessageCircle,
  IdCard,
  Instagram,
  Twitter,
  Link2,
} from "lucide-react";

import { auth } from "../lib/firebase";
import { fetchProfile, type ProfileDoc } from "../lib/profileClient";
import { createEncounter } from "../lib/encounterClient";

const defaultProfile: ProfileDoc = {
  name: "",
  affiliation: "",
  sns: "",
  history: "",
  photoURL: "",
};

type TabKey = "home" | "cards" | "scan" | "chat" | "meisi" | null;

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

export default function ScanPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState("カメラを起動します…");

  const [scannedUid, setScannedUid] = useState("");
  const [scannedProfile, setScannedProfile] =
    useState<ProfileDoc>(defaultProfile);

  const [eventName, setEventName] = useState("");
  const [saving, setSaving] = useState(false);
  const [pressedTab, setPressedTab] = useState<TabKey>(null);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const readerId = "qr-reader-box";

  const snsLinks = useMemo(() => {
    const parsed = parseSns(scannedProfile.sns ?? "");

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
        label: "その他SNS",
        value: parsed.otherSns,
        href: buildHref(parsed.otherSns),
        icon: Link2,
      },
    ].filter((item) => item.value.trim().length > 0 && item.href);
  }, [scannedProfile.sns]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setStatus("先にログインしてください");
      }
    });

    return () => unsub();
  }, []);

  async function stopScannerSafely(scanner: Html5Qrcode | null) {
    if (!scanner) return;

    try {
      await scanner.stop();
    } catch (e) {
      console.warn("scanner.stop failed (ignored):", e);
    }

    try {
      await scanner.clear();
    } catch (e) {
      console.warn("scanner.clear failed (ignored):", e);
    }
  }

  

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    hasScannedRef.current = false;

    async function startScanner() {
      try {
        setStatus("相手のQRを読み取ってください");

        const qr = new Html5Qrcode(readerId);
        qrRef.current = qr;

        await qr.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (cancelled) return;
            if (hasScannedRef.current) return;

            const match = decodedText.match(/^uid:(.+)$/);
            if (!match) {
              setStatus("このQRは対応していません");
              return;
            }

            const uid = match[1];

            if (!user) return;

            if (uid === user.uid) {
              setStatus("自分自身のQRは交換できません");
              return;
            }

            hasScannedRef.current = true;

            const scanner = qrRef.current;
            qrRef.current = null;
            void stopScannerSafely(scanner);

            setStatus("プロフィールを取得しています…");

            try {
              const p = await fetchProfile(uid);

              setScannedUid(uid);
              setScannedProfile({
                name: p?.name ?? "",
                affiliation: p?.affiliation ?? "",
                sns: p?.sns ?? "",
                history: p?.history ?? "",
                photoURL: p?.photoURL ?? "",
              });

              setStatus("読み取り完了。内容を確認して交換してください。");
            } catch (e) {
              console.error(e);
              hasScannedRef.current = false;
              setStatus(
                "プロフィール取得に失敗しました。もう一度読み取ってください。"
              );
            }
          },
          () => {}
        );
      } catch (e) {
        console.error(e);
        setStatus(
          "カメラの起動に失敗しました。カメラ許可を確認してください。"
        );
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      hasScannedRef.current = false;

      if (qrRef.current) {
        const scanner = qrRef.current;
        qrRef.current = null;
        void stopScannerSafely(scanner);
      }
    };
  }, [user]);

  const handleSaveEncounter = async () => {
    if (!user || !scannedUid) return;

    setSaving(true);
    setStatus("現在地を取得しています…");

    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      }).catch(() => {
        throw new Error("LOCATION_ERROR");
      });

      setStatus("交換情報を保存しています…");

      await createEncounter(user.uid, scannedUid, eventName.trim());

      setStatus("交換完了！名刺一覧に追加しました。");

      setTimeout(() => {
        router.push("/cards");
      }, 800);
    } catch (e: any) {
      console.error(e);

      if (e.message === "LOCATION_ERROR") {
        setStatus("位置情報が取得できませんでした。");
        alert(
          "位置情報が取得できなかったため、交換を中断しました。設定を確認してください。"
        );
      } else {
        setStatus("保存に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  };

  const restartScan = () => {
    router.refresh();
    window.location.reload();
  };

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
    color: "#fde68a",
  };

  const iconStyle: React.CSSProperties = {
    filter: "drop-shadow(0 0 8px rgba(125,211,252,0.45))",
    transition: "all 0.16s ease",
  };

  const activeIconStyle: React.CSSProperties = {
        color: "#fde68a",
    filter: `
      drop-shadow(0 0 6px rgba(255,255,255,0.95))
      drop-shadow(0 0 14px rgba(253,230,138,0.80))
      drop-shadow(0 0 22px rgba(125,211,252,0.60))
      drop-shadow(0 0 30px rgba(168,85,247,0.45))
    `,
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
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#020617",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
            radial-gradient(circle at 12% 88%, rgba(56,189,248,0.42) 0%, rgba(56,189,248,0.18) 18%, rgba(56,189,248,0.00) 42%),
            radial-gradient(circle at 68% 30%, rgba(168,85,247,0.40) 0%, rgba(168,85,247,0.16) 20%, rgba(168,85,247,0.00) 46%),
            radial-gradient(circle at 82% 12%, rgba(59,130,246,0.24) 0%, rgba(59,130,246,0.10) 16%, rgba(59,130,246,0.00) 36%),
            linear-gradient(180deg, #071224 0%, #040b18 48%, #020617 100%)
          `,
        }}
      />

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
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>QR読み取り</div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: scannedUid ? "center" : "flex-start",
          padding: 16,
          paddingBottom: 128,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {status}
        </div>

        {!scannedUid ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: 16,
              paddingBottom: 20,
            }}
          >
            <div
              style={{
                marginTop: 16,
                borderRadius: 18,
                overflow: "hidden",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                padding: 12,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
              }}
            >
              <div id={readerId} />
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: 20,
              display: "grid",
              placeItems: "center",
              gap: 16,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18, width: "100%" }}>
              交換相手の名刺
            </div>

            <div
              style={{
                width: "min(92vw, 420px)",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.95 }}>
                イベント
              </div>

              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="例）ハッカソン / 富山市のカフェ / 学園祭（15文字以内）"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  outline: "none",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "min(92vw, 420px)",
                  filter: "drop-shadow(0 12px 34px rgba(0,0,0,0.38))",
                }}
              >
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
                  {scannedProfile.photoURL ? (
                    <img
                      src={scannedProfile.photoURL}
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
                    fontSize: "clamp(26px, 5vw, 42px)",
                    letterSpacing: "0.04em",
                    lineHeight: 1.1,
                  }}
                >
                  {scannedProfile.name || "名前未設定"}
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
                    fontSize: "clamp(9px, 1.7vw, 15px)",
                    lineHeight: 1.24,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {scannedProfile.affiliation || "所属未設定"}
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
                        key={item.label}
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
                            fontSize: "clamp(8px, 1.25vw, 10px)",
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
                    paddingRight: "21%",
                    boxSizing: "border-box",
                    textAlign: "left",
                    fontSize: "clamp(8.5px, 1.45vw, 12px)",
                    lineHeight: 1.28,
                    color: "#4b5563",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {scannedProfile.history || ""}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                width: "min(92vw, 420px)",
              }}
            >
              <button
                onClick={handleSaveEncounter}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "#f59e0b",
                  color: "#111827",
                  fontWeight: 900,
                }}
              >
                交換する
              </button>

              <button
                onClick={restartScan}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  fontWeight: 900,
                }}
              >
                読み直す
              </button>
            </div>
          </div>
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