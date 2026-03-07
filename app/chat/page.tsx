"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../lib/firebase";
import { db } from "../lib/firebase";

import { collection, onSnapshot } from "firebase/firestore";

import { fetchLatestCardsByOwner } from "../lib/encounterClient";

export default function ChatListPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setPeople([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const latestCards = await fetchLatestCardsByOwner(u.uid);
        setPeople(latestCards);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // 未読メッセージ監視
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "chatRooms"), (snap) => {
      const map: Record<string, boolean> = {};

      snap.docs.forEach((doc) => {
        const roomId = doc.id;

        if (!roomId.includes(user.uid)) return;

        const data = doc.data();
        const lastMessage = data?.lastMessage;

        if (!lastMessage) return;

        if (lastMessage.senderUid !== user.uid) {
          map[roomId] = true;
        }
      });

      setUnreadMap(map);
    });

    return () => unsub();
  }, [user]);

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
        

        <div style={{ fontSize: 18, fontWeight: 900 }}>チャット</div>
      </div>

      {loading ? (
        <div style={{ marginTop: 16 }}>読み込み中…</div>
      ) : people.length === 0 ? (
        <div style={{ marginTop: 16, opacity: 0.85 }}>
          まだチャットできる相手がいません。
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {people.map((item) => {
            const roomId = [user?.uid, item.otherUid].sort().join("__");
            const unread = unreadMap[roomId];

            return (
              <button
                key={item.otherUid}
                onClick={() => router.push(`/chat/${item.otherUid}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                {/* アイコン */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.10)",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                  }}
                >
                  {item.snapshot?.photoURL ? (
                    <img
                      src={item.snapshot.photoURL}
                      alt="icon"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 800 }}>No</div>
                  )}

                  {/* 未読赤丸 */}
                  {unread && (
                    <div
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#ef4444",
                        border: "2px solid #0b1220",
                      }}
                    />
                  )}
                </div>

                {/* 名前 */}
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {item.snapshot?.name || "名前未設定"}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div
  style={{
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    padding: 12,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(10px)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    gap: 8,
  }}
>
  <button
    onClick={() => router.push("/")}
    style={{
      padding: "14px 4px",
      borderRadius: 12,
      border: "none",
      background: "#232323",
      color: "#ffffff",
      fontWeight: 800,
      fontSize: "12px",
    }}
  >
    ホーム
  </button>

  <button
    onClick={() => router.push("/cards")}
    style={{
      padding: "14px 4px",
      borderRadius: 12,
      border: "none",
      background: "#60a5fa",
      color: "#111827",
      fontWeight: 800,
      fontSize: "12px",
    }}
  >
    一覧
  </button>

  <button
    onClick={() => router.push("/scan")}
    style={{
      padding: "14px 4px",
      borderRadius: 12,
      border: "none",
      background: "#22c55e",
      color: "white",
      fontWeight: 800,
      fontSize: "12px",
    }}
  >
    QR
  </button>

  <button
    onClick={() => router.push("/chat")}
    style={{
      padding: "14px 4px",
      borderRadius: 12,
      border: "none",
      background: "#a855f7",
      color: "white",
      fontWeight: 800,
      fontSize: "12px",
    }}
  >
    チャット
  </button>

  <button
    onClick={() => router.push("/meisi")}
    style={{
      padding: "14px 4px",
      borderRadius: 12,
      border: "none",
      background: "#f59e0b",
      color: "#111827",
      fontWeight: 800,
      fontSize: "12px",
    }}
  >
    My名刺
  </button>
</div>
    </div>
  );
}
