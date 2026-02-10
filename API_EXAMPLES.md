# API Usage Examples

## Quick Start Guide

### Step 1: Register as a Developer

```bash
curl -X POST http://localhost:3000/api/developers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe",
    "contactDetails": {
      "phone": "+1234567890",
      "company": "Tech Innovations Inc",
      "website": "https://techinnovations.com"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Developer registered successfully",
  "data": {
    "developer": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "contactDetails": {
        "phone": "+1234567890",
        "company": "Tech Innovations Inc",
        "website": "https://techinnovations.com"
      },
      "createdAt": "2024-02-10T10:30:00.000Z"
    },
    "apiKey": "82453436ce9d32299e3df934a00daae455df7f94d08d417f4acd126954acead6"
  }
}
```

**Save the returned Developer API Key!**

### Step 2: Register Your Mobile App

```bash
curl -X POST http://localhost:3000/api/apps/register \
  -H "Content-Type: application/json" \
  -H "x-developer-api-key: 82453436ce9d32299e3df934a00daae455df7f94d08d417f4acd126954acead6" \
  -d '{
    "packageName": "com.developerstring.ketoy",
    "appName": "ketoy", 
    "description": "ketoy-testing",
    "metadata": {
      "version": "1.0.0",
      "platform": "android"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "App registered successfully",
  "data": {
    "app": {
      "id": "698af181e6adcd351e73843b",
      "packageName": "com.developerstring.ketoy",
      "appName": "ketoy",
      "description": "ketoy-testing",
      "apiKey": "fa044a28d695b2fa4339a5caf568caa21ffeac1b9b9736bbaddc922515141dc6",
      "r2FolderPath": "apps/com.developerstring.ketoy",
      "metadata": {
        "version": "1.0.0",
        "platform": "android"
      },
      "createdAt": "2026-02-10T08:51:13.440Z"
    }
  },
  "important": "Please save the API key securely. It will not be shown again."
}
```

**Save the returned API Key! This is your app's authentication credential.**

### Step 3: Upload Screen UI Definition

**Note:** The package name in the URL path (`com.developerstring.ketoy`) determines which app this screen belongs to.

**Important:** The `jsonContent` field must be a JSON string, not a JSON object.

```bash
curl -X POST http://localhost:3000/api/screens/com.developerstring.ketoy/upload \
  -H "Content-Type: application/json" \
  -H "x-developer-api-key: 82453436ce9d32299e3df934a00daae455df7f94d08d417f4acd126954acead6" \
  -d '{
    "screenName": "home_screen",
    "displayName": "Home Screen",
    "description": "Main landing page of the ketoy app",
    "version": "1.0.0",
    "jsonContent": "{\"screenType\":\"home\",\"layout\":{\"type\":\"vertical\",\"backgroundColor\":\"#ffffff\",\"padding\":16},\"components\":[{\"id\":\"header\",\"type\":\"text\",\"text\":\"Welcome to Ketoy App\",\"style\":{\"fontSize\":24,\"fontWeight\":\"bold\",\"color\":\"#333333\",\"textAlign\":\"center\",\"marginBottom\":20}},{\"id\":\"subtitle\",\"type\":\"text\",\"text\":\"Server-Driven UI Demo\",\"style\":{\"fontSize\":16,\"color\":\"#666666\",\"textAlign\":\"center\",\"marginBottom\":32}},{\"id\":\"cta_button\",\"type\":\"button\",\"text\":\"Get Started\",\"action\":{\"type\":\"navigate\",\"destination\":\"features_screen\"},\"style\":{\"backgroundColor\":\"#007AFF\",\"color\":\"#ffffff\",\"padding\":16,\"borderRadius\":8,\"textAlign\":\"center\",\"fontWeight\":\"bold\"}}]}",
    "metadata": {
      "category": "main",
      "tags": ["home", "landing", "main"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Screen uploaded successfully",
  "data": {
    "screen": {
      "id": "698af1234567890abcdef123",
      "screenName": "home_screen",
      "displayName": "Home Screen",
      "jsonFilePath": "apps/com.developerstring.ketoy/home_screen.json",
      "version": "1.0.0",
      "fileSize": 1024,
      "createdAt": "2026-02-10T09:00:00.000Z"
    }
  }
}
```

**Note on `jsonContent` format:**
The `jsonContent` field must be a **JSON string**, not a JSON object. When decoded, it should represent your UI structure:

```json
{
  "screenType": "home",
  "layout": {
    "type": "vertical",
    "backgroundColor": "#ffffff",
    "padding": 16
  },
  "components": [
    {
      "id": "header",
      "type": "text",
      "text": "Welcome to Ketoy App",
      "style": {
        "fontSize": 24,
        "fontWeight": "bold"
      }
    }
  ]
}
```

