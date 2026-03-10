"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  Home,
  CreditCard,
  QrCode,
  MessageCircle,
  IdCard,
  Instagram,
  Twitter,
  Github,
  Link as LinkIcon,
} from "lucide-react";

import { auth } from "../lib/firebase";
import {
  fetchProfile,
  type ProfileDoc,
  type CardDesignType,
} from "../lib/profileClient";

const defaultProfile: ProfileDoc & { cardDesign: CardDesignType } = {
  name: "",
  affiliation: "",
  sns: "",
  history: "",
  photoURL: "",
  cardDesign: "card-base",
};

type TabKey = "home" | "cards" | "scan" | "chat" | "meisi" | null;

type SnsItem = {
  href: string;
  label: string;
  icon: typeof Instagram;
};

function normalizeHref(value: string) {
  const s = value.trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.includes(".")) return `https://${s}`;
  return "";
}

export default function MeisiPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] =
    useState<ProfileDoc & { cardDesign: CardDesignType }>(defaultProfile);

  const [loadedAuth, setLoadedAuth] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrText, setQrText] = useState<string>("");
  const [qrOpen, setQrOpen] = useState(false);
  const [pressedTab, setPressedTab] = useState<TabKey>(null);

  const hasProfile = useMemo(
    () => profile.name.trim().length > 0,
    [profile.name]
  );

  const snsLinks = useMemo<SnsItem[]>(() => {
    return (profile.sns ?? "")
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((raw) => {
        const href = normalizeHref(raw);
        if (!href) return null;

        if (href.includes("instagram.com")) {
          return {
            href,
            label: "Instagram",
            icon: Instagram,
          };
        }

        if (href.includes("x.com") || href.includes("twitter.com")) {
          return {
            href,
            label: "X",
            icon: Twitter,
          };
        }

        if (href.includes("github.com")) {
          return {
            href,
            label: "GitHub",
            icon: Github,
          };
        }

        return {
          href,
          label: "Link",
          icon: LinkIcon,
        };
      })
      .filter(Boolean) as SnsItem[];
  }, [profile.sns]);

  const loadFromFirestore = async (uid: string) => {
    setErrorMsg("");
    setLoadingProfile(true);

    try {
      const p = await fetchProfile(uid);

      if (!p) {
        setProfile(defaultProfile);
        setErrorMsg("プロフィールが見つかりませんでした。編集画面で保存してください。");
        return;
      }

      setProfile({
        ...defaultProfile,
        ...p,
        cardDesign: p.cardDesign === "cars-base2" ? "cars-base2" : "card-base",
      });
    } catch (e) {
      console.error(e);
      setErrorMsg("Firestoreからの読み込みに失敗しました。");
    } finally {
      setLoadingProfile(false);
    }
  };

  const buildQrPayload = (u: User) => {
    return `uid:${u.uid}`;
  };

  const generateQr = async (u: User) => {
    const payload = buildQrPayload(u);
    setQrText(payload);

    try {
      const url = await QRCode.toDataURL(payload, {
        margin: 1,
        scale: 10,
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error(e);
      setQrDataUrl("");
      setErrorMsg("QRの生成に失敗しました（qrcode未インストール等を確認）");
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadedAuth(true);

      if (!u) {
        setProfile(defaultProfile);
        setQrDataUrl("");
        setQrText("");
        setQrOpen(false);
        setErrorMsg("ログインしていません。ログイン後に名刺を表示できます。");
        return;
      }

      await loadFromFirestore(u.uid);
      await generateQr(u);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (user) void loadFromFirestore(user.uid);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && user) {
        void loadFromFirestore(user.uid);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  const showLoading = !loadedAuth || loadingProfile;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const cardBaseSrc =
    profile.cardDesign === "cars-base2" ? "/cars-base2.png" : "/card-base.png";

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
    textShadow: `
      0 0 6px rgba(255,255,255,0.95),
      0 0 12px rgba(255,255,255,0.85),
      0 0 18px rgba(253,230,138,0.75),
      0 0 28px rgba(125,211,252,0.55),
      0 0 40px rgba(168,85,247,0.45)
    `,
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
    return { ...base, transform: "translateY(-1px)" };
  };

  const getPressedIconStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeIconStyle : iconStyle;
    if (!isPressed) return base;
    return { ...base, transform: "scale(1.06)" };
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
        color: "white",
        padding: 16,
        paddingBottom: 128,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#020617",
        backgroundImage: `
          radial-gradient(circle at 12% 88%, rgba(56, 189, 248, 0.42) 0%, rgba(56, 189, 248, 0.18) 18%, rgba(56, 189, 248, 0.00) 42%),
          radial-gradient(circle at 68% 30%, rgba(168, 85, 247, 0.40) 0%, rgba(168, 85, 247, 0.16) 20%, rgba(168, 85, 247, 0.00) 46%),
          radial-gradient(circle at 82% 12%, rgba(59, 130, 246, 0.24) 0%, rgba(59, 130, 246, 0.10) 16%, rgba(59, 130, 246, 0.00) 36%),
          radial-gradient(circle at 38% 56%, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 14%, rgba(255, 255, 255, 0.00) 32%),
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
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(circle at 50% 18%, rgba(255,255,255,0.04), rgba(255,255,255,0.00) 28%),
            radial-gradient(circle at 20% 78%, rgba(255,255,255,0.03), rgba(255,255,255,0.00) 24%)
          `,
          mixBlendMode: "screen",
        }}
      />

      {qrOpen && qrDataUrl && (
        <div
          onClick={() => setQrOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(92vw, 420px)",
              borderRadius: 18,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
              padding: 16,
              display: "grid",
              gap: 12,
              justifyItems: "center",
            }}
          >
            <div style={{ fontWeight: 900 }}>交換用QR（拡大）</div>

            <img
              src={qrDataUrl}
              alt="qr-large"
              style={{
                width: "min(80vw, 320px)",
                height: "min(80vw, 320px)",
                borderRadius: 16,
                background: "white",
              }}
            />

            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                wordBreak: "break-all",
                textAlign: "center",
              }}
            >
              {qrText}
            </div>

            <button
              type="button"
              onClick={() => setQrOpen(false)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "none",
                background: "rgba(255,255,255,0.14)",
                color: "white",
                fontWeight: 900,
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>名刺</div>

        <button
          type="button"
          onClick={() => user && void loadFromFirestore(user.uid)}
          disabled={!user}
          style={{
            marginLeft: "auto",
            padding: "10px 12px",
            borderRadius: 12,
            border: "none",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            fontWeight: 700,
            opacity: user ? 1 : 0.5,
          }}
        >
          更新
        </button>
      </div>

      {showLoading ? (
        <div
          style={{
            marginTop: 16,
            opacity: 0.9,
            position: "relative",
            zIndex: 1,
          }}
        >
          読み込み中…
        </div>
      ) : !user ? (
        <div
          style={{
            marginTop: 16,
            opacity: 0.9,
            position: "relative",
            zIndex: 1,
          }}
        >
          ログインしていないため名刺を表示できません。
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => router.push("/me")}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "none",
                background: "#f59e0b",
                color: "#111827",
                fontWeight: 900,
              }}
            >
              編集（/me）へ
            </button>
          </div>
          {errorMsg && (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
              {errorMsg}
            </div>
          )}
        </div>
      ) : !hasProfile ? (
        <div
          style={{
            marginTop: 16,
            opacity: 0.9,
            position: "relative",
            zIndex: 1,
          }}
        >
          プロフィールが未設定です。編集画面で保存してください。
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => router.push("/me")}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "none",
                background: "#f59e0b",
                color: "#111827",
                fontWeight: 900,
              }}
            >
              編集（/me）へ
            </button>
          </div>
          {errorMsg && (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
              {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <>
          {errorMsg && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                opacity: 0.9,
                position: "relative",
                zIndex: 1,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div
            style={{
              marginTop: 18,
              display: "grid",
              placeItems: "center",
              position: "relative",
              zIndex: 1,
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
                src={cardBaseSrc}
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
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
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
                {profile.name || "名前未設定"}
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
                {profile.affiliation || "所属未設定"}
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
                {profile.history || ""}
              </div>

              {qrDataUrl && (
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  style={{
                    position: "absolute",
                    right: "7%",
                    bottom: "4.8%",
                    width: "18.5%",
                    aspectRatio: "1 / 1",
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  aria-label="QRコードを拡大表示"
                  title="タップで拡大"
                >
                  <img
                    src={qrDataUrl}
                    alt="my-qr"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 12,
                      background: "white",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                    }}
                  />
                </button>
              )}
            </div>

            <div
              style={{
                marginTop: 14,
                width: "min(92vw, 420px)",
                display: "grid",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/me")}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  fontWeight: 900,
                }}
              >
                編集へ
              </button>
            </div>
          </div>
        </>
      )}

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
          style={getPressedButtonStyle(false, pressedTab === "scan")}
          {...pressHandlers("scan")}
        >
          <QrCode
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "scan")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "scan")}>
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
          style={getPressedButtonStyle(true, pressedTab === "meisi")}
          {...pressHandlers("meisi")}
        >
          <IdCard
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(true, pressedTab === "meisi")}
          />
          <span style={getPressedLabelStyle(true, pressedTab === "meisi")}>
            My名刺
          </span>
        </button>
      </div>
    </div>
  );
}