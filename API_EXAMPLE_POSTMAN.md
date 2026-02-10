# Postman Collection for SDUI Backend API

This document provides a complete Postman collection for testing all endpoints in the Server-Driven UI Backend API system with the new API key authentication.

## 🚀 Quick Setup

### 1. Import Postman Collection

Copy the JSON below and import it into Postman (File → Import → Raw Text):

```json
{
  "info": {
    "name": "SDUI Backend API",
    "description": "Complete collection for Server-Driven UI Backend API with API key authentication",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api",
      "type": "string"
    },
    {
      "key": "developerApiKey",
      "value": "",
      "type": "string"
    },
    {
      "key": "appApiKey",
      "value": "",
      "type": "string" 
    },
    {
      "key": "packageName",
      "value": "com.example.myapp",
      "type": "string"
    },
    {
      "key": "screenName",
      "value": "home_screen",
      "type": "string"
    }
  ],
  "auth": {
    "type": "noauth"
  },
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [
          ""
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [
          ""
        ]
      }
    }
  ],
  "item": [
    {
      "name": "🏠 Root & Health",
      "item": [
        {
          "name": "Root Endpoint",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:3000/",
              "protocol": "http",
              "host": [
                "localhost"
              ],
              "port": "3000",
              "path": [
                ""
              ]
            },
            "description": "Get API information and available endpoints"
          }
        },
        {
          "name": "API Info", 
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                ""
              ]
            },
            "description": "Get detailed API endpoints information"
          }
        },
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/health",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "health"
              ]
            },
            "description": "Check API health and uptime"
          }
        }
      ]
    },
    {
      "name": "👨‍💻 Developer Management",
      "item": [
        {
          "name": "Register Developer",
          "event": [
            {
              "listen": "test",
              "script": {
                "type": "text/javascript",
                "exec": [
                  "if (pm.response.code === 201) {",
                  "  const response = pm.response.json();",
                  "  if (response.data && response.data.apiKey) {",
                  "    pm.collectionVariables.set('developerApiKey', response.data.apiKey);",
                  "    console.log('Developer API Key saved:', response.data.apiKey);",
                  "  }",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"developer@example.com\",\n  \"name\": \"John Developer\",\n  \"contactDetails\": {\n    \"phone\": \"+1234567890\",\n    \"website\": \"https://johndeveloper.com\",\n    \"company\": \"Tech Solutions Inc\"\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/developers/register",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "developers",
                "register"
              ]
            },
            "description": "Register a new developer account. Returns developer API key for authentication."
          }
        },
        {
          "name": "Get Developer Profile",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/developers/profile",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "developers",
                "profile"
              ]
            },
            "description": "Get authenticated developer's profile information"
          }
        },
        {
          "name": "Update Developer Profile",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Senior Developer\",\n  \"contactDetails\": {\n    \"phone\": \"+1234567891\",\n    \"website\": \"https://johnseniordeveloper.com\",\n    \"company\": \"Advanced Tech Solutions Inc\"\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/developers/profile",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "developers",
                "profile"
              ]
            },
            "description": "Update developer profile information"
          }
        },
        {
          "name": "Get All Developers (Admin)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/developers?page=1&limit=10&search=",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "developers"
              ],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                },
                {
                  "key": "search",
                  "value": ""
                }
              ]
            },
            "description": "Admin endpoint to get all developers with pagination and search"
          }
        },
        {
          "name": "Delete Developer (Admin)",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/developers/{developerId}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "developers",
                "{developerId}"
              ]
            },
            "description": "Admin endpoint to delete a developer (must have no apps)"
          }
        }
      ]
    },
    {
      "name": "📱 App Management",
      "item": [
        {
          "name": "Register App",
          "event": [
            {
              "listen": "test",
              "script": {
                "type": "text/javascript",
                "exec": [
                  "if (pm.response.code === 201) {",
                  "  const response = pm.response.json();",
                  "  if (response.data && response.data.app && response.data.app.apiKey) {",
                  "    pm.collectionVariables.set('appApiKey', response.data.app.apiKey);",
                  "    console.log('App API Key saved:', response.data.app.apiKey);",
                  "  }",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"packageName\": \"{{packageName}}\",\n  \"displayName\": \"My Awesome App\",\n  \"description\": \"A sample mobile application for SDUI testing\",\n  \"version\": \"1.0.0\",\n  \"platform\": \"both\",\n  \"category\": \"productivity\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/apps/register",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps",
                "register"
              ]
            },
            "description": "Register a new mobile application. Returns app-specific API key."
          }
        },
        {
          "name": "Get Developer Apps",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/apps?page=1&limit=10",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps"
              ],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            },
            "description": "Get all apps for the authenticated developer"
          }
        },
        {
          "name": "Get App Details",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/apps/{{packageName}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps",
                "{{packageName}}"
              ]
            },
            "description": "Get detailed information about a specific app"
          }
        },
        {
          "name": "Update App",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"displayName\": \"My Super Awesome App\",\n  \"description\": \"An updated description for my amazing SDUI app\",\n  \"version\": \"1.1.0\",\n  \"category\": \"entertainment\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/apps/{{packageName}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps",
                "{{packageName}}"
              ]
            },
            "description": "Update app information"
          }
        },
        {
          "name": "Regenerate App API Key",
          "event": [
            {
              "listen": "test",
              "script": {
                "type": "text/javascript",
                "exec": [
                  "if (pm.response.code === 200) {",
                  "  const response = pm.response.json();",
                  "  if (response.data && response.data.apiKey) {",
                  "    pm.collectionVariables.set('appApiKey', response.data.apiKey);",
                  "    console.log('New App API Key saved:', response.data.apiKey);",
                  "  }",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/apps/{{packageName}}/regenerate-key",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps",
                "{{packageName}}",
                "regenerate-key"
              ]
            },
            "description": "Generate a new API key for the app (previous key will be invalidated)"
          }
        },
        {
          "name": "Get App Statistics",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/apps/{{packageName}}/stats",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps",
                "{{packageName}}",
                "stats"
              ]
            },
            "description": "Get usage statistics for the app"
          }
        },
        {
          "name": "Delete App",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/apps/{{packageName}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "apps",
                "{{packageName}}"
              ]
            },
            "description": "Delete an app and all its screens"
          }
        }
      ]
    },
    {
      "name": "📟 Screen Management",
      "item": [
        {
          "name": "Upload Screen",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"screenName\": \"{{screenName}}\",\n  \"metadata\": {\n    \"title\": \"Home Screen\",\n    \"description\": \"Main landing screen for the app\",\n    \"version\": \"1.0.0\",\n    \"tags\": [\"home\", \"main\", \"landing\"]\n  },\n  \"jsonContent\": {\n    \"screenType\": \"home\",\n    \"layout\": {\n      \"type\": \"vertical\",\n      \"backgroundColor\": \"#ffffff\",\n      \"padding\": 16\n    },\n    \"components\": [\n      {\n        \"id\": \"header\",\n        \"type\": \"text\",\n        \"text\": \"Welcome to My App\",\n        \"style\": {\n          \"fontSize\": 24,\n          \"fontWeight\": \"bold\",\n          \"color\": \"#333333\",\n          \"textAlign\": \"center\",\n          \"marginBottom\": 20\n        }\n      },\n      {\n        \"id\": \"subtitle\",\n        \"type\": \"text\",\n        \"text\": \"Discover amazing features\",\n        \"style\": {\n          \"fontSize\": 16,\n          \"color\": \"#666666\",\n          \"textAlign\": \"center\",\n          \"marginBottom\": 32\n        }\n      },\n      {\n        \"id\": \"cta_button\",\n        \"type\": \"button\",\n        \"text\": \"Get Started\",\n        \"action\": {\n          \"type\": \"navigate\",\n          \"destination\": \"onboarding_screen\"\n        },\n        \"style\": {\n          \"backgroundColor\": \"#007AFF\",\n          \"color\": \"#ffffff\",\n          \"padding\": 16,\n          \"borderRadius\": 8,\n          \"textAlign\": \"center\",\n          \"fontWeight\": \"bold\"\n        }\n      }\n    ]\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/upload",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "screens",
                "{{packageName}}",
                "upload"
              ]
            },
            "description": "Upload a new screen UI definition with JSON content"
          }
        },
        {
          "name": "Get App Screens",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}?page=1&limit=10",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "screens",
                "{{packageName}}"
              ],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            },
            "description": "Get all screens for a specific app"
          }
        },
        {
          "name": "Get Screen Details",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/{{screenName}}/details",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "screens",
                "{{packageName}}",
                "{{screenName}}",
                "details"
              ]
            },
            "description": "Get detailed information about a specific screen (for developers)"
          }
        },
        {
          "name": "Update Screen",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"metadata\": {\n    \"title\": \"Updated Home Screen\",\n    \"description\": \"Updated main landing screen with new features\",\n    \"version\": \"1.1.0\",\n    \"tags\": [\"home\", \"main\", \"landing\", \"updated\"]\n  },\n  \"jsonContent\": {\n    \"screenType\": \"home\",\n    \"layout\": {\n      \"type\": \"vertical\",\n      \"backgroundColor\": \"#f8f9fa\",\n      \"padding\": 16\n    },\n    \"components\": [\n      {\n        \"id\": \"header\",\n        \"type\": \"text\",\n        \"text\": \"Welcome to My Updated App\",\n        \"style\": {\n          \"fontSize\": 28,\n          \"fontWeight\": \"bold\",\n          \"color\": \"#333333\",\n          \"textAlign\": \"center\",\n          \"marginBottom\": 20\n        }\n      },\n      {\n        \"id\": \"subtitle\",\n        \"type\": \"text\",\n        \"text\": \"Now with even more amazing features\",\n        \"style\": {\n          \"fontSize\": 16,\n          \"color\": \"#666666\",\n          \"textAlign\": \"center\",\n          \"marginBottom\": 32\n        }\n      },\n      {\n        \"id\": \"cta_button\",\n        \"type\": \"button\",\n        \"text\": \"Explore Features\",\n        \"action\": {\n          \"type\": \"navigate\",\n          \"destination\": \"features_screen\"\n        },\n        \"style\": {\n          \"backgroundColor\": \"#28a745\",\n          \"color\": \"#ffffff\",\n          \"padding\": 16,\n          \"borderRadius\": 8,\n          \"textAlign\": \"center\",\n          \"fontWeight\": \"bold\"\n        }\n      }\n    ]\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/{{screenName}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "screens",
                "{{packageName}}",
                "{{screenName}}"
              ]
            },
            "description": "Update an existing screen's content and metadata"
          }
        },
        {
          "name": "Delete Screen",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/{{screenName}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "screens",
                "{{packageName}}",
                "{{screenName}}"
              ]
            },
            "description": "Delete a screen and its JSON file from storage"
          }
        },
        {
          "name": "List Screen Versions",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/{{screenName}}/versions",
              "host": ["{{baseUrl}}"],
              "path": ["screens", "{{packageName}}", "{{screenName}}", "versions"]
            },
            "description": "List all versions of a screen (current + version history)"
          }
        },
        {
          "name": "Get Specific Version JSON",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/{{screenName}}/versions/1.0.0",
              "host": ["{{baseUrl}}"],
              "path": ["screens", "{{packageName}}", "{{screenName}}", "versions", "1.0.0"]
            },
            "description": "Fetch the JSON content for a specific version of a screen"
          }
        },
        {
          "name": "Rollback to Previous Version",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/{{screenName}}/rollback/1.0.0",
              "host": ["{{baseUrl}}"],
              "path": ["screens", "{{packageName}}", "{{screenName}}", "rollback", "1.0.0"]
            },
            "description": "Rollback to a previous screen version. Creates a new patch version with the old content."
          }
        },
        {
          "name": "Upload New Version (Version Bump)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "x-developer-api-key",
                "value": "{{developerApiKey}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"screenName\": \"{{screenName}}\",\n  \"version\": \"2.0.0\",\n  \"jsonContent\": \"{\\\"screenType\\\":\\\"home\\\",\\\"layout\\\":{\\\"type\\\":\\\"vertical\\\"},\\\"components\\\":[{\\\"id\\\":\\\"header\\\",\\\"type\\\":\\\"text\\\",\\\"text\\\":\\\"Updated V2\\\"}]}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/screens/{{packageName}}/upload",
              "host": ["{{baseUrl}}"],
              "path": ["screens", "{{packageName}}", "upload"]
            },
            "description": "Upload a new version of an existing screen. Version must be higher than current. Previous version is automatically archived."
          }
        }
      ]
    },
    {
      "name": "📲 Mobile API (Public)",
      "item": [
        {
          "name": "Get Screen JSON (Headers Auth)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-api-key",
                "value": "{{appApiKey}}",
                "type": "text"
              },
              {
                "key": "x-package-name",
                "value": "{{packageName}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/v1/screen?screen_name={{screenName}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "v1",
                "screen"
              ],
              "query": [
                {
                  "key": "screen_name",
                  "value": "{{screenName}}"
                }
              ]
            },
            "description": "Get screen JSON using headers for authentication (recommended)"
          }
        },
        {
          "name": "Get Screen JSON (Query Auth)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/v1/screen?package_name={{packageName}}&screen_name={{screenName}}&api_key={{appApiKey}}",
              "host": [
                "{{baseUrl}}"
              ],
              "path": [
                "v1",
                "screen"
              ],
              "query": [
                {
                  "key": "package_name",
                  "value": "{{packageName}}"
                },
                {
                  "key": "screen_name",
                  "value": "{{screenName}}"
                },
                {
                  "key": "api_key",
                  "value": "{{appApiKey}}"
                }
              ]
            },
            "description": "Get screen JSON using query parameters for authentication (alternative method)"
          }
        }
      ]
    }
  ]
}
```