### Step 4: Fetch Screen from Mobile App

**Get Full Screen JSON:**
```bash
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=home_screen" \
  -H "x-api-key: fa044a28d695b2fa4339a5caf568caa21ffeac1b9b9736bbaddc922515141dc6" \
  -H "x-package-name: com.developerstring.ketoy"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "screenName": "home_screen",
    "version": "1.0.0",
    "ui": {
      "screenType": "home",
      "layout": {...},
      "components": [...]
    }
  }
}
```

**Get Screen Version Only (to check for updates):**
```bash
curl -X GET "http://localhost:3000/api/v1/screen/version?screen_name=home_screen" \
  -H "x-api-key: fa044a28d695b2fa4339a5caf568caa21ffeac1b9b9736bbaddc922515141dc6" \
  -H "x-package-name: com.developerstring.ketoy"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "screenName": "home_screen",
    "version": "1.0.0",
    "updatedAt": "2026-02-10T08:55:00.000Z"
  }
}
```

**Use Case:** Mobile apps can call the version endpoint first to check if their cached screen needs updating, avoiding unnecessary downloads of full JSON when the version hasn't changed.

---

## 📦 Understanding Package Name Routing

The package name is a critical identifier that links screens to specific apps:

### How It Works:

1. **App Registration**: When you register an app, you provide a unique package name (e.g., `com.developerstring.ketoy`)
2. **Screen Upload**: The URL path includes the package name: `/api/screens/{packageName}/upload`
3. **Automatic Association**: Screens are automatically associated with the app matching that package name
4. **Storage Organization**: Files are stored in R2 at `apps/{packageName}/{screenName}.json`

### Example Flow:

```bash
# Step 1: Register App with package name "com.mycompany.app1"
POST /api/apps/register
{"packageName": "com.mycompany.app1", "appName": "My First App"}
→ Returns: App API Key 1

# Step 2: Upload screen to app1
POST /api/screens/com.mycompany.app1/upload  ← Package name in URL
{"screenName": "home", "jsonContent": {...}}
→ Screen saved to: apps/com.mycompany.app1/home.json

# Step 3: Register another app
POST /api/apps/register
{"packageName": "com.mycompany.app2", "appName": "My Second App"}
→ Returns: App API Key 2

# Step 4: Upload screen to app2
POST /api/screens/com.mycompany.app2/upload  ← Different package name
{"screenName": "home", "jsonContent": {...}}
→ Screen saved to: apps/com.mycompany.app2/home.json

# Result: Two separate apps, each with their own screens
```

### Key Points:

- ✅ **Package name in URL determines the app** - Always use the correct package name in the endpoint
- ✅ **Must own the app** - You can only upload screens to apps you've registered
- ✅ **Screens are isolated** - Each app has its own separate screens and storage
- ✅ **Different API keys** - Each app gets its own API key for mobile access

---

## Example JSON UI Definitions

### Simple Text Screen
```json
{
  "type": "Column",
  "padding": 16,
  "children": [
    {
      "type": "Text",
      "text": "Hello World",
      "fontSize": 24,
      "color": "#000000"
    }
  ]
}
```

### Login Screen
```json
{
  "type": "Column",
  "padding": 24,
  "mainAxisAlignment": "center",
  "children": [
    {
      "type": "Image",
      "url": "https://example.com/logo.png",
      "width": 120,
      "height": 120
    },
    {
      "type": "Spacer",
      "height": 32
    },
    {
      "type": "Text",
      "text": "Welcome Back!",
      "fontSize": 28,
      "fontWeight": "bold"
    },
    {
      "type": "Spacer",
      "height": 16
    },
    {
      "type": "TextField",
      "id": "email",
      "hint": "Email",
      "keyboardType": "email"
    },
    {
      "type": "Spacer",
      "height": 12
    },
    {
      "type": "TextField",
      "id": "password",
      "hint": "Password",
      "obscureText": true
    },
    {
      "type": "Spacer",
      "height": 24
    },
    {
      "type": "Button",
      "text": "Login",
      "action": "submit",
      "backgroundColor": "#007AFF",
      "textColor": "#FFFFFF"
    }
  ]
}
```

