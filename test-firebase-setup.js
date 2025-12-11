// Test Firebase Setup Script
// Run this to verify your Firebase configuration

// Load environment variables
require('dotenv').config();

const admin = require('./firebaseAdmin');
const logger = require('./utils/logger');

async function testFirebaseSetup() {
    console.log('🧪 Testing Firebase Setup...\n');

    // Test 1: Check if Firebase Admin initialized
    if (admin) {
        console.log('✅ Firebase Admin SDK: Initialized');
        
        try {
            // Test 2: Try to access Firebase services
            const db = admin.firestore();
            console.log('✅ Firestore: Available');
            
            const messaging = admin.messaging();
            console.log('✅ Cloud Messaging: Available');
            
            // Test 3: Check project info
            const projectId = admin.app().options.projectId;
            console.log(`✅ Project ID: ${projectId}`);
            
            console.log('\n🎉 Firebase Setup Complete! Your notifications should work.');
            console.log('\n📱 Next steps:');
            console.log('1. Start your server');
            console.log('2. Open your app in browser');
            console.log('3. Allow notification permissions');
            console.log('4. Test with a new order or chef call');
            
        } catch (error) {
            console.log('❌ Firebase Service Error:', error.message);
        }
    } else {
        console.log('❌ Firebase Admin SDK: Not Initialized');
        console.log('\n🔧 To fix:');
        console.log('1. Add your service account JSON to FIREBASE_SERVICE_ACCOUNT in .env');
        console.log('2. Or set FIREBASE_SERVICE_ACCOUNT_FILE path in .env');
        console.log('3. Restart your server');
        console.log('\n📖 See FIREBASE_SETUP_GUIDE.md for detailed instructions');
    }
}

// Run the test
testFirebaseSetup().catch(console.error);