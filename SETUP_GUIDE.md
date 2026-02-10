# Quick Setup & Start Guide

## ✅ Configuration Complete!

Your Cloudflare R2 credentials have been configured in the `.env` file.

### Current Configuration:
- **MongoDB**: Connected to your Atlas cluster
- **Cloudflare R2 Bucket**: `ketoy`
- **Account ID**: `52c3f18074d18775c806900f87087679`
- **Endpoint**: `https://52c3f18074d18775c806900f87087679.r2.cloudflarestorage.com`

---

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on **http://localhost:3000**

---

## 📡 Verify Installation

### 1. Check Server Health
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2026-02-10T...",
  "uptime": 5.234
}
```

### 2. Test API Root
```bash
curl http://localhost:3000/api
```

---

## 🎯 Quick Test Workflow

### 1. Register a Developer
```bash
curl -X POST http://localhost:3000/api/developers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test Developer"
  }'
```

**Save the Developer API Key from the response!**

### 2. Register an App
```bash
curl -X POST http://localhost:3000/api/apps/register \
  -H "Content-Type: application/json" \
  -H "x-developer-api-key: YOUR_DEVELOPER_API_KEY" \
  -d '{
    "packageName": "com.test.app",
    "appName": "Test App"
  }'
```

**Save the App API Key from the response!**

### 3. Upload a Screen
```bash
curl -X POST http://localhost:3000/api/screens/com.test.app/upload \
  -H "Content-Type: application/json" \
  -H "x-developer-api-key: YOUR_DEVELOPER_API_KEY" \
  -d '{
    "screenName": "home",
    "displayName": "Home Screen",
    "jsonContent": "{\"type\":\"Column\",\"children\":[{\"type\":\"Text\",\"text\":\"Hello World\"}]}"
  }'
```

### 4. Fetch Screen (Mobile App API)
```bash
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=home" \
  -H "x-api-key: YOUR_APP_API_KEY" \
  -H "x-package-name: com.test.app"
```

---

## 🔧 Important Notes

### Cloudflare R2 Bucket
Make sure your R2 bucket `ketoy` is created in your Cloudflare dashboard:
1. Go to R2 Storage in Cloudflare dashboard
2. Verify bucket `ketoy` exists
3. Check bucket permissions

### MongoDB Connection
Your MongoDB Atlas connection is configured. Ensure:
- Network access allows your IP
- Database user has proper permissions
- Database `sdui_backend` will be created automatically

### First-Time Setup
The application will:
- Auto-create database collections on first run
- Create indexes automatically
- Set up folder structure in R2 on first file upload

---

## 📚 Next Steps

1. **Read the Documentation**: Check [README.md](README.md) for complete API docs
2. **See Examples**: Review [API_EXAMPLES.md](API_EXAMPLES.md) for usage patterns
3. **Test Endpoints**: Use the examples above to test your setup
4. **Integrate Mobile App**: Use the mobile API endpoint to fetch UI JSON

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed
- Check your MongoDB URI in `.env`
- Verify network access in MongoDB Atlas
- Ensure database user credentials are correct

### Issue: R2 Upload Failed
- Verify R2 credentials in `.env`
- Check bucket `ketoy` exists in Cloudflare dashboard
- Ensure R2 API keys have read/write permissions

### Issue: Port Already in Use
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

---

## 📞 Support

For detailed documentation and examples:
- **Full API Docs**: [README.md](README.md)
- **Usage Examples**: [API_EXAMPLES.md](API_EXAMPLES.md)

---

**Ready to start! Run `npm install` then `npm run dev` to launch the server.** 🚀
