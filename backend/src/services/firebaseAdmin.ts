import admin, { ServiceAccount } from "firebase-admin";

/**
 * 🔥 Firebase Admin Initialization (Level 1.5 Hardened)
 * ------------------------------------------------------------
 * Handles both FIREBASE_SERVICE_ACCOUNT (JSON string)
 * and individual FIREBASE_* vars.
 * Auto-fixes newline escape sequences in private keys.
 * Safe for both local dev and production (Railway, Vercel, etc.)
 */

if (!admin.apps.length) {
  try {
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY,
      FIREBASE_SERVICE_ACCOUNT,
      NODE_ENV,
    } = process.env;

    let credentials: ServiceAccount;

    if (FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
      credentials = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key?.replace(/\\n/g, "\n"),
      };
    } else if (
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
        "❌ Missing Firebase Admin credentials in environment variables"
      );
    }

    admin.initializeApp({ credential: admin.credential.cert(credentials) });

    console.log(
      `✅ Firebase Admin initialized → ${credentials.projectId} [${NODE_ENV}]`
    );
  } catch (err) {
    console.error(
      "🚨 Firebase Admin initialization failed:",
      (err as Error).message
    );
    process.exit(1);
  }
}

export default admin;
