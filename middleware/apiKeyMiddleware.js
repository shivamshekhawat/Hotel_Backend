/**
 * API Key Authentication Middleware
 * Validates API key from request headers
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: "API key required",
      message: "Please provide API key in 'x-api-key' or 'api-key' header"
    });
  }

  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    console.error("API_KEY not configured in environment variables");
    return res.status(500).json({ 
      error: "Server configuration error",
      message: "API key validation not configured"
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(403).json({ 
      error: "Invalid API key",
      message: "The provided API key is not valid"
    });
  }

  // API key is valid, proceed to next middleware
  next();
}

module.exports = { verifyApiKey };
