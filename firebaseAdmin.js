// -----------------------------------------------------
// backend/firebaseAdmin.js
// -----------------------------------------------------

const admin = require("firebase-admin");
const logger = require("./utils/logger");

let serviceAccount;

try {
  // Parse service account JSON from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  logger.info("🔥 Firebase Admin initialized successfully");
} catch (err) {
  logger.error("❌ Firebase Admin failed to initialize:", err);

  // Avoid crashing the server — export null to avoid undefined errors
  module.exports = null;
  return;
}

module.exports = admin;