### Product List Screen
```json
{
  "type": "Column",
  "children": [
    {
      "type": "AppBar",
      "title": "Products",
      "backgroundColor": "#007AFF"
    },
    {
      "type": "ListView",
      "padding": 16,
      "items": [
        {
          "type": "Card",
          "children": [
            {
              "type": "Row",
              "children": [
                {
                  "type": "Image",
                  "url": "https://example.com/product1.jpg",
                  "width": 80,
                  "height": 80
                },
                {
                  "type": "Column",
                  "children": [
                    {
                      "type": "Text",
                      "text": "Product Name",
                      "fontSize": 18,
                      "fontWeight": "bold"
                    },
                    {
                      "type": "Text",
                      "text": "$29.99",
                      "fontSize": 16,
                      "color": "#007AFF"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Complete Workflow Example

### 1. Developer Management

**Register Developer:**
```bash
POST /api/developers/register
{
  "email": "dev@startup.com",
  "name": "Jane Developer"
}
```

**Get Profile:**
```bash
GET /api/developers/profile
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

**Update Profile:**
```bash
PUT /api/developers/profile
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
{
  "contactDetails": {
    "phone": "+1987654321"
  }
}
```

### 2. App Management

**Register App:**
```bash
POST /api/apps/register
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
{
  "packageName": "com.startup.app",
  "appName": "Startup App"
}
```

**Get All Apps:**
```bash
GET /api/apps?page=1&limit=10
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

**Get App Details:**
```bash
GET /api/apps/com.startup.app
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

**Get App Statistics:**
```bash
GET /api/apps/com.startup.app/stats
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

**Regenerate API Key:**
```bash
POST /api/apps/com.startup.app/regenerate-key
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

### 3. Screen Management

**Important:** 
- The package name in the URL path (e.g., `/api/screens/{packageName}/upload`) determines which app the screen belongs to
- You must own the app to upload screens
- `jsonContent` must be a JSON **string**, not an object

**Upload Multiple Screens to the same app:**

Home Screen for `com.startup.app`:
```bash
POST /api/screens/com.startup.app/upload
Headers: 
  x-developer-api-key: YOUR_DEVELOPER_API_KEY
  Content-Type: application/json
Body:
{
  "screenName": "home",
  "displayName": "Home",
  "description": "Main home screen",
  "version": "1.0.0",
  "jsonContent": "{\"screenType\":\"home\",\"components\":[{\"type\":\"text\",\"text\":\"Welcome Home\",\"style\":{\"fontSize\":24}}]}"
}
```

Profile Screen for `com.startup.app`:
```bash
POST /api/screens/com.startup.app/upload
Headers: 
  x-developer-api-key: YOUR_DEVELOPER_API_KEY
  Content-Type: application/json
Body:
{
  "screenName": "profile",
  "displayName": "User Profile",
  "description": "User profile screen",
  "version": "1.0.0",
  "jsonContent": "{\"screenType\":\"profile\",\"components\":[{\"type\":\"text\",\"text\":\"User Profile\",\"style\":{\"fontSize\":20}}]}"
}
```

Settings Screen for `com.startup.app`:
```bash
POST /api/screens/com.startup.app/upload
Headers: 
  x-developer-api-key: YOUR_DEVELOPER_API_KEY
  Content-Type: application/json
Body:
{
  "screenName": "settings",
  "displayName": "Settings",
  "description": "App settings screen",
  "version": "1.0.0",
  "jsonContent": "{\"screenType\":\"settings\",\"components\":[{\"type\":\"text\",\"text\":\"Settings\",\"style\":{\"fontSize\":20}}]}"
}
```

**Upload Screen to a different app:**

Home Screen for `com.developerstring.ketoy`:
```bash
POST /api/screens/com.developerstring.ketoy/upload
Headers: 
  x-developer-api-key: YOUR_DEVELOPER_API_KEY
  Content-Type: application/json
Body:
{
  "screenName": "home_screen",
  "displayName": "Ketoy Home",
  "description": "Ketoy app home screen",
  "version": "1.0.0",
  "jsonContent": "{\"screenType\":\"home\",\"components\":[{\"type\":\"text\",\"text\":\"Welcome to Ketoy\",\"style\":{\"fontSize\":24}}]}"
}
```

**Get All Screens for an app:**
```bash
GET /api/screens/com.startup.app
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

**Get Screen Details with JSON:**
```bash
GET /api/screens/com.startup.app/home/details?includeJson=true
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
```

**Update Screen:**
```bash
PUT /api/screens/com.startup.app/home
Headers: x-developer-api-key: YOUR_DEVELOPER_API_KEY
{
  "version": "1.1.0",
  "jsonContent": "..."
}
```

### 4. Mobile App Integration

**Fetch Home Screen (Full JSON):**
```bash
GET /api/v1/screen?screen_name=home
Headers:
  x-api-key: YOUR_APP_API_KEY
  x-package-name: com.startup.app
