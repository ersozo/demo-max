import express from 'express';
import userController from '../controllers/user-controller.js';

const router = express.Router();

// POST /users/signup - User registration
router.post('/signup', userController.signup);

// POST /users/login - User login
router.post('/login', userController.login);

// GET /users - Get all users (for testing/admin purposes)
router.get('/', userController.getAllUsers);

export default router; 