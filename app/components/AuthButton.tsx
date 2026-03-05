"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { logout, signInWithGoogle } from "../lib/authClient";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => signInWithGoogle()}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 14,
          border: "none",
          fontWeight: 800,
          background: "#22c55e",
          color: "#0b1220",
        }}
      >
        Googleでログイン
      </button>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 14, opacity: 0.9 }}>
        ログイン中：{user.displayName ?? user.email ?? user.uid}
      </div>
      <button
        onClick={() => logout()}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 14,
          border: "none",
          fontWeight: 800,
          background: "rgba(255,255,255,0.12)",
          color: "white",
        }}
      >
        ログアウト
      </button>
    </div>
  );
}