## 🔧 Environment Setup

### 2. Configure Environment Variables

In Postman, set up the following collection variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `baseUrl` | API base URL | `http://localhost:3000/api` |
| `developerApiKey` | Developer API key (auto-filled after registration) | `abc123def456...` |
| `appApiKey` | App API key (auto-filled after app registration) | `xyz789uvw012...` |
| `packageName` | Your app's package name | `com.example.myapp` |
| `screenName` | Screen identifier | `home_screen` |

### 3. Update Server URL

If your server is running on a different port or host, update the `baseUrl` variable in the collection.

## 📋 Testing Workflow

### Step 1: Developer Registration & Authentication

1. **Register Developer** - Run the "Register Developer" request
   - ✅ The developer API key will automatically be saved to `{{developerApiKey}}`
   - ✅ Use this key for all developer-related endpoints

2. **Test Developer Authentication** - Run "Get Developer Profile"
   - ✅ Should return your developer information
   - ❌ If it fails, check your API key is correctly set

### Step 2: App Management

3. **Register App** - Run "Register App" 
   - ✅ The app API key will automatically be saved to `{{appApiKey}}`
   - ✅ Update `{{packageName}}` if you used a different package name

4. **Verify App** - Run "Get App Details"
   - ✅ Should return your app information

### Step 3: Screen Management

