const express = require('express');
const ppController = require('../controllers/productionPlan.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all production plan routes
router.use(authenticateToken);

// Define Production Plan routes
router.get('/pp', ppController.getProductionPlanIds); // Get all production plan IDs
router.put('/pp/assign/:ppId', ppController.assignToProductionPlan); // Assign an item (wsp/ins) to a production plan

module.exports = router; 