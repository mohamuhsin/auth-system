"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

/* ============================================================
   🔥 Firebase Web SDK — Client-Safe Initialization (Level 2.0)
   ------------------------------------------------------------
   • Works seamlessly in Next.js 15+ (App Router + SSR)
   • Protects against double initialization
   • Supports analytics only when browser-supported
============================================================ */

/**
 * 🧱 Runtime-safe environment loader
 * Logs missing variables in dev, silently ignores in production.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// 🧩 Validate minimal config in dev
if (process.env.NODE_ENV === "development") {
  const missing = Object.entries(firebaseConfig)
    .filter((entry) => !entry[1]) // ✅ no unused variable warning
    .map((entry) => entry[0]);
  if (missing.length) {
    console.warn("⚠️ Missing Firebase env vars:", missing.join(", "));
  }
}

// ============================================================
// 🧠 Safe Initialization
// ============================================================

let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  // ✅ Initialize client-side only
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  // ✅ Optional Analytics (browser-only)
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => null);

  if (process.env.NODE_ENV === "development")
    console.log("🔥 Firebase initialized (client)");
} else {
  // 🚫 SSR placeholder (avoid reference errors)
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

// ============================================================
// 📦 Exports
// ============================================================
export { app, auth, analytics };
