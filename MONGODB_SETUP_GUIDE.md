# 🍃 MongoDB Setup Guide

## 🎯 Quick Fix for Local Development

Your Firebase is working perfectly! Now you need MongoDB for the database. Here are your options:

## Option 1: Local MongoDB (Recommended for Development)

### Install MongoDB Community Edition:

**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Choose:
   - Platform: Windows 64 (8.1+)
   - Package: .msi
3. Run the installer with default settings
4. MongoDB will install as a Windows service

**Alternative - MongoDB as Windows Service:**
```cmd
# Install MongoDB as a Windows service
"C:\Program Files\MongoDB\Server\[version]\bin\mongod.exe" --install --serviceName "MongoDB" --serviceDisplayName "MongoDB"
```

**Start MongoDB:**
```cmd
net start MongoDB
```

### Verify Installation:
```cmd
# Test MongoDB connection
"C:\Program Files\MongoDB\Server\[version]\bin\mongo.exe"
```

## Option 2: MongoDB Atlas (Cloud - Recommended for Production)

### Setup MongoDB Atlas:

1. **Go to:** https://cloud.mongodb.com/
2. **Create Account** (free tier available)
3. **Create New Project**
4. **Create Cluster:**
   - Choose "Shared" (free tier)
   - Select region closest to you
   - Create cluster

5. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

### Add to Railway:
1. Go to Railway Dashboard
2. Variables tab
3. Add: `DB_URI`
4. Value: Your MongoDB Atlas connection string
5. Redeploy

## Option 3: Quick Test with Docker

If you have Docker installed:
```cmd
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Stop when done
docker stop mongodb
docker rm mongodb
```

## 🔧 Environment Configuration

The `.env` file is now configured for local MongoDB:
```env
DB_URI=mongodb://127.0.0.1:27017/maven-cafe
```

For production, set these in Railway:
- `DB_URI`: Your MongoDB connection string
- `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON

## ✅ Testing Your Setup

### Test Local MongoDB:
```cmd
cd maven-cafe-server
npm start
```

**Expected output:**
- ✅ `🔥 Firebase Admin initialized successfully`
- ✅ `🗄️ MongoDB URI: mongodb://127.0.0.1:27017/maven-cafe`
- ✅ `🚀 Maven Cafe Server running on port 3001`

### Test Database Connection:
```cmd
# In another terminal, test the connection
"C:\Program Files\MongoDB\Server\[version]\bin\mongo.exe"
> use maven-cafe
> db.test.insertOne({message: "Hello from Maven Cafe"})
> db.test.find()
```

## 🚨 Troubleshooting

**If MongoDB not found:**
1. Ensure MongoDB is installed and running
2. Check if service is running: `net start MongoDB`
3. Verify port 27017 is not blocked by firewall

**If connection fails:**
1. Check MongoDB is running: `mongod --version`
2. Test direct connection: `mongo --host localhost --port 27017`
3. Check .env file has correct DB_URI

**If using MongoDB Atlas:**
1. Ensure IP address is whitelisted
2. Check username/password in connection string
3. Verify cluster is not paused

## 🎯 Summary

- **Firebase:** ✅ Working perfectly
- **Local MongoDB:** Install MongoDB Community Edition
- **Cloud MongoDB:** Use MongoDB Atlas (recommended for Railway)
- **Environment:** Configured in .env file

Your application is now ready for both local development and Railway deployment! 🚀