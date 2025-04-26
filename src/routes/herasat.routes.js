const express = require('express');
const herasatController = require('../controllers/herasat.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all herasat routes
router.use(authenticateToken);

// Define Herasat (Security) routes
router.get('/manf/name', herasatController.getManufacturerNames);
router.get('/gatheredexit', herasatController.getGatheredOrders);
router.get('/fporder/:orderId', herasatController.getSoldFinalProductsByOrder);
router.put('/ordersc/:orderId', herasatController.setOrderSecurityChecked);
router.get('/ordersc/:orderId', herasatController.isOrderSecurityChecked); // Check security status
router.post('/transports/new', herasatController.createTransport);

module.exports = router; 