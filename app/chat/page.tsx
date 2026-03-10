"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Home,
  CreditCard,
  QrCode,
  MessageCircle,
  IdCard,
} from "lucide-react";

import { auth, db } from "../lib/firebase";
import { fetchLatestCardsByOwner } from "../lib/encounterClient";

type TabKey = "home" | "cards" | "scan" | "chat" | "meisi" | null;

export default function ChatListPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ★変更：未読の件数（数字）を保存できるようにしました
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [pressedTab, setPressedTab] = useState<TabKey>(null);

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

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "chatRooms"), (snap) => {
      const map: Record<string, number> = {};

      snap.docs.forEach((doc) => {
  const roomId = doc.id;

  if (!roomId.includes(user.uid)) return;

  const data = doc.data();

  const unreadCount = data?.[`unreadCount_${user.uid}`] ?? 0;

  if (unreadCount > 0) {
    map[roomId] = unreadCount;
  }
});

      setUnreadMap(map);
    });

    return () => unsub();
  }, [user]);

  // ★追加：すべての未読数を合計して、1以上なら下メニューに赤ポチを出します
  const totalUnreadCount = Object.values(unreadMap).reduce((acc, count) => acc + count, 0);
  const hasUnreadChat = totalUnreadCount > 0;

  const navButtonBase: React.CSSProperties = {
    position: "relative",
    padding: "10px 4px",
    minHeight: 64,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "11px",
    cursor: "pointer",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: `
      linear-gradient(135deg,
        rgba(99,102,241,0.22) 0%,
        rgba(168,85,247,0.18) 35%,
        rgba(59,130,246,0.20) 70%,
        rgba(255,255,255,0.08) 100%)
    `,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 0 rgba(255,255,255,0.04),
      0 6px 16px rgba(0,0,0,0.18)
    `,
    transition:
      "transform 0.16s ease, box-shadow 0.18s ease, background 0.18s ease",
  };

  const activeNavButton: React.CSSProperties = {
    ...navButtonBase,
    border: "1px solid rgba(255,255,255,0.24)",
    background: `
      linear-gradient(135deg,
        rgba(129,140,248,0.34) 0%,
        rgba(192,132,252,0.28) 35%,
        rgba(96,165,250,0.32) 70%,
        rgba(255,255,255,0.14) 100%)
    `,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -1px 0 rgba(255,255,255,0.06),
      0 10px 24px rgba(76,110,245,0.28),
      0 2px 10px rgba(168,85,247,0.20)
    `,
  };

  const getPressedButtonStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    if (!isPressed) {
      return isActive ? activeNavButton : navButtonBase;
    }

    return {
      ...(isActive ? activeNavButton : navButtonBase),
      transform: "scale(0.96)",
      boxShadow: isActive
        ? `
          inset 0 1px 0 rgba(255,255,255,0.28),
          0 0 18px rgba(255,255,255,0.24),
          0 0 28px rgba(125,211,252,0.28),
          0 0 40px rgba(168,85,247,0.24)
        `
        : `
          inset 0 1px 0 rgba(255,255,255,0.20),
          0 0 14px rgba(255,255,255,0.18),
          0 0 24px rgba(125,211,252,0.22),
          0 0 34px rgba(168,85,247,0.20)
        `,
    };
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    lineHeight: 1,
    whiteSpace: "nowrap",
    opacity: 0.95,
    transition: "all 0.16s ease",
  };

  const activeLabelStyle: React.CSSProperties = {
    ...labelStyle,
    fontWeight: 800,
    opacity: 1,
  };

  const iconStyle: React.CSSProperties = {
    filter: "drop-shadow(0 0 8px rgba(125,211,252,0.45))",
    transition: "all 0.16s ease",
  };

  const activeIconStyle: React.CSSProperties = {
    filter:
      "drop-shadow(0 0 10px rgba(255,255,255,0.55)) drop-shadow(0 0 14px rgba(96,165,250,0.50))",
    transition: "all 0.16s ease",
  };

  const getPressedLabelStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeLabelStyle : labelStyle;

    if (!isPressed) return base;

    return {
      ...base,
      color: "#ffffff",
      textShadow: `
        0 0 6px rgba(255,255,255,0.95),
        0 0 12px rgba(255,255,255,0.85),
        0 0 18px rgba(253,230,138,0.75),
        0 0 28px rgba(125,211,252,0.55),
        0 0 40px rgba(168,85,247,0.45)
      `,
      letterSpacing: "0.02em",
      transform: "translateY(-1px)",
    };
  };

  const getPressedIconStyle = (
    isActive: boolean,
    isPressed: boolean
  ): React.CSSProperties => {
    const base = isActive ? activeIconStyle : iconStyle;

    if (!isPressed) return base;

    return {
      ...base,
      filter: `
        drop-shadow(0 0 6px rgba(255,255,255,0.95))
        drop-shadow(0 0 14px rgba(253,230,138,0.80))
        drop-shadow(0 0 22px rgba(125,211,252,0.60))
        drop-shadow(0 0 30px rgba(168,85,247,0.45))
      `,
      transform: "scale(1.06)",
    };
  };

  const pressHandlers = (tab: Exclude<TabKey, null>) => ({
    onTouchStart: () => setPressedTab(tab),
    onTouchEnd: () => setPressedTab(null),
    onTouchCancel: () => setPressedTab(null),
    onMouseDown: () => setPressedTab(tab),
    onMouseUp: () => setPressedTab(null),
    onMouseLeave: () => setPressedTab(null),
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        padding: 16,
        paddingBottom: 128,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#020617",
        backgroundImage: `
          radial-gradient(circle at 12% 88%, rgba(56,189,248,0.40), transparent 40%),
          radial-gradient(circle at 68% 30%, rgba(168,85,247,0.40), transparent 45%),
          radial-gradient(circle at 82% 12%, rgba(59,130,246,0.25), transparent 40%),
          linear-gradient(180deg,#071224 0%,#040b18 50%,#020617 100%)
        `,
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 120px 80px, white, transparent),
            radial-gradient(1.5px 1.5px at 220px 160px, white, transparent),
            radial-gradient(2px 2px at 320px 60px, white, transparent),
            radial-gradient(1.5px 1.5px at 420px 140px, white, transparent),
            radial-gradient(2px 2px at 520px 40px, white, transparent),
            radial-gradient(1.5px 1.5px at 620px 180px, white, transparent),
            radial-gradient(2px 2px at 720px 100px, white, transparent),
            radial-gradient(1.5px 1.5px at 820px 50px, white, transparent),
            radial-gradient(2px 2px at 920px 170px, white, transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "1000px 220px",
          opacity: 0.8,
        }}
      />

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
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>チャット</div>
      </div>

      {loading ? (
        <div style={{ position: "relative", zIndex: 1, marginTop: 16 }}>
          読み込み中…
        </div>
      ) : people.length === 0 ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 16,
            opacity: 0.85,
          }}
        >
          まだチャットできる相手がいません。
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 16,
            display: "grid",
            gap: 12,
          }}
        >
          {people.map((item) => {
            const roomId = [user?.uid, item.otherUid].sort().join("__");
            
            // ★変更：未読の件数を取得
            const unreadCount = unreadMap[roomId] || 0;

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
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
                  cursor: "pointer",
                }}
              >
                {/* アイコン部分 */}
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
                    border: "1px solid rgba(255,255,255,0.10)",
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
                        display: "block",
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 800 }}>No</div>
                  )}
                </div>

                {/* 名前部分 */}
                <div style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>
                  {item.snapshot?.name || "名前未設定"}
                </div>

                {/* ★追加：LINEのような右端の通知バッジ（件数） */}
                {unreadCount > 0 && (
                  <div
                    style={{
                      background: "#ef4444",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 900,
                      minWidth: 26,
                      height: 26,
                      borderRadius: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 8px",
                      boxShadow: "0 0 12px rgba(239,68,68,0.65)",
                    }}
                  >
                    {unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .shooting-star {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: white;
          box-shadow: 0 0 10px white;
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
          background: linear-gradient(
            270deg,
            rgba(255, 255, 255, 0.9),
            rgba(125, 211, 252, 0.4),
            transparent
          );
          border-radius: 999px;
        }

        .shooting-star-1 {
          top: 100px;
          left: -200px;
          animation: meteor 8s linear infinite;
        }

        .shooting-star-2 {
          top: 200px;
          left: -300px;
          animation: meteor 9s linear infinite;
          animation-delay: 3s;
        }

        @keyframes meteor {
          0% {
            transform: translateX(0) translateY(0) rotate(25deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateX(1100px) translateY(450px) rotate(25deg);
            opacity: 0;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          left: 10,
          right: 10,
          bottom: 10,
          zIndex: 2000,
          padding: 10,
          borderRadius: 28,
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,0.12) 0%,
              rgba(255,255,255,0.06) 100%)
          `,
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: `
            0 14px 36px rgba(0,0,0,0.30),
            inset 0 1px 0 rgba(255,255,255,0.12)
          `,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={getPressedButtonStyle(false, pressedTab === "home")}
          {...pressHandlers("home")}
        >
          <Home
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "home")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "home")}>
            ホーム
          </span>
        </button>

        <button
          onClick={() => router.push("/cards")}
          style={getPressedButtonStyle(false, pressedTab === "cards")}
          {...pressHandlers("cards")}
        >
          <CreditCard
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "cards")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "cards")}>
            名刺一覧
          </span>
        </button>

        <button
          onClick={() => router.push("/scan")}
          style={getPressedButtonStyle(false, pressedTab === "scan")}
          {...pressHandlers("scan")}
        >
          <QrCode
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "scan")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "scan")}>
            交換
          </span>
        </button>

        <button
          onClick={() => router.push("/chat")}
          style={getPressedButtonStyle(true, pressedTab === "chat")}
          {...pressHandlers("chat")}
        >
          {/* ★追加：未読がある時だけ赤ポチを出す */}
          <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
            <MessageCircle
              size={20}
              strokeWidth={2.2}
              style={getPressedIconStyle(true, pressedTab === "chat")}
            />
            {hasUnreadChat && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 10px rgba(239,68,68,0.7)",
                }}
              />
            )}
          </div>
          <span style={getPressedLabelStyle(true, pressedTab === "chat")}>
            チャット
          </span>
        </button>

        <button
          onClick={() => router.push("/meisi")}
          style={getPressedButtonStyle(false, pressedTab === "meisi")}
          {...pressHandlers("meisi")}
        >
          <IdCard
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "meisi")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "meisi")}>
            My名刺
          </span>
        </button>
      </div>
    </div>
  );
}