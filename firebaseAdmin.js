// -----------------------------------------------------
// backend/firebaseAdmin.js
// -----------------------------------------------------

const admin = require("firebase-admin");
const logger = require("./utils/logger");

let serviceAccount;
let firebaseInitialized = false;

try {
  // Check if FIREBASE_SERVICE_ACCOUNT environment variable exists
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
  }

  // Parse service account JSON from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  // Validate required fields in service account
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Invalid service account JSON - missing required fields (project_id, client_email, private_key)");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  firebaseInitialized = true;
  logger.info("🔥 Firebase Admin initialized successfully");
} catch (err) {
  logger.error("❌ Firebase Admin failed to initialize:", err.message);
  logger.error("💡 To fix this, add your Firebase service account JSON to FIREBASE_SERVICE_ACCOUNT environment variable");
  logger.error("💡 Or set FIREBASE_SERVICE_ACCOUNT_FILE path to a JSON file containing the service account");

  // Try alternative: load from file if FIREBASE_SERVICE_ACCOUNT_FILE is provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      const fs = require('fs');
      const serviceAccountFile = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      firebaseInitialized = true;
      logger.info("🔥 Firebase Admin initialized successfully from file");
    } catch (fileErr) {
      logger.error("❌ Failed to load Firebase service account from file:", fileErr.message);
    }
  }

  // Avoid crashing the server — export null to avoid undefined errors
  if (!firebaseInitialized) {
    module.exports = null;
    return;
  }
}

module.exports = firebaseInitialized ? admin : null;
