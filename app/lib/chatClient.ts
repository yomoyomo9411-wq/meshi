"use client";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type ChatMessage = {
  id?: string;
  text: string;
  senderUid: string;
  createdAt: any;
};

export function buildRoomId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("__");
}

export function subscribeMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "chatRooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ChatMessage, "id">),
    }));
    callback(list);
  });
}

export async function sendMessage(
  roomId: string,
  senderUid: string,
  text: string
) {
  const value = text.trim();
  if (!value) return;

  await addDoc(collection(db, "chatRooms", roomId, "messages"), {
    text: value,
    senderUid,
    createdAt: serverTimestamp(),
  });
}