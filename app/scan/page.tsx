"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";

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

export default function ScanPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState("カメラを起動します…");

  const [scannedUid, setScannedUid] = useState("");
  const [scannedProfile, setScannedProfile] =
    useState<ProfileDoc>(defaultProfile);

  const [saving, setSaving] = useState(false);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const readerId = "qr-reader-box";

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

            if (uid === user.uid) {
              setStatus("自分自身のQRは交換できません");
              return;
            }

            // 二重読み取り防止
            hasScannedRef.current = true;

            // 先に scanner を安全に止める
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
              setStatus("プロフィール取得に失敗しました。もう一度読み取ってください。");
            }
          },
          () => {
            // 読み取り待機中のエラーは無視
          }
        );
      } catch (e) {
        console.error(e);
        setStatus("カメラの起動に失敗しました。カメラ許可を確認してください。");
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

  // handleSaveEncounter を以下のように書き換えてください

const handleSaveEncounter = async () => {
  if (!user || !scannedUid) return;

  setSaving(true);
  setStatus("現在地を取得しています…"); // 進行状況を伝える

  try {
    // 1. 位置情報の取得を試みる
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000, // 8秒でタイムアウト
      });
    }).catch(() => {
      // 位置情報取得に失敗した場合
      throw new Error("LOCATION_ERROR");
    });

    // 2. 位置情報が取得できた場合のみ、保存処理に進む
    setStatus("交換情報を保存しています…");
    
    // もし createEncounter が引数に lat, lng を取れるように作ってあるなら渡します
    // 例: await createEncounter(user.uid, scannedUid, position.coords.latitude, position.coords.longitude);
    // 今のままでも、createEncounter の中で位置情報を取っている場合は、
    // ここで許可が取れているのでスムーズに動くはずです。
    await createEncounter(user.uid, scannedUid);

    setStatus("交換完了！名刺一覧に追加しました。");
    setTimeout(() => {
      router.push("/cards");
    }, 800);

  } catch (e: any) {
    console.error(e);
    if (e.message === "LOCATION_ERROR") {
      // ご要望のメッセージを表示
      setStatus("位置情報が取得できませんでした。");
      alert("位置情報が取得できなかったため、交換を中断しました。設定を確認してください。");
    } else {
      setStatus("保存に失敗しました");
    }
    // ここで処理が止まる（createEncounterは実行されない、または失敗している）
  } finally {
    setSaving(false);
  }
};

  const restartScan = () => {
    router.refresh();
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "white",
        padding: 16,
      }}
    >
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
        <div style={{ fontSize: 18, fontWeight: 900 }}>QR読み取り</div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {status}
      </div>

      {!scannedUid ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 18,
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            padding: 12,
          }}
        >
          <div id={readerId} />
        </div>
      ) : (
        <div
          style={{
            marginTop: 16,
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>交換相手の名刺</div>

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
              {scannedProfile.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scannedProfile.photoURL}
                  alt="profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ fontWeight: 800, opacity: 0.85 }}>No</div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                {scannedProfile.name || "名前未設定"}
              </div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>
                {scannedProfile.affiliation || "所属未設定"}
              </div>
            </div>
          </div>

          {scannedProfile.history?.trim() && (
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
              {scannedProfile.history}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
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
  );
}