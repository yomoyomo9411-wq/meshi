"use client";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
  doc,
  setDoc,
  increment,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type ChatMessage = {
  id?: string;
  text: string;
  senderUid: string;
  createdAt: any;
};

// ルームID作成
export function buildRoomId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("__");
}

// メッセージ購読
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

// メッセージ送信
export async function sendMessage(
  roomId: string,
  senderUid: string,
  receiverUid: string,
  text: string
) {
  const value = text.trim();
  if (!value) return;

  // メッセージ保存
  await addDoc(collection(db, "chatRooms", roomId, "messages"), {
    text: value,
    senderUid,
    createdAt: serverTimestamp(),
  });

  // 最終メッセージ更新
  await setDoc(
    doc(db, "chatRooms", roomId),
    {
      lastMessage: {
        text: value,
        senderUid,
        createdAt: serverTimestamp(),
      },
    },
    { merge: true }
  );

  // 相手の未読 +1
  await setDoc(
    doc(db, "chatRooms", roomId),
    {
      [`unreadCount_${receiverUid}`]: increment(1),
    },
    { merge: true }
  );
}

// チャットを開いたとき未読を0にする
export async function markAsRead(roomId: string, uid: string) {
  await updateDoc(doc(db, "chatRooms", roomId), {
    [`unreadCount_${uid}`]: 0,
  });
}