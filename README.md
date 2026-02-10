# Server-Driven UI (SDUI) Backend API

A robust and scalable REST API backend system for Server-Driven UI that serves UI definitions as JSON to mobile applications. Built with Express.js, MongoDB, and Cloudflare R2 storage.

## 🚀 Features

- **Multi-App Support**: Manage multiple mobile applications with separate UI definitions
- **Screen Management**: CRUD operations for screen UI JSON definitions
- **Secure Storage**: JSON files stored in Cloudflare R2 with metadata in MongoDB
- **API Key Authentication**: Secure access control for mobile apps
- **Developer Management**: Separate developer accounts with app ownership
- **Malware Scanning**: Built-in security scanning for uploaded JSON content
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Scalable Architecture**: Separation of concerns with clean MVC pattern

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Security](#security)
- [Deployment](#deployment)

## ✅ Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Cloudflare R2 account with:
  - Account ID
  - Access Key ID
  - Secret Access Key
  - Bucket created

## 📦 Installation

1. **Clone the repository:**
   ```bash
   cd ketoy-nodejs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual credentials.

4. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sdui_backend

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=sdui-json-files
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Security
API_SECRET=your_super_secret_key_for_generating_api_keys
JWT_SECRET=your_jwt_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=*
```

### Cloudflare R2 Setup

1. Log in to your Cloudflare dashboard
2. Navigate to R2 Storage
3. Create a new bucket (e.g., `sdui-json-files`)
4. Generate API tokens with read/write permissions
5. Copy your Account ID and API credentials

## 📁 Project Structure

```
ketoy-nodejs/
├── config/
│   ├── config.js              # Configuration settings
│   └── database.js            # MongoDB connection
├── controllers/
│   ├── developerController.js # Developer management logic
│   ├── appController.js       # App management logic
│   └── screenController.js    # Screen management logic
├── middleware/
│   ├── auth.js               # Authentication middleware
│   ├── validation.js         # Request validation
│   ├── security.js           # JSON scanning & security
│   ├── errorHandler.js       # Error handling
│   └── index.js              # Middleware exports
├── models/
│   ├── Developer.js          # Developer schema
│   ├── App.js                # App schema
│   ├── Screen.js             # Screen schema
│   └── index.js              # Model exports
├── routes/
│   ├── developerRoutes.js    # Developer endpoints
│   ├── appRoutes.js          # App endpoints
│   ├── screenRoutes.js       # Screen endpoints
│   └── index.js              # Route aggregation
├── services/
│   └── r2Storage.js          # Cloudflare R2 service
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── index.js                  # Server entry point
├── package.json              # Dependencies
└── README.md                 # Documentation
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### For Developers (Management APIs)
Include `x-developer-id` header with the developer's MongoDB ID.

#### For Mobile Apps (Screen APIs)
Include both headers or query parameters:
- `x-api-key` or `api_key`: Your app's API key
- `x-package-name` or `package_name`: Your app's package name

---

### 👨‍💻 Developer Endpoints

#### 1. Register Developer
```http
POST /api/developers/register
Content-Type: application/json

{
  "email": "developer@example.com",
  "name": "John Doe",
  "contactDetails": {
    "phone": "+1234567890",
    "company": "Tech Corp",
    "website": "https://example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Developer registered successfully",
  "data": {
    "developer": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "developer@example.com",
      "name": "John Doe",
      "contactDetails": {...},
      "createdAt": "2026-02-10T10:00:00.000Z"
    }
  }
}
```

#### 2. Get Developer Profile
```http
GET /api/developers/profile
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 3. Update Developer Profile
```http
PUT /api/developers/profile
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
Content-Type: application/json

{
  "name": "John Smith",
  "contactDetails": {
    "phone": "+1234567890"
  }
}
```

---

### 📱 App Endpoints

#### 1. Register App
```http
POST /api/apps/register
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
Content-Type: application/json

{
  "packageName": "com.example.myapp",
  "appName": "My Awesome App",
  "description": "A great mobile app",
  "metadata": {
    "version": "1.0.0",
    "platform": "android"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "App registered successfully",
  "data": {
    "app": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "packageName": "com.example.myapp",
      "appName": "My Awesome App",
      "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "r2FolderPath": "apps/com.example.myapp",
      "createdAt": "2026-02-10T10:00:00.000Z"
    }
  },
  "important": "Please save the API key securely. It will not be shown again."
}
```

#### 2. Get All Apps
```http
GET /api/apps?page=1&limit=10&search=myapp
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 3. Get App Details
```http
GET /api/apps/com.example.myapp
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 4. Update App
```http
PUT /api/apps/com.example.myapp
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
Content-Type: application/json

{
  "appName": "My Updated App",
  "isActive": true
}
```

#### 5. Regenerate API Key
```http
POST /api/apps/com.example.myapp/regenerate-key
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 6. Get App Statistics
```http
GET /api/apps/com.example.myapp/stats
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 7. Delete App
```http
DELETE /api/apps/com.example.myapp
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

---

### 🖼️ Screen Endpoints

#### 1. Upload Screen
```http
POST /api/screens/com.example.myapp/upload
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
Content-Type: application/json

{
  "screenName": "home_screen",
  "displayName": "Home Screen",
  "description": "Main home screen of the app",
  "version": "1.0.0",
  "jsonContent": "{\"type\":\"Column\",\"children\":[{\"type\":\"Text\",\"text\":\"Hello World\"}]}",
  "metadata": {
    "category": "main",
    "tags": ["home", "main"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Screen uploaded successfully",
  "data": {
    "screen": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "screenName": "home_screen",
      "displayName": "Home Screen",
      "jsonFilePath": "apps/com.example.myapp/home_screen.json",
      "version": "1.0.0",
      "fileSize": 1024,
      "createdAt": "2026-02-10T10:00:00.000Z"
    }
  }
}
```

#### 2. Get All Screens for an App
```http
GET /api/screens/com.example.myapp?page=1&limit=20&search=home&isActive=true
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 3. Get Screen Details
```http
GET /api/screens/com.example.myapp/home_screen/details?includeJson=true
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

#### 4. Update Screen
```http
PUT /api/screens/com.example.myapp/home_screen
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
Content-Type: application/json

{
  "displayName": "Updated Home Screen",
  "jsonContent": "{\"type\":\"Column\",\"children\":[{\"type\":\"Text\",\"text\":\"Updated!\"}]}",
  "version": "1.0.1"
}
```

#### 5. Delete Screen
```http
DELETE /api/screens/com.example.myapp/home_screen
x-developer-id: 64a1b2c3d4e5f6g7h8i9j0k1
```

---

### 📲 Mobile App API (Main Endpoint)

#### Get Screen JSON
This is the primary endpoint used by mobile applications to fetch UI definitions.

```http
GET /api/v1/screen?screen_name=home_screen
x-api-key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
x-package-name: com.example.myapp
```

**Alternative (Query Parameters):**
```http
GET /api/v1/screen?screen_name=home_screen&api_key=YOUR_API_KEY&package_name=com.example.myapp
```

**Response:**
```json
{
  "success": true,
  "data": {
    "screenName": "home_screen",
    "version": "1.0.0",
    "ui": {
      "type": "Column",
      "children": [
        {
          "type": "Text",
          "text": "Hello World"
        }
      ]
    }
  }
}
```

---

## 💡 Usage Examples

### Example 1: Complete Developer-to-Mobile Flow

1. **Register as a developer:**
```bash
curl -X POST http://localhost:3000/api/developers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "name": "John Doe"
  }'
```

2. **Register your app:**
```bash
curl -X POST http://localhost:3000/api/apps/register \
  -H "Content-Type: application/json" \
  -H "x-developer-id: YOUR_DEVELOPER_ID" \
  -d '{
    "packageName": "com.example.app",
    "appName": "My App"
  }'
```
*Save the returned API key!*

3. **Upload a screen:**
```bash
curl -X POST http://localhost:3000/api/screens/com.example.app/upload \
  -H "Content-Type: application/json" \
  -H "x-developer-id: YOUR_DEVELOPER_ID" \
  -d '{
    "screenName": "home",
    "jsonContent": "{\"type\":\"Text\",\"text\":\"Hello\"}"
  }'
