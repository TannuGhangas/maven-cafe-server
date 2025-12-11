#!/usr/bin/env node

/**
 * Firebase Verification Script
 * Run this to verify your Firebase setup is working correctly
 */

require('dotenv').config();
const admin = require('./firebaseAdmin');
const logger = require('./utils/logger');

console.log('\n🔍 Firebase Setup Verification\n');

async function verifyFirebase() {
    let allTestsPassed = true;

    // Test 1: Check if Firebase Admin loaded
    console.log('1. Firebase Admin SDK...');
    if (admin) {
        console.log('   ✅ Loaded successfully');
    } else {
        console.log('   ❌ Failed to load');
        allTestsPassed = false;
        return;
    }

    // Test 2: Check Firestore availability
    console.log('2. Firestore Database...');
    try {
        const db = admin.firestore();
        console.log('   ✅ Available and ready');
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        allTestsPassed = false;
    }

    // Test 3: Check Cloud Messaging
    console.log('3. Cloud Messaging...');
    try {
        const messaging = admin.messaging();
        console.log('   ✅ Available and ready');
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        allTestsPassed = false;
    }

    // Test 4: Check project configuration
    console.log('4. Project Configuration...');
    try {
        const app = admin.app();
        const projectId = app.options.projectId;
        console.log(`   ✅ Project ID: ${projectId}`);
    } catch (error) {
        console.log('   ⚠️  Project ID: Unable to retrieve (may still work)');
    }

    // Test 5: Check environment variables
    console.log('5. Environment Variables...');
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasServiceAccountFile = !!process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
    
    if (hasServiceAccount) {
        console.log('   ✅ FIREBASE_SERVICE_ACCOUNT: Set');
    } else if (hasServiceAccountFile) {
        console.log('   ✅ FIREBASE_SERVICE_ACCOUNT_FILE: Set');
        console.log(`   📁 File path: ${process.env.FIREBASE_SERVICE_ACCOUNT_FILE}`);
    } else {
        console.log('   ❌ No Firebase service account configuration found');
        allTestsPassed = false;
    }

    // Final result
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
        console.log('🎉 ALL TESTS PASSED! Firebase is properly configured.');
        console.log('\n📱 Your app can now:');
        console.log('   • Send push notifications');
        console.log('   • Access Firestore database');
        console.log('   • Use Firebase Cloud Messaging');
        console.log('   • Perform authentication operations');
        console.log('\n🚀 You can start your server with: npm start');
    } else {
        console.log('❌ Some tests failed. Please check the configuration.');
        console.log('\n🔧 To fix issues:');
        console.log('   1. Ensure serviceAccountKey.json exists');
        console.log('   2. Check .env file has correct Firebase configuration');
        console.log('   3. Verify Firebase project settings');
    }
    console.log('='.repeat(50) + '\n');
}

// Run verification
verifyFirebase().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});