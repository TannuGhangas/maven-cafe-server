#!/usr/bin/env node

/**
 * Quick Fix for Railway Firebase Issues
 * This script helps you identify and fix the most common Railway Firebase problems
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 Railway Firebase Quick Fix Tool\n');

// Check 1: Does serviceAccountKey.json exist locally?
console.log('1. Checking local service account file...');
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  console.log('   ✅ serviceAccountKey.json found locally');
  
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('   ✅ JSON is valid');
    console.log(`   📊 Project ID: ${serviceAccount.project_id}`);
    console.log(`   📧 Service Account: ${serviceAccount.client_email}`);
    console.log(`   🔑 Private Key: ${serviceAccount.private_key ? 'Present' : 'Missing'}`);
    
    // Create base64 encoded version for Railway
    const jsonString = JSON.stringify(serviceAccount);
    const base64Encoded = Buffer.from(jsonString, 'utf8').toString('base64');
    
    console.log('\n2. Railway Environment Variable Setup:');
    console.log('   Option A - Direct JSON (if under 32KB):');
    console.log('   Variable Name: FIREBASE_SERVICE_ACCOUNT');
    console.log(`   Variable Value: ${jsonString.substring(0, 100)}...`);
    console.log('\n   Option B - Base64 Encoded (recommended for large files):');
    console.log('   Variable Name: FIREBASE_SERVICE_ACCOUNT');
    console.log(`   Variable Value: ${base64Encoded.substring(0, 100)}...`);
    
    // Check file size
    const fileSizeInBytes = fs.statSync(serviceAccountPath).size;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
    
    console.log(`\n3. File Size Check:`);
    console.log(`   📏 Size: ${fileSizeInKB} KB`);
    
    if (fileSizeInBytes > 32000) {
      console.log('   ⚠️  WARNING: File is large (>32KB)');
      console.log('   💡 RECOMMENDATION: Use base64 encoding for Railway');
    } else {
      console.log('   ✅ File size is acceptable for direct JSON');
    }
    
    // Check private key format
    if (serviceAccount.private_key) {
      console.log('\n4. Private Key Format Check:');
      if (serviceAccount.private_key.includes('\\n')) {
        console.log('   ⚠️  WARNING: Private key has escaped newlines');
        console.log('   💡 The updated firebaseAdmin.js will handle this automatically');
      } else if (serviceAccount.private_key.includes('\n')) {
        console.log('   ✅ Private key has proper newlines');
      } else {
        console.log('   ⚠️  WARNING: Private key may have formatting issues');
      }
    }
    
    console.log('\n5. Railway Setup Instructions:');
    console.log('   1. Go to Railway Dashboard (https://railway.app)');
    console.log('   2. Select your Maven Cafe project');
    console.log('   3. Go to Variables tab');
    console.log('   4. Add a new variable:');
    console.log('      Name: FIREBASE_SERVICE_ACCOUNT');
    console.log(`      Value: ${fileSizeInKB > 32 ? base64Encoded : jsonString}`);
    console.log('   5. Click "Add"');
    console.log('   6. Go to Deploy tab and trigger a redeploy');
    console.log('\n   After redeployment, run: npm run railway-debug');
    
  } catch (err) {
    console.log(`   ❌ Error reading JSON: ${err.message}`);
  }
  
} else {
  console.log('   ❌ serviceAccountKey.json not found');
  console.log('   💡 Download it from Firebase Console:');
  console.log('      1. Go to https://console.firebase.google.com');
  console.log('      2. Select your project');
  console.log('      3. Go to Project Settings > Service Accounts');
  console.log('      4. Click "Generate new private key"');
  console.log('      5. Save the downloaded file as serviceAccountKey.json');
}

// Final status
console.log('\n' + '='.repeat(60));
console.log('🎯 NEXT STEPS:');
console.log('1. Ensure serviceAccountKey.json is downloaded and valid');
console.log('2. Set FIREBASE_SERVICE_ACCOUNT in Railway dashboard');
console.log('3. Redeploy your application');
console.log('4. Test with: npm run railway-debug');
console.log('='.repeat(60) + '\n');