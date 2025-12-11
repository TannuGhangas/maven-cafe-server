#!/usr/bin/env node

/**
 * Railway Firebase Debug Script
 * Run this in your Railway environment to debug the issue
 */

require('dotenv').config();
const logger = require('./utils/logger');

console.log('\n🚂 Railway Firebase Debug Tool\n');

// Check if we're in Railway environment
const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_STATIC_URL;
console.log(`Railway Environment: ${isRailway ? '✅ YES' : '⚠️  NO (Running locally)'}`);

// Detailed environment variable check
console.log('\n1. Environment Variables Check...');
console.log('   FIREBASE_SERVICE_ACCOUNT:');
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  console.log(`   ✅ SET (${envVar.length} characters)`);
  console.log(`   📝 Preview: ${envVar.substring(0, 100)}${envVar.length > 100 ? '...' : ''}`);
  
  // Check if it's base64
  const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(envVar.trim()) && envVar.length % 4 === 0;
  console.log(`   🔍 Format: ${isBase64 ? 'Base64 encoded' : 'Direct JSON'}`);
} else {
  console.log('   ❌ NOT SET');
}

console.log('\n   FIREBASE_SERVICE_ACCOUNT_FILE:');
if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
  console.log(`   ✅ SET: ${process.env.FIREBASE_SERVICE_ACCOUNT_FILE}`);
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE)) {
    console.log('   ✅ File exists');
    const fileContent = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
    console.log(`   📏 File size: ${fileContent.length} characters`);
  } else {
    console.log('   ❌ File not found');
  }
} else {
  console.log('   ❌ NOT SET');
}

// Test JSON parsing
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log('\n2. JSON Parsing Test...');
  try {
    const envValue = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount;
    
    if (envValue.trim().startsWith('{') && envValue.trim().endsWith('}')) {
      // Direct JSON
      serviceAccount = JSON.parse(envValue);
      console.log('   ✅ Direct JSON parsing: SUCCESS');
    } else {
      // Try base64 decode
      try {
        const decoded = Buffer.from(envValue, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
        console.log('   ✅ Base64 decoding + JSON parsing: SUCCESS');
      } catch (base64Err) {
        console.log('   ❌ Base64 decoding: FAILED');
        console.log(`   🔧 Error: ${base64Err.message}`);
        return;
      }
    }
    
    console.log('   📊 Parsed data:');
    console.log(`      Project ID: ${serviceAccount.project_id || '❌ MISSING'}`);
    console.log(`      Client Email: ${serviceAccount.client_email || '❌ MISSING'}`);
    console.log(`      Private Key: ${serviceAccount.private_key ? '✅ PRESENT' : '❌ MISSING'}`);
    
    if (serviceAccount.private_key) {
      console.log(`      Private Key Length: ${serviceAccount.private_key.length} characters`);
      console.log(`      Private Key Format: ${serviceAccount.private_key.includes('BEGIN PRIVATE KEY') ? '✅ Valid' : '❌ Invalid'}`);
    }
    
  } catch (parseErr) {
    console.log('   ❌ JSON parsing: FAILED');
    console.log(`   🔧 Error: ${parseErr.message}`);
    console.log('   💡 Solutions:');
    console.log('      - Check JSON formatting');
    console.log('      - Ensure proper escaping');
    console.log('      - Try base64 encoding the JSON');
  }
}

// Test Firebase Admin initialization
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log('\n3. Firebase Admin Initialization Test...');
  try {
    const admin = require('./firebaseAdmin');
    if (admin) {
      console.log('   ✅ Firebase Admin: INITIALIZED SUCCESSFULLY');
      console.log('   🎉 Your setup is working correctly!');
      
      // Test Firebase services
      try {
        const db = admin.firestore();
        console.log('   ✅ Firestore: Available');
      } catch (dbErr) {
        console.log('   ⚠️  Firestore: Error - ' + dbErr.message);
      }
      
      try {
        const messaging = admin.messaging();
        console.log('   ✅ Cloud Messaging: Available');
      } catch (msgErr) {
        console.log('   ⚠️  Cloud Messaging: Error - ' + msgErr.message);
      }
      
    } else {
      console.log('   ❌ Firebase Admin: FAILED TO INITIALIZE');
      console.log('   💡 Check the logs above for specific errors');
    }
  } catch (loadErr) {
    console.log('   ❌ Firebase Admin: LOADING ERROR');
    console.log(`   🔧 Error: ${loadErr.message}`);
  }
}

// Final recommendations
console.log('\n' + '='.repeat(60));
console.log('🔧 Railway Setup Recommendations:');
console.log('');
console.log('If FIREBASE_SERVICE_ACCOUNT is not set:');
console.log('   1. Go to Railway Dashboard');
console.log('   2. Select your project');
console.log('   3. Go to Variables tab');
console.log('   4. Add: FIREBASE_SERVICE_ACCOUNT');
console.log('   5. Value: Your complete service account JSON');
console.log('   6. Redeploy your application');
console.log('');
console.log('If JSON parsing fails:');
console.log('   1. Ensure the JSON is properly formatted');
console.log('   2. Try base64 encoding the JSON');
console.log('   3. Check for special characters that need escaping');
console.log('');
console.log('If Firebase Admin fails to initialize:');
console.log('   1. Check that project_id, client_email, and private_key are present');
console.log('   2. Verify the private key format is correct');
console.log('   3. Ensure the service account has necessary permissions');
console.log('='.repeat(60));