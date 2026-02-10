/**
 * Security middleware for JSON content scanning
 */

/**
 * Basic JSON malware/malicious code scanner
 * Checks for potentially dangerous patterns in JSON content
 */
const scanJsonContent = (req, res, next) => {
  try {
    const { jsonContent } = req.body;

    if (!jsonContent) {
      return next();
    }

    // Parse JSON if it's a string
    let jsonData;
    try {
      jsonData = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format'
      });
    }

    // Convert to string for pattern matching
    const jsonString = JSON.stringify(jsonData).toLowerCase();

    // Dangerous patterns to check
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,  // Script tags
      /javascript:/gi,                  // Javascript protocol
      /on\w+\s*=/gi,                   // Event handlers (onclick, onerror, etc.)
      /eval\s*\(/gi,                   // eval function
      /execscript/gi,                  // execScript
      /expression\s*\(/gi,             // CSS expressions
      /vbscript:/gi,                   // VBScript protocol
      /data:text\/html/gi,             // Data URI with HTML
      /<iframe/gi,                     // iframes
      /<object/gi,                     // object tags
      /<embed/gi,                      // embed tags
      /import\s+.*from/gi,             // ES6 imports (suspicious in JSON)
      /require\s*\(/gi,                // require statements
      /\.\.\/\.\.\//g,                 // Path traversal
      /etc\/passwd/gi,                 // System file access
      /cmd\.exe/gi,                    // Command execution
      /\/bin\/bash/gi,                 // Shell access
      /base64.*decode/gi,              // Base64 decode (potentially hiding malicious code)
    ];

    // Check for suspicious patterns
    const foundPatterns = [];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(jsonString)) {
        foundPatterns.push(pattern.toString());
      }
    }

    if (foundPatterns.length > 0) {
      console.warn('Suspicious patterns detected:', foundPatterns);
      return res.status(400).json({
        success: false,
        error: 'JSON content contains potentially malicious patterns',
        details: 'Content failed security validation'
      });
    }

    // Check JSON depth (prevent deeply nested structures that could cause DoS)
    const MAX_DEPTH = 10;
    const checkDepth = (obj, depth = 0) => {
      if (depth > MAX_DEPTH) {
        return false;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (!checkDepth(obj[key], depth + 1)) {
            return false;
          }
        }
      }
      return true;
    };

    if (!checkDepth(jsonData)) {
      return res.status(400).json({
        success: false,
        error: 'JSON content is too deeply nested (max depth: 10 levels)'
      });
    }

    // Check JSON size (prevent excessively large payloads)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const jsonSize = Buffer.byteLength(JSON.stringify(jsonData), 'utf8');
    if (jsonSize > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: `JSON content too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`
      });
    }

    // Attach validated JSON to request
    req.validatedJson = jsonData;
    req.jsonSize = jsonSize;

    next();
  } catch (error) {
    console.error('JSON scanning error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scan JSON content'
    });
  }
};

/**
 * Sanitize file names to prevent path traversal
 */
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // Replace special chars with underscore
    .replace(/_{2,}/g, '_')            // Replace multiple underscores with single
    .toLowerCase();
};

/**
 * Validate file path to prevent directory traversal
 */
const validateFilePath = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  
  // Check for path traversal attempts
  if (
    normalized.includes('../') ||
    normalized.includes('..\\') ||
    normalized.startsWith('/') ||
    normalized.includes('~/') ||
    /^[a-zA-Z]:/.test(normalized)  // Windows absolute paths
  ) {
    return false;
  }
  
  return true;
};

module.exports = {
  scanJsonContent,
  sanitizeFileName,
  validateFilePath
};
