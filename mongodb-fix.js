#!/usr/bin/env node

/**
 * MongoDB Connection Fix Script
 * 
 * This script helps fix the "connect ECONNREFUSED 127.0.0.1:27017" error
 * by providing multiple solution options.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class MongoDBFixer {
    constructor() {
        this.choices = [
            {
                id: 1,
                title: '🚀 Quick Docker MongoDB (Recommended for Testing)',
                description: 'Start MongoDB instantly using Docker (requires Docker installed)',
                action: this.startDockerMongoDB.bind(this)
            },
            {
                id: 2,
                title: '🖥️ Install Local MongoDB',
                description: 'Install MongoDB Community Edition on Windows',
                action: this.installLocalMongoDB.bind(this)
            },
            {
                id: 3,
                title: '☁️ Use MongoDB Atlas (Cloud)',
                description: 'Set up free cloud MongoDB database',
                action: this.setupMongoDBAtlas.bind(this)
            },
            {
                id: 4,
                title: '🔧 Check Current Setup',
                description: 'Verify current MongoDB installation and configuration',
                action: this.checkCurrentSetup.bind(this)
            },
            {
                id: 5,
                title: '📋 Show Environment Config',
                description: 'Display current .env database configuration',
                action: this.showEnvConfig.bind(this)
            }
        ];
    }

    async startDockerMongoDB() {
        console.log('🐳 Starting MongoDB with Docker...');
        console.log('Note: This requires Docker to be installed on your system.');
        console.log();

        try {
            // Check if Docker is available
            await execPromise('docker --version');
            
            console.log('✅ Docker found! Starting MongoDB container...');
            
            // Check if container already exists
            const { stdout: containers } = await execPromise('docker ps -a --filter name=mongodb --format "{{.Names}}"');
            
            if (containers.trim()) {
                console.log('🗑️ Removing existing MongoDB container...');
                await execPromise('docker rm -f mongodb');
            }
            
            console.log('🚀 Starting new MongoDB container...');
            await execPromise('docker run -d --name mongodb -p 27017:27017 mongo:latest');
            
            console.log('⏳ Waiting for MongoDB to start...');
            await this.sleep(5000);
            
            // Test connection
            await this.testConnection();
            
            console.log('🎉 MongoDB is now running on localhost:27017');
            console.log('💡 You can now start your server with: npm start');
            
        } catch (error) {
            if (error.message.includes('docker')) {
                console.log('❌ Docker is not installed or not accessible.');
                console.log('💡 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop');
            } else {
                console.log('❌ Failed to start MongoDB with Docker:', error.message);
            }
        }
    }

    async installLocalMongoDB() {
        console.log('🖥️ Local MongoDB Installation Guide');
        console.log('=====================================');
        console.log();
        console.log('Step 1: Download MongoDB Community Edition');
        console.log('   🔗 Visit: https://www.mongodb.com/try/download/community');
        console.log('   📋 Choose:');
        console.log('      - Platform: Windows 64 (8.1+)');
        console.log('      - Package: .msi');
        console.log();
        console.log('Step 2: Install MongoDB');
        console.log('   1. Run the downloaded .msi file');
        console.log('   2. Follow the installation wizard');
        console.log('   3. Choose "Run service as Network Service user"');
        console.log('   4. Complete installation');
        console.log();
        console.log('Step 3: Start MongoDB Service');
        console.log('   Open Command Prompt as Administrator and run:');
        console.log('   net start MongoDB');
        console.log();
        console.log('Step 4: Test Installation');
        console.log('   mongod --version');
        console.log('   mongo --host localhost --port 27017');
        console.log();
        console.log('Step 5: Start Your Application');
        console.log('   npm start');
    }

    async setupMongoDBAtlas() {
        console.log('☁️ MongoDB Atlas Setup Guide');
        console.log('============================');
        console.log();
        console.log('Step 1: Create MongoDB Atlas Account');
        console.log('   🔗 Visit: https://cloud.mongodb.com/');
        console.log('   📝 Sign up for free');
        console.log();
        console.log('Step 2: Create New Project');
        console.log('   1. Click "New Project"');
        console.log('   2. Enter project name: "maven-cafe"');
        console.log('   3. Click "Create Project"');
        console.log();
        console.log('Step 3: Create Cluster');
        console.log('   1. Click "Build a Database"');
        console.log('   2. Choose "Shared" (free tier)');
        console.log('   3. Select region closest to you');
        console.log('   4. Click "Create Cluster"');
        console.log();
        console.log('Step 4: Get Connection String');
        console.log('   1. Click "Connect" on your cluster');
        console.log('   2. Choose "Connect your application"');
        console.log('   3. Copy the connection string');
        console.log('   4. Replace <password> with your database password');
        console.log();
        console.log('Step 5: Update .env File');
        console.log('   DB_URI=your_connection_string_here');
        console.log();
        console.log('Step 6: Add IP Address');
        console.log('   1. In Atlas, go to "Network Access"');
        console.log('   2. Click "Add IP Address"');
        console.log('   3. Choose "Allow access from anywhere" (0.0.0.0/0)');
    }

    async checkCurrentSetup() {
        console.log('🔍 Checking Current MongoDB Setup...');
        console.log('=====================================');
        console.log();

        // Check if MongoDB is installed locally
        try {
            const { stdout } = await execPromise('mongod --version');
            console.log('✅ MongoDB Community Edition found:');
            console.log(stdout.split('\n')[0]);
        } catch (error) {
            console.log('❌ MongoDB Community Edition not found locally');
        }

        // Check if MongoDB service is running
        try {
            const { stdout } = await execPromise('sc query MongoDB');
            if (stdout.includes('RUNNING')) {
                console.log('✅ MongoDB Windows Service is running');
            } else {
                console.log('❌ MongoDB Windows Service is not running');
                console.log('💡 Try: net start MongoDB');
            }
        } catch (error) {
            console.log('❌ Could not check MongoDB Windows Service');
        }

        // Check Docker
        try {
            const { stdout } = await execPromise('docker --version');
            console.log('✅ Docker found:', stdout.trim());
            
            // Check for MongoDB container
            try {
                const { stdout: containers } = await execPromise('docker ps --filter name=mongodb --format "{{.Names}}"');
                if (containers.trim()) {
                    console.log('✅ MongoDB Docker container is running:', containers.trim());
                } else {
                    console.log('❌ No MongoDB Docker container found');
                }
            } catch (error) {
                console.log('❌ Could not check Docker containers');
            }
        } catch (error) {
            console.log('❌ Docker not found');
        }

        // Test local connection
        try {
            await this.testConnection();
            console.log('✅ Local MongoDB connection successful!');
        } catch (error) {
            console.log('❌ Local MongoDB connection failed:', error.message);
        }
    }

    showEnvConfig() {
        console.log('📋 Current Environment Configuration');
        console.log('====================================');
        console.log();

        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                if (line.startsWith('DB_URI=')) {
                    console.log('🗄️ Current DB_URI:', line.replace('DB_URI=', ''));
                } else if (line.startsWith('SERVER_PORT=')) {
                    console.log('🔌 Current SERVER_PORT:', line.replace('SERVER_PORT=', ''));
                }
            });
        } else {
            console.log('❌ .env file not found');
        }

        console.log();
        console.log('💡 To change the database connection:');
        console.log('   1. Edit the .env file');
        console.log('   2. Update DB_URI with your connection string');
        console.log('   3. Restart the server');
    }

    async testConnection() {
        // Test MongoDB connection
        const mongoose = require('mongoose');
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/test', {
                serverSelectionTimeoutMS: 3000
            });
            await mongoose.disconnect();
            return true;
        } catch (error) {
            throw new Error('MongoDB connection failed: ' + error.message);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async showMenu() {
        console.log();
        console.log('🔧 MongoDB Connection Fix Tool');
        console.log('==============================');
        console.log();
        console.log('The error "connect ECONNREFUSED 127.0.0.1:27017" means MongoDB is not running.');
        console.log('Choose one of the following solutions:');
        console.log();

        this.choices.forEach(choice => {
            console.log(`${choice.id}. ${choice.title}`);
            console.log(`   ${choice.description}`);
            console.log();
        });

        console.log('Enter your choice (1-5) or press Ctrl+C to exit:');
    }

    async run() {
        while (true) {
            try {
                await this.showMenu();
                
                // Simple prompt for choice
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                const choice = await new Promise(resolve => {
                    rl.question('Choice: ', answer => {
                        rl.close();
                        resolve(parseInt(answer));
                    });
                });

                if (choice >= 1 && choice <= 5) {
                    console.log();
                    await this.choices[choice - 1].action();
                } else {
                    console.log('❌ Invalid choice. Please enter 1-5.');
                }

                console.log();
                console.log('Press Enter to continue...');
                await new Promise(resolve => {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl.question('', () => {
                        rl.close();
                        resolve();
                    });
                });

            } catch (error) {
                if (error.message === 'exit') {
                    break;
                }
                console.log('Error:', error.message);
            }
        }
    }
}

// Run the fixer
if (require.main === module) {
    const fixer = new MongoDBFixer();
    fixer.run().catch(console.error);
}

module.exports = MongoDBFixer;