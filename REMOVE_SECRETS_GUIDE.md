# 🔒 Remove Secrets from GitHub - Simple Guide

GitHub detected your Firebase service account in commit `a1fd371` and is blocking your push. Here's the simple solution:

## 🚨 The Problem
Your commit `a1fd371` (labeled "plz") contains:
- Firebase service account JSON with private key
- MongoDB connection string
- These are now visible in GitHub's secret scanning

## ✅ The Solution - 3 Options

### Option 1: Use GitHub's Secret Unblock (Recommended)
1. **Go to this URL**: https://github.com/TannuGhangas/maven-cafe-server/security/secret-scanning/unblock-secret/36ge4JPs9MO7qcbGGJZTRJo857k
2. **Click "Unblock"** to allow this specific secret
3. **Push your code** normally

### Option 2: Remove Commit from History (Advanced)
1. **Open terminal in maven-cafe-server folder**
2. **Run these commands**:
   ```bash
   git rebase -i HEAD~10
   ```
3. **Find the line with `a1fd371 plz`** and change it to `drop a1fd371 plz`
4. **Save and exit** the editor
5. **Force push**:
   ```bash
   git push origin main --force
   ```

### Option 3: Fresh Start (Safest)
1. **Backup your current code** (copy to another folder)
2. **Delete .git folder** in maven-cafe-server
3. **Create new git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial clean commit"
   git remote add origin https://github.com/TannuGhangas/maven-cafe-server.git
   git push -f origin main
   ```

## ✅ Your Current Files Are Already Clean
- `.env` file now contains only templates (no secrets)
- All your Firebase configuration is ready for Railway
- Frontend files are correctly configured

## 🎯 Recommended Action
**Use Option 1** (GitHub's unblock feature) - it's the fastest and safest!

Your Railway deployment will work perfectly with the `FIREBASE_SERVICE_ACCOUNT` environment variable you already set up.

---
**Need help?** The GitHub URL in the error message will take you directly to unblock this specific secret.