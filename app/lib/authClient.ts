"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user; // uid, displayName, photoURL etc.
}

export async function logout() {
  await signOut(auth);
}