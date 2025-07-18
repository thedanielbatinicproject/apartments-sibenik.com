// API Authentication Middleware
const authenticateAPI = (req, res, next) => {
  // Skip autentifikaciju za određene rute koje ne trebaju secret key
  const publicRoutes = [
    '/api/calendar/',
    '/api/reviews/',
    '/api/submit-reservation',
    '/api/check-availability'
  ];

  // Provjeri da li je ruta javna
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublicRoute) {
    return next();
  }

  // Za privatne API rute, provjeri secret key
  const providedKey = req.body.secret_key || req.query.secret_key || req.headers['x-api-key'];
  const validKey = process.env.SECRET_API_KEY;

  if (!providedKey || providedKey !== validKey) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid API key required' 
    });
  }

  next();
};

module.exports = { authenticateAPI };
