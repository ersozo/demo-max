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
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}
