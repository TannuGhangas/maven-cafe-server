// -----------------------------------------------------
// backend/firebaseAdmin.js
// -----------------------------------------------------

const admin = require("firebase-admin");
const logger = require("./utils/logger");

let serviceAccount;
let firebaseInitialized = false;

// Try to load Firebase configuration - Production First Approach
try {
  // PRIORITY 1: Environment variable (Production Recommended)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Invalid service account JSON - missing required fields (project_id, client_email, private_key)");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      logger.info("🔥 Firebase Admin initialized successfully from environment variable");
      logger.info(`📊 Project: ${serviceAccount.project_id} | Service Account: ${serviceAccount.client_email}`);
    } catch (parseErr) {
      logger.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", parseErr.message);
      logger.error("💡 Check that the FIREBASE_SERVICE_ACCOUNT contains valid JSON");
    }
  }

  // PRIORITY 2: File-based approach (Development/Fallback)
  if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      const fs = require('fs');
      
      // Check if file exists first
      if (!fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE)) {
        throw new Error(`Service account file not found: ${process.env.FIREBASE_SERVICE_ACCOUNT_FILE}`);
      }
      
      const serviceAccountFile = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Invalid service account JSON - missing required fields (project_id, client_email, private_key)");
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      firebaseInitialized = true;
      logger.info("🔥 Firebase Admin initialized successfully from file");
      logger.info(`📊 Project: ${serviceAccount.project_id} | Service Account: ${serviceAccount.client_email}`);
      logger.info(`📁 Loaded from: ${process.env.FIREBASE_SERVICE_ACCOUNT_FILE}`);
    } catch (fileErr) {
      logger.error("❌ Failed to load Firebase service account from file:", fileErr.message);
      logger.error("💡 Check that the file exists and contains valid JSON");
      logger.error("💡 Consider using FIREBASE_SERVICE_ACCOUNT environment variable for production");
    }
  }

  // If we get here, no valid configuration was found
  if (!firebaseInitialized) {
    const errorMsg = "No Firebase service account configuration found. Set either FIREBASE_SERVICE_ACCOUNT environment variable or FIREBASE_SERVICE_ACCOUNT_FILE path.";
    logger.error("❌ Firebase Admin initialization failed:", errorMsg);
    logger.error("💡 For production: Use FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON");
    logger.error("💡 For development: Use FIREBASE_SERVICE_ACCOUNT_FILE path to your serviceAccountKey.json");
    throw new Error(errorMsg);
  }

} catch (err) {
  logger.error("❌ Firebase Admin failed to initialize:", err.message);
  logger.error("🔧 Solution: Set FIREBASE_SERVICE_ACCOUNT with your Firebase service account JSON");
  logger.error("🔧 Alternative: Set FIREBASE_SERVICE_ACCOUNT_FILE path to a JSON file");
}

// Export the Firebase Admin object if initialized, otherwise null
if (firebaseInitialized) {
  module.exports = admin;
} else {
  module.exports = null;
}
