import express from 'express';
import userController from '../controllers/user-controller.js';
import { authenticateToken } from '../util/auth.js';

const router = express.Router();

// Public routes (no authentication required)
// POST /users/signup - User registration
router.post('/signup', userController.signup);

// POST /users/login - User login
router.post('/login', userController.login);

// Protected routes (authentication required)
// GET /users - Get all users (for testing/admin purposes)
router.get('/', authenticateToken, userController.getAllUsers);

// GET /users/profile - Get current user profile
router.get('/profile', authenticateToken, userController.getCurrentUser);

// GET /users/test-token - Test if JWT token is working (debug endpoint)
router.get('/test-token', authenticateToken, userController.testToken);

export default router; 