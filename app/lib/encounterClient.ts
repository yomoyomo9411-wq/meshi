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
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { fetchProfile, type CardDesignType } from "./profileClient";

export type EncounterSnapshot = {
  name: string;
  affiliation: string;
  sns: string;
  history: string;
  photoURL: string;
  cardDesign: CardDesignType;
  count: number;
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

export async function createEncounter(
  ownerUid: string,
  otherUid: string,
  eventName?: string
) {
  const { lat, lng } = await getCurrentPositionStrict();
  const address = await reverseGeocode(lat, lng);

  const ownerProfile = await fetchProfile(ownerUid);
  const otherProfile = await fetchProfile(otherUid);

  // ★ 1. まず、今回の交換が初めてかどうかを先に判定する
  const qFirstCheck = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid),
    where("otherUid", "==", otherUid)
  );
  const existingDocs = await getDocs(qFirstCheck);
  const isFirstTime = existingDocs.empty;

  // ★ 2. 初回交換なら、スナップショットに保存するカウントを +1 した状態にする
  // これにより、1人目の交換直後にトロフィーが点灯するようになります
  const countForOwnerSnapshot = isFirstTime 
    ? (otherProfile?.count ?? 0) + 1 
    : (otherProfile?.count ?? 0);

  const countForOtherSnapshot = isFirstTime 
    ? (ownerProfile?.count ?? 0) + 1 
    : (ownerProfile?.count ?? 0);

  const normalizeCardDesign = (
    design?: CardDesignType
  ): CardDesignType => {
    if (design === "card-base3") return "card-base3";
    if (design === "card-base2") return "card-base2";
    return "card-base";
  };

  // ★ 3. 計算した新しいカウント（countFor...）を snapshot に入れる
  const snapshotForOwner: EncounterSnapshot = {
    name: otherProfile?.name ?? "",
    affiliation: otherProfile?.affiliation ?? "",
    sns: otherProfile?.sns ?? "",
    history: otherProfile?.history ?? "",
    photoURL: otherProfile?.photoURL ?? "",
    cardDesign: normalizeCardDesign(otherProfile?.cardDesign),
    count: countForOwnerSnapshot, 
  };

  const snapshotForOther: EncounterSnapshot = {
    name: ownerProfile?.name ?? "",
    affiliation: ownerProfile?.affiliation ?? "",
    sns: ownerProfile?.sns ?? "",
    history: ownerProfile?.history ?? "",
    photoURL: ownerProfile?.photoURL ?? "",
    cardDesign: normalizeCardDesign(ownerProfile?.cardDesign),
    count: countForOtherSnapshot,
  };
  await clearLatestEncounter(ownerUid, otherUid);
  await clearLatestEncounter(otherUid, ownerUid);

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

  if (isFirstTime) {
    const myProfileRef = doc(db, "profiles", ownerUid);
    await updateDoc(myProfileRef, {
      count: increment(1),
    });

    const otherProfileRef = doc(db, "profiles", otherUid);
    await updateDoc(otherProfileRef, {
      count: increment(1),
    });

    console.log("初回交換のため、トロフィーカウントを更新しました。");
  } else {
    console.log("2回目以降の交換のため、カウントは維持します。");
  }
}

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

async function getCurrentPositionStrict(): Promise<{
  lat: number;
  lng: number;
}> {
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
        // エラーの詳細をログに出す
        console.error("位置情報の取得に失敗しました:", error);
        reject(new Error("LOCATION_ERROR"));
      },
      {
        enableHighAccuracy: true, // 高精度
        timeout: 15000,           // ★ 8000から15000に延長
        maximumAge: 30000,        // ★ 0から30000(30秒キャッシュ)に変更。これが成功の鍵です。
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