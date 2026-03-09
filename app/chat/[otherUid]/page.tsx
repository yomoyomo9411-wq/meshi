"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../../lib/firebase";
import { markAsRead } from "../../lib/chatClient";
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
    if (!user || !roomId) return;
    markAsRead(roomId, user.uid);
  }, [messages, roomId, user]);

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
        color: "white",
        display: "flex",
        flexDirection: "column",
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
      {/* 星背景 */}
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

      {/* 流れ星 */}
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

      {/* 霧っぽい光 */}
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

      {/* ヘッダー */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: 14,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
            cursor: "pointer",
          }}
        >
          ←
        </button>

        <div style={{ fontWeight: 900, fontSize: 17 }}>{otherName}</div>
      </div>

      {/* メッセージ一覧 */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {loading ? (
          <div
            style={{
              opacity: 0.9,
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              alignSelf: "center",
            }}
          >
            読み込み中…
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              opacity: 0.85,
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              lineHeight: 1.5,
            }}
          >
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
                    background: isMine
                      ? "linear-gradient(135deg, rgba(217,255,0,0.92), rgba(190,242,100,0.88))"
                      : "rgba(255,255,255,0.10)",
                    border: isMine
                      ? "1px solid rgba(255,255,255,0.10)"
                      : "1px solid rgba(255,255,255,0.12)",
                    color: isMine ? "#0b1220" : "white",
                    fontWeight: 500,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    backdropFilter: isMine ? "none" : "blur(8px)",
                    WebkitBackdropFilter: isMine ? "none" : "blur(8px)",
                    boxShadow: isMine
                      ? "0 8px 24px rgba(180,255,80,0.18)"
                      : "0 8px 24px rgba(0,0,0,0.14)",
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
          position: "relative",
          zIndex: 1,
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          gap: 10,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.14)",
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
            border: "1px solid rgba(255,255,255,0.12)",
            outline: "none",
            fontSize: 14,
            color: "white",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />

        <button
          onClick={handleSend}
          style={{
            padding: "12px 16px",
            borderRadius: 999,
            border: "none",
            background: "#d9ff00",
            color: "#0b1220",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          送信
        </button>
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