/**
 * API utilities and helpers
 */

/**
 * Helper function to handle errors for frontend vs API calls
 */
function handleError(req, res, error, code = '500', title = 'SERVER ERROR') {
  console.error('API Error:', error);
  
  // Check if request comes from browser (frontend) or API client
  const userAgent = req.get('User-Agent') || '';
  const isFromBrowser = (
    userAgent.includes('Mozilla') || 
    userAgent.includes('Chrome') || 
    userAgent.includes('Safari') || 
    userAgent.includes('Firefox')
  );
  
  if (isFromBrowser) {
    // Render error page for browser requests
    return res.status(parseInt(code)).render('error', {
      error: {
        'error-code': code,
        'error-title': title,
        'error-message': error.message || 'An unexpected error occurred. Please try again later.'
      },
      validBackPage: req.session?.validBackPage || '/'
    });
  } else {
    // Return JSON for API clients
    return res.status(parseInt(code)).json({ 
      error: error.message || 'Internal server error',
      code: code
    });
  }
}

/**
 * API Security Configuration
 */
function createAPIKeyMiddleware() {
  const API_SECRET = process.env.API_SECRET || 'your-secret-api-key-here';

  return (req, res, next) => {
    const providedKey = req.headers['x-api-key'] || req.query.apikey;
    
    if (!providedKey || providedKey !== API_SECRET) {
      // Redirect to error page instead of JSON response
      return res.status(401).render('error', {
        error: {
          'error-code': '401',
          'error-title': 'API ACCESS DENIED',
          'error-message': 'Valid API key required to access this endpoint. Unauthorized API access is not permitted.'
        },
        validBackPage: '/'
      });
    }
    
    next();
  };
}

/**
 * Parse time range parameters
 */
function parseTimeRangeParams(timeRange) {
  let hoursBack, maxPoints;

  switch (timeRange) {
    case '1h':
      hoursBack = 1;
      maxPoints = 60;
      break;
    case '6h':
      hoursBack = 6;
      maxPoints = 72;
      break;
    case '12h':
      hoursBack = 12;
      maxPoints = 72;
      break;
    case '24h':
    default:
      hoursBack = 24;
      maxPoints = 96;
      break;
  }

  return { hoursBack, maxPoints };
}

/**
 * Create standard API response
 */
function createAPIResponse(success, data = null, error = null) {
  const response = { success };
  
  if (success && data) {
    Object.assign(response, data);
  }
  
  if (!success && error) {
    response.error = error;
  }
  
  return response;
}

module.exports = {
  handleError,
  createAPIKeyMiddleware,
  parseTimeRangeParams,
  createAPIResponse
};
