import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Replace with your actual secret in production

/**
 * Generates a JWT for a user.
 * @param {Object} user - The user object.
 * @param {string|number} user.id - The user's unique identifier.
 * @param {string} user.email - The user's email address.
 * @param {Object} [options] - Optional jwt.sign options.
 * @returns {string} The signed JWT.
 */
export function generateJWT(user, options = {}) {
  const payload = {
    id: user.id,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', ...options });
}

/**
 * Verifies a JWT and returns the decoded payload if valid.
 * @param {string} token - The JWT to verify.
 * @returns {Object} The decoded payload.
 * @throws {Error} If the token is invalid or expired.
 */
export function verifyJWT(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Debug logging
  console.log('Auth Header:', authHeader);
  console.log('Extracted Token (before cleanup):', token ? `${token.substring(0, 20)}...` : 'No token');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  // Remove quotes if present (common mistake when copying from JSON)
  token = token.replace(/^["']|["']$/g, '');
  console.log('Cleaned Token:', token ? `${token.substring(0, 20)}...` : 'No token');

  try {
    const decoded = verifyJWT(token);
    console.log('Token decoded successfully for user ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
