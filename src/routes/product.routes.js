const express = require('express');
const productController = require('../controllers/product.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all product/item routes
router.use(authenticateToken);

// Define product/item routes
router.get('/prod/name', productController.getProductNames);
router.get('/prod/highdemand', productController.getHighDemandProducts);
router.get('/uidDetails/:uid', productController.getUidDetails);

module.exports = router; 