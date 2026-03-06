"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../lib/firebase";
import { fetchProfile, type ProfileDoc } from "../lib/profileClient";

const defaultProfile: ProfileDoc = {
  name: "",
  affiliation: "",
  sns: "",
  history: "",
  photoURL: "",
};

export default function MeisiPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDoc>(defaultProfile);

  const [loadedAuth, setLoadedAuth] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrText, setQrText] = useState<string>("");

  const [qrOpen, setQrOpen] = useState(false);

  const hasProfile = useMemo(
    () => profile.name.trim().length > 0,
    [profile.name]
  );

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
      setProfile({ ...defaultProfile, ...p });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (user) loadFromFirestore(user.uid);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && user) {
        loadFromFirestore(user.uid);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const snsHref = useMemo(() => {
    const s = profile.sns?.trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.includes(".")) return `https://${s}`;
    return "";
  }, [profile.sns]);

  const showLoading = !loadedAuth || loadingProfile;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 固定の星背景：多め版 */}
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

      {/* 流れ星レイヤー */}
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

      {/* QR拡大モーダル */}
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

            {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* ヘッダー */}
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

        <div style={{ fontSize: 18, fontWeight: 900 }}>名刺</div>

        <button
          onClick={() => user && loadFromFirestore(user.uid)}
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

          {/* 名刺カード */}
          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: 16,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow:
                "0 0 25px rgba(56,189,248,0.6), 0 15px 40px rgba(0,0,0,0.6)",
              transform: "translateY(-8px)",
              display: "grid",
              gap: 14,
              position: "relative",
              zIndex: 1,
              backdropFilter: "blur(4px)",
            }}
          >
            {qrDataUrl && (
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 92,
                  height: 92,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 6,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
                aria-label="QRコードを拡大表示"
                title="タップで拡大"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="my-qr"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    background: "white",
                  }}
                />
              </button>
            )}

            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoURL}
                    alt="profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontWeight: 800, opacity: 0.85 }}>No</div>
                )}
              </div>

              <div style={{ minWidth: 0, paddingRight: 110 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {profile.name}
                </div>
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  {profile.affiliation || "（所属未入力）"}
                </div>
                {snsHref && (
                  <a
                    href={snsHref}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      color: "#60a5fa",
                      fontWeight: 800,
                    }}
                  >
                    SNSを見る
                  </a>
                )}
              </div>
            </div>

            {profile.history?.trim() && (
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
                {profile.history}
              </div>
            )}

            {qrDataUrl && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                右上のQRを相手に読み取ってもらって交換（タップで拡大できます）
              </div>
            )}

            <button
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
              編集（/me）へ
            </button>
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
    </div>
  );
}