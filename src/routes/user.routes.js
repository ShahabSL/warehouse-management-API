const express = require('express');
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to the user route
router.use(authenticateToken);

// Define User routes
router.get('/users', userController.getUserList); // Get list of users

module.exports = router; 