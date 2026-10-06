const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authorization = req.get('Authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'JWT authentication is not configured',
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = decoded.userId;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

module.exports = authMiddleware;
