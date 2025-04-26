const express = require('express');
const handheldController = require('../controllers/handheld.controller');
const authenticateToken = require('../middleware/auth'); // Import auth middleware

const router = express.Router();

// Apply authentication middleware to all handheld routes
router.use(authenticateToken);

// Define handheld routes
router.put('/entry/:uid', handheldController.handleEntry);
router.put('/exit/:uid', handheldController.handleExit);
router.put('/placement/:uid', handheldController.handlePlacement);

module.exports = router; 