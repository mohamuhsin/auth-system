"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

/* ============================================================
   🔥 Firebase Web SDK — Client-Safe Initialization (Fixed)
============================================================ */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// ============================================================
// 🧠 Safe Initialization
// ============================================================

let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  // ✅ Persist session across browser restarts
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("❌ Failed to set persistence:", err);
  });

  // ✅ Optional analytics
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => null);

  if (process.env.NODE_ENV === "development")
    console.log("🔥 Firebase initialized (client)");
} else {
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export { app, auth, analytics };
