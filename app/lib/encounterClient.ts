"use client";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
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
  createdAt: unknown;
  isLatest: boolean;
  snapshot: EncounterSnapshot;
};

export async function createEncounter(ownerUid: string, otherUid: string) {
  const otherProfile = await fetchProfile(otherUid);

  const snapshot: EncounterSnapshot = {
    name: otherProfile?.name ?? "",
    affiliation: otherProfile?.affiliation ?? "",
    sns: otherProfile?.sns ?? "",
    history: otherProfile?.history ?? "",
    photoURL: otherProfile?.photoURL ?? "",
  };

  const { lat, lng } = await getCurrentPositionWithFallback();
  const address = await reverseGeocode(lat, lng);

  const q = query(
    collection(db, "encounters"),
    where("ownerUid", "==", ownerUid)
  );
  const existing = await getDocs(q);

  for (const docSnap of existing.docs) {
    const data = docSnap.data() as EncounterDoc;
    if (data.otherUid === otherUid && data.isLatest === true) {
      await updateDoc(docSnap.ref, { isLatest: false });
    }
  }

  await addDoc(collection(db, "encounters"), {
    ownerUid,
    otherUid,
    lat,
    lng,
    address,
    createdAt: serverTimestamp(),
    isLatest: true,
    snapshot,
  });
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

async function getCurrentPositionWithFallback(): Promise<{
  lat: number;
  lng: number;
}> {
  const fallback = {
    lat: 36.706,
    lng: 137.213,
  };

  if (!("geolocation" in navigator)) return fallback;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => resolve(fallback),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
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