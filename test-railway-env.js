#!/usr/bin/env node

/**
 * Test Railway Firebase Environment Variable
 * Run this to debug your FIREBASE_SERVICE_ACCOUNT environment variable
 */

require('dotenv').config();
const logger = require('./utils/logger');

console.log('\n🔍 Railway Firebase Environment Variable Test\n');

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

function cleanPrivateKey(privateKey) {
  if (!privateKey) return privateKey;
  
  // Handle escaped newlines that are common in environment variables
  return privateKey
    .replace(/\\n/g, '\n')        // Convert escaped newlines to real newlines
    .replace(/\\"/g, '"')        // Convert escaped quotes
    .replace(/\\\\/g, '\\')      // Convert escaped backslashes
    .trim();
}

// Test 1: Check if environment variable exists
console.log('1. Environment Variable Check...');
const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;

if (hasServiceAccount) {
  console.log('   ✅ FIREBASE_SERVICE_ACCOUNT: Set in Railway');
  console.log(`   📏 Length: ${process.env.FIREBASE_SERVICE_ACCOUNT.length} characters`);
  
  // Test 2: Try to parse the JSON
  console.log('\n2. JSON Parsing Test...');
  try {
    const parsed = parseServiceAccountJSON(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('   ✅ JSON Format: Valid');
    console.log(`   🏗️  Project ID: ${parsed.project_id || 'Not found'}`);
    console.log(`   📧 Service Account: ${parsed.client_email || 'Not found'}`);
    console.log(`   🔑 Private Key: ${parsed.private_key ? 'Present (' + parsed.private_key.length + ' chars)' : 'Missing'}`);
    
    // Test 3: Clean private key
    console.log('\n3. Private Key Cleaning Test...');
    const cleanedKey = cleanPrivateKey(parsed.private_key);
    if (cleanedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('   ✅ Private Key: Valid format after cleaning');
    } else {
      console.log('   ⚠️  Private Key: May have formatting issues');
    }
    
    // Test 4: Try to initialize Firebase Admin
    console.log('\n4. Firebase Admin Initialization Test...');
    try {
      const admin = require('firebase-admin');
      
      // Clean the private key
      parsed.private_key = cleanedKey;
      
      // Initialize Firebase
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      
      console.log('   ✅ Firebase Admin: Initialized successfully');
      console.log('   🎉 Your Railway setup is working correctly!');
      
    } catch (firebaseErr) {
      console.log('   ❌ Firebase Admin: Failed to initialize');
      console.log(`   🔧 Error: ${firebaseErr.message}`);
      console.log('   💡 This usually means the private key format is invalid');
    }
    
  } catch (parseError) {
    console.log('   ❌ JSON Format: Invalid');
    console.log(`   🔧 Error: ${parseError.message}`);
    console.log('   💡 Try these solutions:');
    console.log('      - Check that the JSON is properly formatted');
    console.log('      - Ensure the entire JSON is in one line or properly escaped');
    console.log('      - Try base64 encoding the JSON');
  }
} else {
  console.log('   ❌ FIREBASE_SERVICE_ACCOUNT: Not set');
  console.log('   💡 Set this in Railway: Variables > Add Variable');
}

// Final result
console.log('\n' + '='.repeat(60));
console.log('🔧 Railway Setup Steps (if needed):');
console.log('   1. Go to Railway Dashboard');
console.log('   2. Select your project');
console.log('   3. Go to Variables tab');
console.log('   4. Add: FIREBASE_SERVICE_ACCOUNT');
console.log('   5. Value: Your complete service account JSON');
console.log('   6. Redeploy your application');
console.log('='.repeat(60) + '\n');