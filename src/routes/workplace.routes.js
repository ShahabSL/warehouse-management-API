const express = require('express');
const workplaceController = require('../controllers/workplace.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all workplace routes
router.use(authenticateToken);

// Define workplace routes
router.get('/workplace', workplaceController.getAllWorkplaces); // Get all workplaces
router.get('/workplace/reverse/:wpName', workplaceController.getWorkplaceByName); // Get ID by name (NSFW label in original code)
router.get('/workplace/:wpId', workplaceController.getWorkplaceById); // Get details by ID

module.exports = router; 