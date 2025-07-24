import userModel from '../models/user-model.js';
import { generateJWT } from '../util/auth.js';

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const userController = {
  // User signup
  async signup(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if user already exists
      const existingUser = userModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const newUser = await userModel.createUser({ email, password, name });
      
      // Generate JWT token
      const token = generateJWT(newUser);
      
      // Return user without password
      const { password: _, ...userResponse } = newUser;
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userResponse,
        token: token
      });

    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific database errors
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // User login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Validate credentials
      const user = await userModel.validateCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = generateJWT(user);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: user,
        token: token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all users (for admin/testing purposes)
  async getAllUsers(req, res) {
    try {
      const users = userModel.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json({
        success: true,
        users: usersWithoutPasswords
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get current user profile (protected route)
  async getCurrentUser(req, res) {
    try {
      // req.user comes from the authenticateToken middleware
      const userId = req.user.id;
      const user = userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Test token validity (debug endpoint)
  async testToken(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Token is valid!',
        tokenData: {
          userId: req.user.id,
          email: req.user.email,
          iat: new Date(req.user.iat * 1000).toISOString(),
          exp: new Date(req.user.exp * 1000).toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error testing token'
      });
    }
  }
};

export default userController; 