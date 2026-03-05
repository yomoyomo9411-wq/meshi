"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import QRCode from "qrcode";

import { auth } from "../lib/firebase";
import { fetchProfile, type ProfileDoc } from "../lib/profileClient";

export default function ExchangePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [payloadText, setPayloadText] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // ログイン監視 → 自分のプロフィール取得 → QR生成
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

        // ✅ QRに埋め込む内容（短くて安定）
        // 例: meshi://profile?uid=xxxx
        const payload = `meshi://profile?uid=${encodeURIComponent(u.uid)}`;

        setPayloadText(payload);

        const url = await QRCode.toDataURL(payload, {
          margin: 1,
          scale: 10,
          errorCorrectionLevel: "M", // 安定度のバランス
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

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        background: "#0b1220",
        color: "white",
      }}
    >
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
        <div style={{ fontSize: 18, fontWeight: 800 }}>交換用QR</div>
      </div>

      {/* ステータス */}
      {status && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.10)",
          }}
        >
          {status}
        </div>
      )}

      {/* 本体 */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "grid",
          gap: 12,
          justifyItems: "center",
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

            {/* QR画像 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="exchange-qr"
              style={{
                width: 280,
                height: 280,
                borderRadius: 16,
                background: "white",
              }}
            />

            {/* 自分のプロフィール表示（確認用） */}
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photoURL}
                      alt="me"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
    </div>
  );
}