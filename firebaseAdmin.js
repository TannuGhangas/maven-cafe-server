// -----------------------------------------------------
// backend/firebaseAdmin.js
// -----------------------------------------------------

const admin = require("firebase-admin");
const logger = require("./utils/logger");

let serviceAccount;
let firebaseInitialized = false;

// Try to load Firebase configuration
try {
  // Try FIREBASE_SERVICE_ACCOUNT environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Invalid service account JSON - missing required fields");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      logger.info("🔥 Firebase Admin initialized successfully from environment variable");
    } catch (parseErr) {
      logger.warn("⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT, trying file fallback:", parseErr.message);
    }
  }

  // Try FIREBASE_SERVICE_ACCOUNT_FILE if env var approach failed
  if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      const fs = require('fs');
      const serviceAccountFile = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Invalid service account JSON - missing required fields");
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      firebaseInitialized = true;
      logger.info("🔥 Firebase Admin initialized successfully from file");
    } catch (fileErr) {
      logger.error("❌ Failed to load Firebase service account from file:", fileErr.message);
      logger.error("💡 Check that the file exists and contains valid JSON");
    }
  }

  // If we get here, no valid configuration was found
  if (!firebaseInitialized) {
    throw new Error("No Firebase service account configuration found. Set either FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_FILE");
  }

} catch (err) {
  logger.error("❌ Firebase Admin failed to initialize:", err.message);
  logger.error("💡 To fix this, add your Firebase service account JSON to FIREBASE_SERVICE_ACCOUNT environment variable");
  logger.error("💡 Or set FIREBASE_SERVICE_ACCOUNT_FILE path to a JSON file containing the service account");
}

// Export the Firebase Admin object if initialized, otherwise null
if (firebaseInitialized) {
  module.exports = admin;
} else {
  module.exports = null;
}
