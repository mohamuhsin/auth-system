import admin, { ServiceAccount } from "firebase-admin";

/**
 * 🔥 Firebase Admin Initialization (Level 2.0 Hardened)
 * ------------------------------------------------------------
 * Supports:
 *   - FIREBASE_SERVICE_ACCOUNT (single JSON string)
 *   - or individual FIREBASE_* vars.
 *
 * Auto-fixes escaped newline sequences in private keys.
 * Prevents duplicate initialization.
 * Fails fast with clear context (never a silent 500).
 */

if (!admin.apps.length) {
  try {
    const {
      FIREBASE_SERVICE_ACCOUNT,
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY,
      NODE_ENV,
    } = process.env;

    let credentials: ServiceAccount;

    /* ============================================================
       1️⃣ Preferred: FIREBASE_SERVICE_ACCOUNT (JSON string)
    ============================================================ */
    if (FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
        credentials = {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key?.replace(/\\n/g, "\n"),
        };
      } catch (jsonErr) {
        throw new Error(
          "Failed to parse FIREBASE_SERVICE_ACCOUNT JSON — check escape sequences"
        );
      }
    } else if (
      /* ============================================================
       2️⃣ Fallback: Individual FIREBASE_* variables
    ============================================================ */
      FIREBASE_PROJECT_ID &&
      FIREBASE_CLIENT_EMAIL &&
      FIREBASE_PRIVATE_KEY
    ) {
      credentials = {
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      };
    } else {
      throw new Error(
        "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT or individual FIREBASE_* vars."
      );
    }

    /* ============================================================
       3️⃣ Initialize Firebase Admin
    ============================================================ */
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });

    console.log(
      `✅ Firebase Admin initialized → ${credentials.projectId} [${NODE_ENV}]`
    );
  } catch (err: any) {
    console.error("🚨 Firebase Admin initialization failed:", err.message);
    // Fail fast — don't let Express start without valid credentials
    process.exit(1);
  }
} else {
  console.log("⚙️ Firebase Admin already initialized — skipping re-init");
}

export default admin;