5. **Upload Screen** - Run "Upload Screen"
   - ✅ Creates a screen with sample UI JSON
   - ✅ Update `{{screenName}}` if you used a different screen name

6. **Verify Screen** - Run "Get Screen Details"
   - ✅ Should return screen metadata and JSON content

### Step 4: Mobile API Testing

7. **Test Mobile API** - Run either mobile API endpoint
   - ✅ Should return the screen JSON for your mobile app
   - ✅ This simulates how your mobile app would fetch UI definitions

### Step 5: Additional Operations

8. **Test Updates** - Try updating app details, screen content
9. **Test Statistics** - Check app usage statistics
10. **Test Deletion** - Delete screens/apps when needed

## 🔐 Authentication Details

### Developer Authentication
- **Header**: `x-developer-api-key`
- **Value**: Your developer API key (received during registration)
- **Usage**: All developer and app management endpoints

### Mobile App Authentication
- **Headers**: 
  - `x-api-key`: Your app's API key
  - `x-package-name`: Your app's package name
- **Alternative Query Parameters**:
  - `api_key`: Your app's API key
  - `package_name`: Your app's package name
- **Usage**: Mobile endpoints for fetching screen JSON

## 📱 Sample Screen JSON Structure

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
      "text": "Welcome to My App",
      "style": {
        "fontSize": 24,
        "fontWeight": "bold",
        "color": "#333333",
        "textAlign": "center"
      }
    },
    {
      "id": "cta_button",
      "type": "button",
      "text": "Get Started",
      "action": {
        "type": "navigate",
        "destination": "onboarding_screen"
      },
      "style": {
        "backgroundColor": "#007AFF",
        "color": "#ffffff",
        "padding": 16,
        "borderRadius": 8
      }
    }
  ]
}
```

## 🧪 Testing Scenarios

### Positive Test Cases
- ✅ Developer registration and authentication
- ✅ App registration and API key generation
- ✅ Screen upload with valid JSON
- ✅ Mobile API access with correct credentials
- ✅ Update operations with valid data
- ✅ Statistics and listing endpoints
- ✅ Version bump upload (higher version)
- ✅ List all screen versions
- ✅ Fetch specific version JSON
- ✅ Rollback to previous version

### Error Test Cases
- ❌ Invalid API key authentication
- ❌ Malicious JSON content (should be rejected)
- ❌ Duplicate app/screen names
- ❌ Access to non-existent resources
- ❌ Unauthorized access attempts
- ❌ Upload lower version than current (should be rejected)
- ❌ Rollback to non-existent version
- ❌ Rollback to current version (already active)

### Rate Limiting Tests
- 🚦 Send more than 100 requests in 15 minutes
- 🚦 Verify rate limiting responses (429 status)

## 📊 Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "details": {
    // Additional error details (optional)
  }
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "Specific field error message"
  }
}
```

