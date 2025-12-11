// Debug environment variables
require('dotenv').config();

console.log('🔍 Environment Variables Debug:');
console.log('FIREBASE_SERVICE_ACCOUNT_FILE:', process.env.FIREBASE_SERVICE_ACCOUNT_FILE);
console.log('FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'SET' : 'NOT SET');

// Test file access
const fs = require('fs');
const path = require('path');

if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_FILE);
    console.log('📁 File path:', filePath);
    console.log('📁 File exists:', fs.existsSync(filePath));
    
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);
            console.log('✅ JSON is valid');
            console.log('📋 Project ID:', json.project_id);
            console.log('📧 Client Email:', json.client_email);
        } catch (err) {
            console.log('❌ JSON parse error:', err.message);
        }
    }
}

// Test Firebase Admin
try {
    const admin = require('./firebaseAdmin');
    console.log('🔥 Firebase Admin:', admin ? 'LOADED' : 'NOT LOADED');
} catch (err) {
    console.log('❌ Firebase Admin error:', err.message);
}