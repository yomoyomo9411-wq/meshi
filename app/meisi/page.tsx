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

  // QR表示用
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrText, setQrText] = useState<string>("");

  // ✅ QR拡大モーダル
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

  // QRの中身（最初はUIDだけが堅い）
  const buildQrPayload = (u: User) => {
    // 例: uid:xxxxxxxx
    return `uid:${u.uid}`;

    // URLで開ける形式にしたいなら（将来のおすすめ）
    // return `https://<your-vercel-domain>/p/${u.uid}`;
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

  // ① ログイン監視 → Firestore読み込み → QR生成
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

  // ② 画面復帰時にも再読込（編集→戻るで最新化）
  useEffect(() => {
    const onFocus = () => {
      if (user) loadFromFirestore(user.uid);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && user)
        loadFromFirestore(user.uid);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // SNSリンク整形（任意）
  const snsHref = useMemo(() => {
    const s = profile.sns?.trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.includes(".")) return `https://${s}`;
    return "";
  }, [profile.sns]);

  const showLoading = !loadedAuth || loadingProfile;

  // ESCでモーダル閉じる（PC便利）
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
      }}
    >
      {/* ✅ QR拡大モーダル */}
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
        <div style={{ marginTop: 16, opacity: 0.9 }}>
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
            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
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
              boxShadow: "0 0 25px rgba(56,189,248,0.6), 0 15px 40px rgba(0,0,0,0.6)",
              transform: "translateY(-8px)",
              display: "grid",
              gap: 14,
              position: "relative", // ✅ 右上配置のため
            }}
          >
            {/* ✅ 右上QR（小） */}
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

            {/* 上：プロフィール */}
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

              {/* QRが右上にある分、テキスト領域が重ならないよう右側に余白 */}
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

            {/* 活動履歴 */}
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

            {/* QRの説明（小さく） */}
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
    </div>
  );
}