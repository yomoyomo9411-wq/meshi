"use client";

import { db, storage } from "./firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type CardDesignType = "card-base" | "cars-base2";

export type ProfileDoc = {
  name: string;
  affiliation: string;
  sns: string;
  history: string;
  photoURL: string; // StorageのURL
  cardDesign?: CardDesignType; // すでにあるならそのままでOK！
  updatedAt?: Timestamp;      // そのままでOK！
  count?: number;             // 🟢 これを新しく書き加えます！
};

export async function fetchProfile(uid: string): Promise<ProfileDoc | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  if (!snap.exists()) return null;

  const data = snap.data() as ProfileDoc;

  return {
    name: data.name ?? "",
    affiliation: data.affiliation ?? "",
    sns: data.sns ?? "",
    history: data.history ?? "",
    photoURL: data.photoURL ?? "",
    cardDesign:
      data.cardDesign === "cars-base2" ? "cars-base2" : "card-base",
    updatedAt: data.updatedAt,
  };
}

export async function saveProfile(uid: string, data: ProfileDoc) {
  await setDoc(
    doc(db, "profiles", uid),
    {
      ...data,
      cardDesign:
        data.cardDesign === "cars-base2" ? "cars-base2" : "card-base",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * プロフィール画像をStorageにアップロードしてURLを返す
 * - uidごとに固定パスに置く（上書き更新）
 */
export async function uploadProfileImage(uid: string, file: File) {
  const storageRef = ref(storage, `profiles/${uid}/avatar`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return await getDownloadURL(storageRef);
}