```

4. **Fetch from mobile app:**
```bash
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=home" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-package-name: com.example.app"
```

---

## 🔒 Security Features

### 1. API Key Authentication
- Each app gets a unique API key
- Keys are hashed and stored securely
- Keys can be regenerated if compromised

### 2. JSON Content Scanning
Automatically scans uploaded JSON for:
- Script tags and JavaScript code
- Event handlers (onclick, onerror, etc.)
- eval() and execScript calls
- Path traversal attempts
- System file access patterns
- Excessive nesting (default max: 25 levels, configurable)
- Large payloads (default max: 10MB, configurable)

**Configuration:**
```env
MAX_JSON_DEPTH=25    # Maximum nesting depth
MAX_JSON_SIZE=10485760  # Maximum size in bytes (10MB)
```

### 3. Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable via environment variables

### 4. Input Validation
- All inputs validated using express-validator
- Type checking and sanitization
- SQL/NoSQL injection prevention

### 5. Access Control
- Developers can only access their own apps
- Package name verification for mobile apps
- Active status checks

---

## 🚀 Deployment

### Production Checklist

1. **Environment variables:**
   - Set `NODE_ENV=production`
   - Use strong secrets for `API_SECRET` and `JWT_SECRET`
   - Configure proper MongoDB URI
   - Set up Cloudflare R2 credentials

2. **Security:**
   - Enable HTTPS
   - Configure CORS properly
   - Set up firewall rules
   - Use environment-specific rate limits

3. **Performance:**
   - Enable MongoDB indexes (already configured)
   - Configure connection pooling
   - Set up caching if needed
   - Monitor R2 usage

4. **Monitoring:**
   - Set up logging (Winston, Loggly, etc.)
   - Monitor server health
   - Track API usage
   - Set up alerts

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t sdui-backend .
docker run -p 3000:3000 --env-file .env sdui-backend
```

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Test API Key Validation
```bash
# Should return 401
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=test"

# Should work
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=test" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-package-name: com.example.app"
```

---

## 📈 Monitoring & Logs

The server logs important events:
- MongoDB connection status
- API requests (via Morgan)
- File uploads to R2
- Security scan results
- Error traces

In production, consider integrating:
- **Winston** for structured logging
- **PM2** for process management
- **New Relic** or **DataDog** for monitoring

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📝 License

ISC License - See LICENSE file for details

---

## 💬 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact: Developer String

---

## 🎯 Roadmap

- [ ] Add JWT authentication for developers
- [ ] Implement versioning for screen JSON
- [ ] Add webhook notifications for screen updates
- [ ] Create admin dashboard
- [ ] Add analytics for screen usage
- [ ] Implement JSON diff for version comparison
- [ ] Add GraphQL support
- [ ] Create SDK for mobile apps

---

**Built with ❤️ by Developer String**
