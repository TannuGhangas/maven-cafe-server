#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * Tests the current MongoDB configuration and provides clear feedback
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testMongoDBConnection() {
    console.log('🔍 Testing MongoDB Connection');
    console.log('=============================');
    console.log();

    // Display current configuration
    const dbUri = process.env.DB_URI;
    console.log('📋 Current Configuration:');
    console.log(`   DB_URI: ${dbUri || 'NOT SET'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log();

    if (!dbUri) {
        console.log('❌ ERROR: DB_URI environment variable is not set!');
        console.log('💡 Solution: Add DB_URI to your .env file');
        console.log('   Example: DB_URI=mongodb://127.0.0.1:27017/maven-cafe');
        return false;
    }

    // Test connection with timeout
    console.log('🔄 Testing connection...');
    console.log();

    try {
        // Set connection timeout
        mongoose.set('serverSelectionTimeoutMS', 5000);
        
        const startTime = Date.now();
        await mongoose.connect(dbUri);
        const connectionTime = Date.now() - startTime;

        console.log('✅ SUCCESS: MongoDB connection established!');
        console.log(`⏱️  Connection time: ${connectionTime}ms`);
        console.log();

        // Get database info
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('📊 Database Information:');
        console.log(`   Database: ${db.databaseName}`);
        console.log(`   Collections: ${collections.length}`);
        console.log();

        if (collections.length > 0) {
            console.log('📋 Existing Collections:');
            collections.forEach(collection => {
                console.log(`   - ${collection.name}`);
            });
        } else {
            console.log('📋 Database is empty (collections will be created when needed)');
        }

        console.log();
        console.log('🎉 Your MongoDB setup is working correctly!');
        console.log('💡 You can now start your server with: npm start');

        return true;

    } catch (error) {
        console.log('❌ CONNECTION FAILED!');
        console.log();
        console.log('🔍 Error Details:');
        console.log(`   Message: ${error.message}`);
        console.log();

        // Provide specific error solutions
        if (error.message.includes('ECONNREFUSED')) {
            console.log('🚨 Common Causes:');
            console.log('   1. MongoDB is not running');
            console.log('   2. Wrong connection string');
            console.log('   3. Firewall blocking connection');
            console.log();
            console.log('💡 Solutions:');
            console.log('   1. Run: node mongodb-fix.js');
            console.log('   2. Or: start-mongodb.bat (if MongoDB installed)');
            console.log('   3. Or: docker run -d -p 27017:27017 --name mongodb mongo:latest');
            
        } else if (error.message.includes('Authentication')) {
            console.log('🚨 Authentication Error:');
            console.log('   - Check username/password in DB_URI');
            console.log('   - Verify user exists in MongoDB');
            console.log('   - Check IP whitelist (for Atlas)');
            
        } else if (error.message.includes('timeout')) {
            console.log('🚨 Connection Timeout:');
            console.log('   - MongoDB server might be starting');
            console.log('   - Check network connectivity');
            console.log('   - Verify connection string is correct');
        }

        console.log();
        console.log('📖 For more help, check MONGODB_SETUP_GUIDE.md');

        return false;

    } finally {
        // Always close connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

// Run the test
if (require.main === module) {
    testMongoDBConnection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = testMongoDBConnection;