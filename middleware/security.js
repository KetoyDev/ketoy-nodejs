/**
 * Security middleware for JSON content scanning
 */

// Configuration - can be overridden by environment variables
const MAX_JSON_DEPTH = parseInt(process.env.MAX_JSON_DEPTH) || 25; // Increased from 10 to 25
const MAX_JSON_SIZE = parseInt(process.env.MAX_JSON_SIZE) || 10 * 1024 * 1024; // Increased to 10MB

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
    // Using iterative approach for better performance with large objects
    const checkDepth = (obj) => {
      const stack = [{ obj, depth: 0 }];
      let maxDepth = 0;
      
      while (stack.length > 0) {
        const { obj: current, depth } = stack.pop();
        maxDepth = Math.max(maxDepth, depth);
        
        if (depth > MAX_JSON_DEPTH) {
          return { valid: false, depth: maxDepth };
        }
        
        if (typeof current === 'object' && current !== null) {
          if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
              stack.push({ obj: current[i], depth: depth + 1 });
            }
          } else {
            for (const key in current) {
              if (current.hasOwnProperty(key)) {
                stack.push({ obj: current[key], depth: depth + 1 });
              }
            }
          }
        }
      }
      
      return { valid: true, depth: maxDepth };
    };

    const depthCheck = checkDepth(jsonData);
    if (!depthCheck.valid) {
      return res.status(400).json({
        success: false,
        error: `JSON content is too deeply nested (max depth: ${MAX_JSON_DEPTH} levels, found: ${depthCheck.depth})`,
        hint: 'Consider flattening your component structure or breaking it into multiple screens'
      });
    }

    // Check JSON size (prevent excessively large payloads)
    const jsonSize = Buffer.byteLength(JSON.stringify(jsonData), 'utf8');
    if (jsonSize > MAX_JSON_SIZE) {
      return res.status(400).json({
        success: false,
        error: `JSON content too large (${(jsonSize / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${MAX_JSON_SIZE / (1024 * 1024)}MB`,
        hint: 'Consider splitting large screens into smaller, reusable components'
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
