const express = require('express');
const reportController = require('../controllers/report.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all report routes
router.use(authenticateToken);

// Define Report routes

// Handheld Report
router.get('/report/query', reportController.queryHandheldReport);

// Admin Reports - Generic
router.get('/adminreport', reportController.getAdminReportByWorkplace);
router.get('/adminreport/default', reportController.getAdminReportItemsDefault); // Items default (last 7 days)

// Admin Reports - Production Plan
router.get('/adminreport/pp', reportController.getAdminReportProductionPlansByDate); // PP by date range
router.get('/adminreport/pp/default', reportController.getAdminReportProductionPlansDefault); // PP default (days before)

// Admin Reports - Counters
router.get('/adminreport/order/submitted/counter', reportController.getOrderSubmittedCount);
router.get('/adminreport/order/gathered/counter', reportController.getOrderGatheredCount);
router.get('/adminreport/order/exited/counter', reportController.getOrderExitedCountLastWeek);
router.get('/adminreport/cart/length', reportController.getCartLengthSumLastWeek);
router.get('/adminreport/warehouse/stock', reportController.getWarehouseStock);
router.get('/adminreport/noQC', reportController.getNoQCCounts);

// Admin Reports - Specific Lists / Charts
router.get('/adminreport/order/lastOfUs', reportController.getLast5Orders);
router.get('/adminreport/order/lastOfUs2', reportController.getLast5ExitedOrders);
router.get('/adminreport/highDemandChart', reportController.getHighDemandChartData);


module.exports = router; 