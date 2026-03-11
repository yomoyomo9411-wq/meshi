"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  Home,
  CreditCard,
  QrCode,
  MessageCircle,
  IdCard,
} from "lucide-react";

import { auth } from "../lib/firebase";
import {
  fetchLatestCardsByOwner,
  markEncountersAsRead,
  updateEncounterEventName,
} from "../lib/encounterClient";

type TabKey = "home" | "cards" | "scan" | "chat" | "meisi" | null;

export default function CardsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [pressedTab, setPressedTab] = useState<TabKey>(null);
  const [eventInputs, setEventInputs] = useState<Record<string, string>>({});
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchLatestCardsByOwner(u.uid);
        setCards(data);

        const initialInputs: Record<string, string> = {};
        data.forEach((item) => {
          initialInputs[item.id] = item.eventName ?? "";
        });
        setEventInputs(initialInputs);

        const hasUnread = data.some((item) => item.isUnread === true);
        setShowNewBanner(hasUnread);

        if (hasUnread) {
          await markEncountersAsRead(u.uid);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const formatTime = (createdAt: any) => {
    const sec = createdAt?.seconds;
    if (!sec) return "保存直後";
    return new Date(sec * 1000).toLocaleString("ja-JP");
  };

  const saveEventName = async (cardId: string) => {
    const value = (eventInputs[cardId] ?? "").trim();

    try {
      setSavingEventId(cardId);
      await updateEncounterEventName(cardId, value);

      setCards((prev) =>
        prev.map((item) =>
          item.id === cardId ? { ...item, eventName: value } : item
        )
      );
    } catch (e) {
      console.error(e);
      alert("イベント名の保存に失敗しました");
    } finally {
      setSavingEventId(null);
    }
  };

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
    color: "#fde68a",
  };

  const iconStyle: React.CSSProperties = {
    filter: "drop-shadow(0 0 8px rgba(125,211,252,0.45))",
    transition: "all 0.16s ease",
  };

  const activeIconStyle: React.CSSProperties = {
        color: "#fde68a",
    filter: `
      drop-shadow(0 0 6px rgba(255,255,255,0.95))
      drop-shadow(0 0 14px rgba(253,230,138,0.80))
      drop-shadow(0 0 22px rgba(125,211,252,0.60))
      drop-shadow(0 0 30px rgba(168,85,247,0.45))
    `,
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
      {/* 星背景 */}
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
      </div>

      {/* ヘッダー */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>名刺一覧</div>
      </div>

      {showNewBanner && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "linear-gradient(90deg,#f59e0b,#fde68a)",
            color: "#111827",
            fontWeight: 900,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          新しい名刺が追加されました
        </div>
      )}

      {loading ? (
        <div style={{ position: "relative", zIndex: 1, marginTop: 16 }}>
          読み込み中…
        </div>
      ) : cards.length === 0 ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 16,
            opacity: 0.85,
          }}
        >
          まだ交換した名刺がありません。
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 16,
            display: "grid",
            gap: 14,
          }}
        >
          {cards.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: 18,
                padding: 16,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "grid",
                gap: 12,
                textAlign: "left",
                color: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
              }}
            >
              <button
                onClick={() =>
                  router.push(`/?focusOtherUid=${item.otherUid}&from=cards`)
                }
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 12,
                  textAlign: "left",
                  color: "white",
                  cursor: "pointer",
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
                      <img
                        src={item.snapshot.photoURL}
                        alt="snapshot"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
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
                  最新の交換時間：{formatTime(item.createdAt)}
                </div>

                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  最新の交換場所：{item.address || "住所不明"}
                </div>
              </button>

              <div style={{ display: "grid", gap: 8 }}>
  {/* display: flex にして gap で少しだけ隙間を作る */}
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: 15,           /* 文字の間の隙間を 6px に設定 */
    paddingTop: 8,
    marginBottom: 2, 
    fontSize: 13, 
    fontWeight: 800, 
    opacity: 0.95 
  }}>
    <span>イベント名</span>
    {/* すぐ隣に表示される */}
    <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>
      ({(eventInputs[item.id] ?? "").length}/15)
    </span>
  </div>

  <input
    value={eventInputs[item.id] ?? ""}
    maxLength={15}
    onChange={(e) =>
      setEventInputs((prev) => ({
        ...prev,
        [item.id]: e.target.value,
      }))
    }
    placeholder="例）ハッカソンで会った / 富山市のカフェで会った"
    style={{
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.22)",
      color: "white",
      outline: "none",
      fontSize: 14,
      boxSizing: "border-box",
    }}
  />

                <button
                  onClick={() => saveEventName(item.id)}
                  disabled={savingEventId === item.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "none",
                    background:
                      savingEventId === item.id ? "#9ca3af" : "#f59e0b",
                    color: "#111827",
                    fontWeight: 900,
                    cursor: savingEventId === item.id ? "default" : "pointer",
                  }}
                >
                  {savingEventId === item.id ? "保存中…" : "イベント名を保存"}
                </button>
              </div>
            </div>
          ))}
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

      {/* 下部ナビ */}
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
          style={getPressedButtonStyle(true, pressedTab === "cards")}
          {...pressHandlers("cards")}
        >
          <CreditCard
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(true, pressedTab === "cards")}
          />
          <span style={getPressedLabelStyle(true, pressedTab === "cards")}>
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
          style={getPressedButtonStyle(false, pressedTab === "chat")}
          {...pressHandlers("chat")}
        >
          <MessageCircle
            size={20}
            strokeWidth={2.2}
            style={getPressedIconStyle(false, pressedTab === "chat")}
          />
          <span style={getPressedLabelStyle(false, pressedTab === "chat")}>
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