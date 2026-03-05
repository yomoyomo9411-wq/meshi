"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  imageDataUrl: string; // 画像をローカル保存（デモ用）
  name: string;
  affiliation: string;
  sns: string;
  history: string;
};

const STORAGE_KEY = "meshi_profile_v1";

const defaultProfile: Profile = {
  imageDataUrl: "",
  name: "",
  affiliation: "",
  sns: "",
  history: "",
};

export default function MyPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [savedMsg, setSavedMsg] = useState<string>("");

  // 画像選択inputをクリックさせるためのref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 画像枠タップでファイル選択を開く
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // 初回：localStorageから読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // 破損していても無視
    }
  }, []);

  const canSave = useMemo(() => profile.name.trim().length > 0, [profile.name]);

  const save = () => {
    if (!canSave) {
      setSavedMsg("名前は必須です。");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSavedMsg("保存しました！");
    setTimeout(() => setSavedMsg(""), 1500);
  };

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setProfile((p) => ({ ...p, imageDataUrl: result }));

      // 同じ画像を選び直してもonChangeが発火するようにする
      e.currentTarget.value = "";
    };
    reader.readAsDataURL(file);
  };

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
        <div style={{ fontSize: 18, fontWeight: 800 }}>マイページ</div>
      </div>

      {/* カード */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {/* 画像 + 名前（ここに移動） */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* 画像枠：タップで画像選択 */}
          <button
            type="button"
            onClick={openFilePicker}
            style={{
              width: 88,
              height: 88,
              borderRadius: 16,
              background: "rgba(255,255,255,0.10)",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
            aria-label="プロフィール画像を選択"
            title="タップして画像を選択"
          >
            {profile.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.imageDataUrl}
                alt="profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ fontWeight: 800, opacity: 0.85 }}>Tap</div>
            )}
          </button>

          {/* inputは非表示にしてref経由で開く */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            style={{ display: "none" }}
          />

          {/* 右側：名前入力（元「画像を選ぶ」ボタンの位置） */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
              名前（必須）
            </div>
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="例）辻 楓太"
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
                fontSize: 15,
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              画像は左のアイコンをタップして変更できます
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* 入力フォーム（名前欄は上に移動したので削除） */}
        <Field
          label="所属（自由記入）"
          value={profile.affiliation}
          onChange={(v) => setProfile((p) => ({ ...p, affiliation: v }))}
          placeholder="例）富山県立大学 情報システム工学科"
        />

        <Field
          label="SNSリンク（自由記入）"
          value={profile.sns}
          onChange={(v) => setProfile((p) => ({ ...p, sns: v }))}
          placeholder="例）https://x.com/xxxx / https://github.com/xxxx"
        />

        <TextAreaField
          label="活動履歴（自由記入）"
          value={profile.history}
          onChange={(v) => setProfile((p) => ({ ...p, history: v }))}
          placeholder={"例）\n・ハッカソン参加\n・映像制作\n・IoTプロトタイピング など"}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={save}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              background: canSave ? "#22c55e" : "rgba(34,197,94,0.35)",
              color: "#0b1220",
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            保存
          </button>

          <button
            onClick={() => setProfile(defaultProfile)}
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            リセット
          </button>
        </div>

        {savedMsg && (
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
            {savedMsg}
          </div>
        )}
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
        {props.label}
      </div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{
          width: "100%",
          padding: "12px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          outline: "none",
          fontSize: 15,
        }}
      />
    </div>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
        {props.label}
      </div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={5}
        style={{
          width: "100%",
          padding: "12px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          outline: "none",
          fontSize: 15,
          resize: "vertical",
        }}
      />
    </div>
  );
}