"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../../lib/firebase";
import {
  buildRoomId,
  sendMessage,
  subscribeMessages,
  type ChatMessage,
} from "../../lib/chatClient";
import { fetchProfile } from "../../lib/profileClient";

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const otherUid = String(params.otherUid);

  const [user, setUser] = useState<User | null>(null);
  const [otherName, setOtherName] = useState("チャット");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const roomId = useMemo(() => {
    if (!user) return "";
    return buildRoomId(user.uid, otherUid);
  }, [user, otherUid]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        const p = await fetchProfile(otherUid);
        setOtherName(p?.name || "名前未設定");
      } catch (e) {
        console.error(e);
      }
    });

    return () => unsubAuth();
  }, [otherUid]);

  useEffect(() => {
    if (!roomId) return;

    setLoading(true);

    const unsub = subscribeMessages(roomId, (list) => {
      setMessages(list);
      setLoading(false);
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !roomId || !text.trim()) return;

    try {
      await sendMessage(roomId, user.uid, text);
      setText("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#0b1220",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: 14,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <button
          onClick={() => router.push("/chat")}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "none",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            fontWeight: 700,
          }}
        >
          ←
        </button>

        <div style={{ fontWeight: 900, fontSize: 17 }}>{otherName}</div>
      </div>

      {/* メッセージ一覧 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {loading ? (
          <div>読み込み中…</div>
        ) : messages.length === 0 ? (
          <div style={{ opacity: 0.8 }}>
            まだメッセージはありません。最初の一言を送ってみましょう。
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderUid === user?.uid;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "10px 14px",
                    borderRadius: 16,
                    background: isMine ? "#22c55e" : "#374151",
                    color: isMine ? "#0b1220" : "white",
                    fontWeight: 500,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          gap: 10,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
          placeholder="メッセージを入力"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 999,
            border: "none",
            outline: "none",
            fontSize: 14,
          }}
        />

        <button
          onClick={handleSend}
          style={{
            padding: "12px 16px",
            borderRadius: 999,
            border: "none",
            background: "#22c55e",
            color: "#0b1220",
            fontWeight: 900,
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
}