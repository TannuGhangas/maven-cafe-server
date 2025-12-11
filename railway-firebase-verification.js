#!/usr/bin/env node

/**
 * Railway Firebase Verification Script
 * Run this to verify your Firebase setup works correctly on Railway
 */

require('dotenv').config();
const admin = require('./firebaseAdmin');
const logger = require('./utils/logger');

console.log('\n🚂 Railway Firebase Setup Verification\n');
console.log('Platform: Railway');
console.log('Environment: Production\n');

async function verifyRailwayFirebase() {
    let allTestsPassed = true;

    // Test 1: Check if Firebase Admin loaded from Railway environment
    console.log('1. Firebase Admin SDK (Railway Environment)...');
    if (admin) {
        console.log('   ✅ Loaded successfully from FIREBASE_SERVICE_ACCOUNT');
    } else {
        console.log('   ❌ Failed to load from Railway environment variable');
        console.log('   💡 Ensure FIREBASE_SERVICE_ACCOUNT is set in Railway dashboard');
        allTestsPassed = false;
        return;
    }

    // Test 2: Verify environment variable is properly set
    console.log('\n2. Environment Variable Check...');
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccountLength = process.env.FIREBASE_SERVICE_ACCOUNT ? process.env.FIREBASE_SERVICE_ACCOUNT.length : 0;
    
    if (hasServiceAccount) {
        console.log('   ✅ FIREBASE_SERVICE_ACCOUNT: Set in Railway');
        console.log(`   📏 Length: ${serviceAccountLength} characters`);
        
        // Validate JSON format
        try {
            const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log('   ✅ JSON Format: Valid');
            console.log(`   🏗️  Project ID: ${parsed.project_id || 'Not found'}`);
            console.log(`   📧 Service Account: ${parsed.client_email || 'Not found'}`);
        } catch (parseError) {
            console.log('   ❌ JSON Format: Invalid');
            console.log(`   🔧 Error: ${parseError.message}`);
            allTestsPassed = false;
        }
    } else {
        console.log('   ❌ FIREBASE_SERVICE_ACCOUNT: Not set');
        console.log('   💡 Add this in Railway: Variables > Add Variable');
        allTestsPassed = false;
    }

    // Test 3: Test Firestore connection
    console.log('\n3. Firestore Database Connection...');
    try {
        const db = admin.firestore();
        console.log('   ✅ Firestore: Connected and ready');
        
        // Test a simple operation
        const testDoc = db.collection('_test').doc('railway-verify');
        await testDoc.set({
            timestamp: new Date(),
            platform: 'Railway',
            status: 'connected'
        });
        console.log('   ✅ Write Test: Successful');
        await testDoc.delete(); // Clean up
        console.log('   🧹 Test Document: Cleaned up');
    } catch (error) {
        console.log('   ❌ Firestore Error:', error.message);
        console.log('   💡 Check Firebase project permissions');
        allTestsPassed = false;
    }

    // Test 4: Test Cloud Messaging
    console.log('\n4. Cloud Messaging Service...');
    try {
        const messaging = admin.messaging();
        console.log('   ✅ Cloud Messaging: Available');
        
        // Note: We don't send actual messages during verification
        console.log('   📱 Ready to send push notifications');
    } catch (error) {
        console.log('   ❌ Cloud Messaging Error:', error.message);
        console.log('   💡 Check Firebase Cloud Messaging setup');
        allTestsPassed = false;
    }

    // Test 5: Project Configuration
    console.log('\n5. Project Configuration...');
    try {
        const app = admin.app();
        const projectId = app.options.projectId;
        console.log(`   ✅ Project ID: ${projectId}`);
        console.log(`   🔗 Project URL: https://console.firebase.google.com/project/${projectId}`);
    } catch (error) {
        console.log('   ⚠️  Project Info: Unable to retrieve (may still work)');
    }

    // Final result
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
        console.log('🎉 ALL TESTS PASSED! Firebase is ready for Railway production.');
        console.log('\n📱 Your Maven Cafe app can now:');
        console.log('   • Send push notifications to users');
        console.log('   • Access Firestore database');
        console.log('   • Use Firebase Cloud Messaging');
        console.log('   • Perform authentication operations');
        console.log('\n🚀 Railway Deployment Status: ✅ READY');
        console.log('   Your server will start successfully with Firebase support.');
    } else {
        console.log('❌ Some tests failed. Please fix before deploying to Railway.');
        console.log('\n🔧 Railway Setup Steps:');
        console.log('   1. Go to Railway Dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to Variables tab');
        console.log('   4. Add: FIREBASE_SERVICE_ACCOUNT');
        console.log('   5. Value: Your complete service account JSON');
        console.log('   6. Redeploy your application');
    }
    console.log('='.repeat(60) + '\n');

    return allTestsPassed;
}

// Run verification
verifyRailwayFirebase()
    .then(success => {
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Railway verification failed:', error);
        process.exit(1);
    });