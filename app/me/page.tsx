"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";

import AuthButton from "../components/AuthButton";
import { auth } from "../lib/firebase";
import {
  fetchProfile,
  saveProfile,
  uploadProfileImage,
  type ProfileDoc,
} from "../lib/profileClient";

type Profile = {
  photoURL: string;
  name: string;
  affiliation: string;
  sns: string;
  history: string;
};

const defaultProfile: Profile = {
  photoURL: "",
  name: "",
  affiliation: "",
  sns: "",
  history: "",
};

export default function MyPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState<boolean>(true);

  const [savedMsg, setSavedMsg] = useState<string>("");
  const hideTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setSavedMsg(msg);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setSavedMsg("");
      hideTimerRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setProfile(defaultProfile);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const p = await fetchProfile(u.uid);
        if (p) {
          setProfile({
            photoURL: p.photoURL ?? "",
            name: p.name ?? "",
            affiliation: p.affiliation ?? "",
            sns: p.sns ?? "",
            history: p.history ?? "",
          });
        } else {
          setProfile(defaultProfile);
        }
      } catch (e) {
        console.error(e);
        showToast("プロフィールの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const canSave = useMemo(() => profile.name.trim().length > 0, [profile.name]);

  const save = async () => {
    if (!user) {
      showToast("先にログインしてください");
      return;
    }
    if (!canSave) {
      showToast("名前は必須です。");
      return;
    }

    const docData: ProfileDoc = {
      photoURL: profile.photoURL,
      name: profile.name.trim(),
      affiliation: profile.affiliation.trim(),
      sns: profile.sns.trim(),
      history: profile.history.trim(),
    };

    try {
      await saveProfile(user.uid, docData);
      showToast("Firestoreに保存しました！");
    } catch (e) {
      console.error(e);
      showToast("保存に失敗しました");
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => fileInputRef.current?.click();

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.currentTarget.value = "";

    const localPreview = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, photoURL: localPreview }));

    if (!user) {
      showToast("画像を保存するにはログインが必要です");
      return;
    }

    try {
      showToast("画像をアップロード中…");
      const url = await uploadProfileImage(user.uid, file);
      setProfile((p) => ({ ...p, photoURL: url }));
      showToast("画像アップロード完了！");
    } catch (err) {
      console.error(err);
      showToast("画像アップロードに失敗しました");
    }
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
          radial-gradient(circle at 12% 88%, rgba(56, 189, 248, 0.42) 0%, rgba(56, 189, 248, 0.18) 18%, rgba(56, 189, 248, 0.00) 42%),
          radial-gradient(circle at 68% 30%, rgba(168, 85, 247, 0.40) 0%, rgba(168, 85, 247, 0.16) 20%, rgba(168, 85, 247, 0.00) 46%),
          radial-gradient(circle at 82% 12%, rgba(59, 130, 246, 0.24) 0%, rgba(59, 130, 246, 0.10) 16%, rgba(59, 130, 246, 0.00) 36%),
          radial-gradient(circle at 38% 56%, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 14%, rgba(255, 255, 255, 0.00) 32%),
          linear-gradient(180deg, #071224 0%, #040b18 48%, #020617 100%)
        `,
      }}
    >
      {/* 固定の星背景 */}
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

      {/* うっすら霧っぽい光 */}
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

      {/* 左下の宇宙飛行士 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/astronaut.png"
        alt="astronaut"
        className="floating-astronaut"
        style={{
          position: "fixed",
          left: 30,
          bottom: 16,
          width: 200,
          height: "auto",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* 保存トースト */}
      {savedMsg && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setSavedMsg("")}
        >
          <div
            style={{
              minWidth: 220,
              maxWidth: "80vw",
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              textAlign: "center",
              fontWeight: 900,
              letterSpacing: 0.2,
            }}
          >
            {savedMsg}
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
        <div style={{ fontSize: 18, fontWeight: 800 }}>マイページ</div>
      </div>

      {/* ログインUI */}
      <div style={{ marginTop: 12, position: "relative", zIndex: 1 }}>
        <AuthButton />
      </div>

      {/* カード */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(6px)",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        }}
      >
        {loading ? (
          <div style={{ opacity: 0.9, fontWeight: 700 }}>読み込み中…</div>
        ) : !user ? (
          <div style={{ opacity: 0.9, fontWeight: 700 }}>
            プロフィール編集をするにはログインしてください。
          </div>
        ) : (
          <>
            {/* 画像 + 名前 */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button
                type="button"
                onClick={openFilePicker}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.10)",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                  boxShadow:
                    "0 0 0 4px rgba(255,214,94,0.20), 0 0 18px rgba(255,214,94,0.28)",
                }}
                aria-label="プロフィール画像を選択"
                title="タップして画像を選択"
              >
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoURL}
                    alt="profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontWeight: 800, opacity: 0.85 }}>Tap</div>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickImage}
                style={{ display: "none" }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
                  名前（必須）
                </div>
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="例）辻 楓太"
                  style={{
                    width: "100%",
                    padding: "12px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    outline: "none",
                    fontSize: 15,
                  }}
                />
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  画像は左のアイコンをタップして変更できます
                </div>
              </div>
            </div>

            <div style={{ height: 16 }} />

            <Field
              label="所属（自由記入）"
              value={profile.affiliation}
              onChange={(v) => setProfile((p) => ({ ...p, affiliation: v }))}
              placeholder="例）富山県立大学 情報システム工学科"
            />

            <Field
              label="SNSリンク（自由記入）"
              value={profile.sns}
              onChange={(v) => setProfile((p) => ({ ...p, sns: v }))}
              placeholder="例）https://x.com/xxxx / https://github.com/xxxx"
            />

            <TextAreaField
              label="活動履歴（自由記入）"
              value={profile.history}
              onChange={(v) => setProfile((p) => ({ ...p, history: v }))}
              placeholder={
                "例）\n・ハッカソン参加\n・映像制作\n・IoTプロトタイピング など"
              }
            />

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={save}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: canSave ? "#22c55e" : "rgba(34,197,94,0.35)",
                  color: "#0b1220",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                保存（Firestore）
              </button>

              <button
                onClick={() => setProfile(defaultProfile)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                リセット
              </button>
            </div>
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

        .floating-astronaut {
          animation: floatAstronaut 4.2s ease-in-out infinite;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.35));
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

        @keyframes floatAstronaut {
          0% {
            transform: translateY(0px) rotate(-2deg);
          }
          50% {
            transform: translateY(-14px) rotate(2deg);
          }
          100% {
            transform: translateY(0px) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
        {props.label}
      </div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{
          width: "100%",
          padding: "12px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          outline: "none",
          fontSize: 15,
        }}
      />
    </div>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
        {props.label}
      </div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={5}
        style={{
          width: "100%",
          padding: "12px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          outline: "none",
          fontSize: 15,
          resize: "vertical",
        }}
      />
    </div>
  );
}