```

**Check Screen Version (for updates):**
```bash
GET /api/v1/screen/version?screen_name=home
Headers:
  x-api-key: YOUR_APP_API_KEY
  x-package-name: com.startup.app
```

**Fetch Profile Screen:**
```bash
GET /api/v1/screen?screen_name=profile
Headers:
  x-api-key: YOUR_APP_API_KEY
  x-package-name: com.startup.app
```

---

## Testing Error Scenarios

### 1. Invalid API Key
```bash
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=home" \
  -H "x-api-key: invalid_key" \
  -H "x-package-name: com.startup.app"
```
**Expected:** 401 Unauthorized

### 2. Missing Package Name
```bash
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=home" \
  -H "x-api-key: YOUR_API_KEY"
```
**Expected:** 401 Unauthorized

### 3. Non-existent Screen
```bash
curl -X GET "http://localhost:3000/api/v1/screen?screen_name=nonexistent" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-package-name: com.startup.app"
```
**Expected:** 404 Not Found

### 4. Malicious JSON Upload
```bash
curl -X POST http://localhost:3000/api/screens/com.startup.app/upload \
  -H "Content-Type: application/json" \
  -H "x-developer-api-key: YOUR_DEVELOPER_API_KEY" \
  -d '{
    "screenName": "malicious",
    "jsonContent": "{\"type\":\"Text\",\"text\":\"<script>alert(1)</script>\"}"
  }'
```
**Expected:** 400 Bad Request (Security scan failed)

---

## Mobile App Integration Examples

### Android (Kotlin)

```kotlin
// API Service
interface SDUIService {
    @GET("v1/screen")
    suspend fun getScreen(
        @Query("screen_name") screenName: String,
        @Header("x-api-key") apiKey: String,
        @Header("x-package-name") packageName: String
    ): Response<ScreenResponse>
    
    @GET("v1/screen/version")
    suspend fun getScreenVersion(
        @Query("screen_name") screenName: String,
        @Header("x-api-key") apiKey: String,
        @Header("x-package-name") packageName: String
    ): Response<VersionResponse>
}

// Usage with version check
class ScreenRepository(private val api: SDUIService) {
    suspend fun fetchScreen(screenName: String): ScreenResponse {
        return api.getScreen(
            screenName = screenName,
            apiKey = BuildConfig.API_KEY,
            packageName = BuildConfig.APPLICATION_ID
        )
    }
    
    suspend fun checkScreenVersion(screenName: String): VersionResponse {
        return api.getScreenVersion(
            screenName = screenName,
            apiKey = BuildConfig.API_KEY,
            packageName = BuildConfig.APPLICATION_ID
        )
    }
    
    // Smart fetch - only download if version changed
    suspend fun fetchScreenIfUpdated(screenName: String, cachedVersion: String?): ScreenResponse? {
        val versionInfo = checkScreenVersion(screenName)
        if (versionInfo.data.version != cachedVersion) {
            return fetchScreen(screenName)
        }
        return null // Use cached version
    }
}
```

### iOS (Swift)

```swift
// API Service
class SDUIService {
    func fetchScreen(screenName: String, completion: @escaping (Result<ScreenResponse, Error>) -> Void) {
        var request = URLRequest(url: URL(string: "https://api.example.com/api/v1/screen?screen_name=\(screenName)")!)
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(packageName, forHTTPHeaderField: "x-package-name")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
    
    func checkScreenVersion(screenName: String, completion: @escaping (Result<VersionResponse, Error>) -> Void) {
        var request = URLRequest(url: URL(string: "https://api.example.com/api/v1/screen/version?screen_name=\(screenName)")!)
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(packageName, forHTTPHeaderField: "x-package-name")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
    
    // Smart fetch - only download if version changed
    func fetchScreenIfUpdated(screenName: String, cachedVersion: String?, completion: @escaping (Result<ScreenResponse?, Error>) -> Void) {
        checkScreenVersion(screenName: screenName) { result in
            switch result {
            case .success(let versionInfo):
                if versionInfo.data.version != cachedVersion {
                    self.fetchScreen(screenName: screenName, completion: completion)
                } else {
                    completion(.success(nil)) // Use cached version
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}
```

---

## Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "SDUI Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "developerId",
      "value": "YOUR_DEVELOPER_ID"
    },
    {
      "key": "apiKey",
      "value": "YOUR_API_KEY"
    },
    {
      "key": "packageName",
      "value": "com.example.app"
    }
  ],
  "item": [
    {
      "name": "Developers",
      "item": [
        {
          "name": "Register Developer",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{baseUrl}}/developers/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"name\":\"Test Developer\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

**Happy Building! 🚀**
