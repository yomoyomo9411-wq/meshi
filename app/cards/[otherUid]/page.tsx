"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../../lib/firebase";
import { fetchEncounterHistoryByOwnerAndOther } from "../../lib/encounterClient";

export default function CardHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const otherUid = String(params.otherUid);

  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setHistory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchEncounterHistoryByOwnerAndOther(u.uid, otherUid);
        setHistory(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [otherUid]);

  const formatTime = (createdAt: any) => {
    const sec = createdAt?.seconds;
    if (!sec) return "保存直後";
    return new Date(sec * 1000).toLocaleString("ja-JP");
  };

  const latestName = history[0]?.snapshot?.name || "履歴";
  const latestAffiliation = history[0]?.snapshot?.affiliation || "";

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
          onClick={() => router.push("/cards")}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "none",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            fontWeight: 700,
          }}
        >
          ← 名刺一覧へ
        </button>
        <div style={{ fontSize: 18, fontWeight: 900 }}>履歴一覧</div>
      </div>

      {!loading && history.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 18,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.10)",
             display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "300px",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 20 }}>{latestName}</div>
          <div style={{ marginTop: 4, opacity: 0.85 }}>{latestAffiliation}</div>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 16 }}>読み込み中…</div>
      ) : history.length === 0 ? (
        <div style={{ marginTop: 16, opacity: 0.85 }}>
          この相手との履歴はまだありません。
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
          {history.map((item, index) => (
            <div
              key={item.id}
              style={{
                borderRadius: 18,
                padding: 16,
                background:
                  index === 0
                    ? "rgba(245,158,11,0.14)"
                    : "rgba(255,255,255,0.08)",
                border:
                  index === 0
                    ? "1px solid rgba(245,158,11,0.35)"
                    : "1px solid rgba(255,255,255,0.10)",
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.snapshot?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.snapshot.photoURL}
                      alt="snapshot"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ fontWeight: 800, opacity: 0.85 }}>No</div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {item.snapshot?.name || "名前未設定"}
                  </div>
                  <div style={{ opacity: 0.85, marginTop: 4 }}>
                    {item.snapshot?.affiliation || "所属未設定"}
                  </div>
                </div>
              </div>

              {item.snapshot?.history?.trim() && (
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
                  {item.snapshot.history}
                </div>
              )}

              <div style={{ fontSize: 13, opacity: 0.85 }}>
                交換時間：{formatTime(item.createdAt)}
              </div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                交換場所：{item.address || "住所不明"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}