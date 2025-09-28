# MongoDB Atlas Setup Guide

## Quick Setup (5 minutes)

1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Create Free Account** (if you don't have one)
3. **Create Free Cluster**:
   - Choose "M0 Sandbox" (Free tier)
   - Select region closest to you
   - Name it "strategy-forge-cluster"
4. **Create Database User**:
   - Username: `admin`
   - Password: `password123` (or your choice)
   - Database User Privileges: "Atlas admin"
5. **Whitelist IP Address**:
   - Add "0.0.0.0/0" to allow access from anywhere (for development)
6. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `strategy_forge`

## Example Connection String:
```
mongodb+srv://admin:password123@strategy-forge-cluster.xxxxx.mongodb.net/strategy_forge?retryWrites=true&w=majority
```

## Update .env File:
Replace the MONGODB_URI in backend/.env with your Atlas connection string.

## Alternative: Install MongoDB Locally
If you prefer local MongoDB:
1. Download from: https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Keep the current localhost URI in .env