## 🔄 Auto-Scripts

The Postman collection includes automatic scripts that:

1. **Save API Keys**: Automatically extracts and saves API keys from registration responses
2. **Update Variables**: Updates collection variables with received values
3. **Console Logging**: Shows important information in Postman console

## 🎯 Pro Tips

1. **Use Environment Variables**: Set up different environments (development, staging, production)
2. **Monitor Console**: Check Postman console for auto-saved API keys and debug info
3. **Test Error Scenarios**: Try invalid data to verify error handling
4. **Check Rate Limiting**: Test with high request volumes
5. **Validate JSON**: Ensure your screen JSON follows the expected structure
6. **Security Testing**: Verify that invalid API keys are properly rejected

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Check if API key is correctly set in headers |
| `404 Not Found` | Verify endpoint URLs and resource existence |
| `400 Bad Request` | Check request body format and required fields |
| `429 Too Many Requests` | Wait for rate limit to reset (15 minutes) |
| `500 Internal Server Error` | Check server logs for detailed error information |

## 📚 Additional Resources

- [README.md](README.md) - Complete API documentation
- [API_EXAMPLES.md](API_EXAMPLES.md) - Detailed usage examples
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Quick setup guide

---

🚀 **Ready to test!** Import this collection into Postman and start exploring the SDUI Backend API with proper API key authentication.