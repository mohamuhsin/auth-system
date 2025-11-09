import admin, { ServiceAccount } from "firebase-admin";

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
          "Invalid FIREBASE_SERVICE_ACCOUNT JSON — check for bad escaping or missing quotes."
        );
      }
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
        "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT or all individual FIREBASE_* vars."
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });

    console.log(
      `✅ Firebase Admin initialized → project: ${credentials.projectId} | env: ${NODE_ENV}`
    );
  } catch (err: any) {
    console.error("Firebase Admin initialization failed:", err.message);
    process.exit(1);
  }
} else {
  console.log("Firebase Admin already initialized — skipping re-init");
}

export default admin;
