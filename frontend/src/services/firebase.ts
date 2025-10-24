"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

/* ============================================================
   🔥 Firebase Web SDK — Client-Safe Initialization
   Works in Next.js 15+ (App Router, Static + SSR)
============================================================ */

/**
 * 🧱 Runtime-safe env loader
 * Avoids undefined vars during build (Vercel or local)
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

// ✅ Ensure we never run initialization during build-time (SSR)
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  // Initialize only on the client
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  // Safe Analytics init (browser only)
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => null);
} else {
  // Provide placeholders for server-side (to avoid build errors)
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

/* ============================================================
   🧩 Exports
============================================================ */
export { app, auth, analytics };
