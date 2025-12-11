// -----------------------------------------------------
// backend/firebaseAdmin.js - Railway Optimized
// -----------------------------------------------------

const admin = require("firebase-admin");
const logger = require("./utils/logger");

console.log("FIREBASE_SERVICE_ACCOUNT preview:", process.env.FIREBASE_SERVICE_ACCOUNT?.slice(0, 50));


let serviceAccount;
let firebaseInitialized = false;

// Helper function to safely parse JSON from environment variable
function parseServiceAccountJSON(envValue) {
  if (!envValue) return null;
  
  try {
    // Handle base64 encoded JSON (Railway sometimes does this)
    if (envValue.trim().startsWith('{') && envValue.trim().endsWith('}')) {
      // Direct JSON
      return JSON.parse(envValue);
    } else {
      // Try base64 decode first
      try {
        const decoded = Buffer.from(envValue, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (base64Err) {
        // If base64 fails, try direct JSON parsing
        return JSON.parse(envValue);
      }
    }
  } catch (parseErr) {
    throw new Error(`Failed to parse service account JSON: ${parseErr.message}`);
  }
}

// Helper function to clean private key
function cleanPrivateKey(privateKey) {
  if (!privateKey) return privateKey;
  
  // Handle escaped newlines that are common in environment variables
  return privateKey
    .replace(/\\n/g, '\n')        // Convert escaped newlines to real newlines
    .replace(/\\"/g, '"')        // Convert escaped quotes
    .replace(/\\\\/g, '\\')      // Convert escaped backslashes
    .trim();
}

// Try to load Firebase configuration - Production First Approach
try {
  // PRIORITY 1: Environment variable (Production Recommended)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      logger.info("🔍 Attempting to load Firebase service account from environment variable...");
      
      serviceAccount = parseServiceAccountJSON(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      // Clean the private key to handle escaped newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = cleanPrivateKey(serviceAccount.private_key);
      }
      
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
      logger.error("💡 Common solutions:");
      logger.error("   - Ensure the JSON is properly formatted");
      logger.error("   - Check that newlines in private_key are preserved");
      logger.error("   - Verify the entire JSON string is in one line or properly escaped");
      logger.error("   - Try base64 encoding the JSON if direct JSON fails");
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
    logger.error("🔧 Railway Setup:");
    logger.error("   1. Go to Railway Dashboard");
    logger.error("   2. Select your project");
    logger.error("   3. Go to Variables tab");
    logger.error("   4. Add: FIREBASE_SERVICE_ACCOUNT");
    logger.error("   5. Value: Your complete service account JSON");
    logger.error("   6. Redeploy your application");
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
