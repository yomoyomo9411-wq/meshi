"use client";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
  increment, // 🟢 追加：数値を増やすために必要
} from "firebase/firestore";
import { db } from "./firebase";
import { fetchProfile } from "./profileClient";

export type EncounterSnapshot = {
  name: string;
  affiliation: string;
  sns: string;
  history: string;
  photoURL: string;
};

export type EncounterDoc = {
  ownerUid: string;
  otherUid: string;
  lat: number;
  lng: number;
  address: string;
  eventName?: string;
  createdAt: any;
  isLatest: boolean;
  isUnread?: boolean;
  snapshot: EncounterSnapshot;
};

/**
 * 交換処理のメイン関数
 */
export async function createEncounter(
  ownerUid: string,
  otherUid: string,
  eventName?: string
) {
  
  // 1. 位置情報と住所の取得
    const { lat, lng } = await getCurrentPositionStrict(); 
  const address = await reverseGeocode(lat, lng);

  // 2. お互いの最新プロフィールを取得
  const ownerProfile = await fetchProfile(ownerUid);
  const otherProfile = await fetchProfile(otherUid);

  const snapshotForOwner: EncounterSnapshot = {
    name: otherProfile?.name ?? "",
    affiliation: otherProfile?.affiliation ?? "",
    sns: otherProfile?.sns ?? "",
    history: otherProfile?.history ?? "",
    photoURL: otherProfile?.photoURL ?? "",
  };

  const snapshotForOther: EncounterSnapshot = {
    name: ownerProfile?.name ?? "",
    affiliation: ownerProfile?.affiliation ?? "",
    sns: ownerProfile?.sns ?? "",
    history: ownerProfile?.history ?? "",
    photoURL: ownerProfile?.photoURL ?? "",
  };

  // 🟢 3. 初回交換チェック (自分から見て相手と過去に接触があるか)
  const qFirstCheck = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid),
    where("otherUid", "==", otherUid)
  );
  const existingDocs = await getDocs(qFirstCheck);
  const isFirstTime = existingDocs.empty; // 過去に1件もなければ初回

  // 4. 古い「最新フラグ」を解除
  await clearLatestEncounter(ownerUid, otherUid);
  await clearLatestEncounter(otherUid, ownerUid);

  // 5. 交換履歴を作成 (自分の分)
  await addDoc(collection(db, "encounters"), {
    ownerUid,
    otherUid,
    lat,
    lng,
    address,
    eventName: eventName ?? "",
    createdAt: serverTimestamp(),
    isLatest: true,
    isUnread: true,
    snapshot: snapshotForOwner,
  });

  // 6. 交換履歴を作成 (相手の分)
  await addDoc(collection(db, "encounters"), {
    ownerUid: otherUid,
    otherUid: ownerUid,
    lat,
    lng,
    address,
    eventName: eventName ?? "",
    createdAt: serverTimestamp(),
    isLatest: true,
    isUnread: true,
    snapshot: snapshotForOther,
  });

  // 🟢 7. 初回交換なら、お互いのトロフィーカウントを +1 する
  if (isFirstTime) {
    // 自分のカウントを増やす
    const myProfileRef = doc(db, "profiles", ownerUid);
    await updateDoc(myProfileRef, {
      count: increment(1)
    });

    // 相手のカウントを増やす
    const otherProfileRef = doc(db, "profiles", otherUid);
    await updateDoc(otherProfileRef, {
      count: increment(1)
    });
    
    console.log("初回交換のため、トロフィーカウントを更新しました。");
  } else {
    console.log("2回目以降の交換のため、カウントは維持します。");
  }
}

// --- 以下、既存の補助関数（変更なし） ---

async function clearLatestEncounter(ownerUid: string, otherUid: string) {
  const q = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid),
    where("otherUid", "==", otherUid),
    where("isLatest", "==", true)
  );

  const existing = await getDocs(q);

  for (const docSnap of existing.docs) {
    await updateDoc(docSnap.ref, { isLatest: false });
  }
}

export async function fetchEncountersByOwner(ownerUid: string) {
  const q = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid)
  );
  const result = await getDocs(q);

  const items = result.docs.map((d) => ({
    id: d.id,
    ...(d.data() as EncounterDoc),
  }));

  items.sort((a: any, b: any) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });

  return items;
}

export async function fetchLatestCardsByOwner(ownerUid: string) {
  const all = await fetchEncountersByOwner(ownerUid);
  return all.filter((item) => item.isLatest === true);
}

export async function fetchEncounterHistoryByOwnerAndOther(
  ownerUid: string,
  otherUid: string
) {
  const q = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid),
    where("otherUid", "==", otherUid)
  );

  const result = await getDocs(q);

  const items = result.docs.map((d) => ({
    id: d.id,
    ...(d.data() as EncounterDoc),
  }));

  items.sort((a: any, b: any) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });

  return items;
}

export async function markEncountersAsRead(ownerUid: string) {
  const q = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid),
    where("isUnread", "==", true)
  );

  const result = await getDocs(q);

  for (const docSnap of result.docs) {
    await updateDoc(docSnap.ref, { isUnread: false });
  }
}

export async function updateEncounterEventName(
  encounterId: string,
  eventName: string
) {
  await updateDoc(doc(db, "encounters", encounterId), {
    eventName,
  });
}

/**
 * 位置情報を厳格に取得する関数
 * 取得できない場合はエラーを投げて処理を中断させます
 */
async function getCurrentPositionStrict(): Promise<{
  lat: number;
  lng: number;
}> {
  // ブラウザが位置情報に対応していない場合
  if (!("geolocation" in navigator)) {
    throw new Error("LOCATION_ERROR");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        // 🟢 取得失敗時は fallback を返さず、エラーを投げる
        console.error("位置情報の取得に失敗しました:", error);
        reject(new Error("LOCATION_ERROR"));
      },
      {
        enableHighAccuracy: true, // 高精度
        timeout: 8000,            // 8秒待ってダメならタイムアウト
        maximumAge: 0,            // キャッシュを使わない
      }
    );
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) return "住所取得失敗";

    const json = await res.json();
    return json.display_name ?? "住所不明";
  } catch (e) {
    console.error(e);
    return "住所取得失敗";
  }
}