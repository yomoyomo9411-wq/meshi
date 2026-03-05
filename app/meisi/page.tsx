"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ★あなたの配置に合わせて import パスを直してください
import { auth } from "../lib/firebase";
import { fetchProfile, type ProfileDoc } from "../lib/profileClient";
import { onAuthStateChanged, type User } from "firebase/auth";

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

  const hasProfile = useMemo(() => profile.name.trim().length > 0, [profile.name]);

  const loadFromFirestore = async (uid: string) => {
    setErrorMsg("");
    setLoadingProfile(true);
    try {
      const p = await fetchProfile(uid);
      if (!p) {
        setProfile(defaultProfile);
        setErrorMsg("プロフィールが見つかりませんでした。マイページで保存してください。");
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

  // ① ログイン状態を監視 → uid 取得 → Firestore 読み込み
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadedAuth(true);

      if (!u) {
        setProfile(defaultProfile);
        setErrorMsg("ログインしていません。ログイン後に名刺を表示できます。");
        return;
      }
      await loadFromFirestore(u.uid);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ② 画面復帰時にも再読込（MyPageで保存→戻る→名刺、で最新化）
  useEffect(() => {
    const onFocus = () => {
      if (user) loadFromFirestore(user.uid);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && user) loadFromFirestore(user.uid);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // SNSリンクがURLじゃない入力でも落ちないようにする（任意）
  const snsHref = useMemo(() => {
    const s = profile.sns?.trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.includes(".")) return `https://${s}`;
    return "";
  }, [profile.sns]);

  const showLoading = !loadedAuth || loadingProfile;

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", color: "white", padding: 16 }}>
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
        <div style={{ marginTop: 16, opacity: 0.9 }}>読み込み中…</div>
      ) : !user ? (
        <div style={{ marginTop: 16, opacity: 0.9 }}>
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
              マイページへ
            </button>
          </div>
          {errorMsg && <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>{errorMsg}</div>}
        </div>
      ) : !hasProfile ? (
        <div style={{ marginTop: 16, opacity: 0.9 }}>
          プロフィールが未設定です。マイページで保存してください。
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
              マイページへ
            </button>
          </div>
          {errorMsg && <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>{errorMsg}</div>}
        </div>
      ) : (
        <>
          {errorMsg && (
            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
              {errorMsg}
            </div>
          )}

          {/* 名刺（仮デザイン） */}
          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: 16,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoURL}
                    alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontWeight: 800, opacity: 0.8 }}>No Img</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{profile.name}</div>
                {profile.affiliation && (
                  <div style={{ marginTop: 4, opacity: 0.85 }}>{profile.affiliation}</div>
                )}
              </div>
            </div>

            {!!profile.sns && (
              <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9, wordBreak: "break-all" }}>
                SNS:{" "}
                {snsHref ? (
                  <a href={snsHref} target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>
                    {profile.sns}
                  </a>
                ) : (
                  <span>{profile.sns}</span>
                )}
              </div>
            )}

            {!!profile.history && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>経歴</div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    whiteSpace: "pre-wrap",
                    maxHeight: 220,
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {profile.history}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}