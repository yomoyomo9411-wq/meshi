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

export type ProfileDoc = {
  name: string;
  affiliation: string;
  sns: string;
  history: string;
  photoURL: string; // StorageのURL
  updatedAt?: Timestamp;
};

export async function fetchProfile(uid: string): Promise<ProfileDoc | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  if (!snap.exists()) return null;
  return snap.data() as ProfileDoc;
}

export async function saveProfile(uid: string, data: ProfileDoc) {
  await setDoc(
    doc(db, "profiles", uid),
    { ...data, updatedAt: serverTimestamp() },
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