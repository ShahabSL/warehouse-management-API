const express = require('express');
const requestController = require('../controllers/request.controller');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all request routes
router.use(authenticateToken);

// --- Handheld/General Request Routes ---
router.get('/request', requestController.getPendingRequests); // Get pending requests for receiver (userId in query)
router.put('/request/:reqId', requestController.updateRequestStatus); // Update request status (approved/rejected)
router.post('/request/new', requestController.createRequest); // Create a new request

// --- Security Request Route ---
router.get('/secrequest', requestController.getSentPendingRequests); // Get pending requests sent by user (userId in query)

// --- Admin Request Routes ---
router.get('/adminrequest/sent', requestController.adminGetSentRequests); // Admin: Get all requests sent by user
router.get('/adminrequest/received', requestController.adminGetReceivedPendingRequests); // Admin: Get pending requests received by user
router.delete('/adminrequest/sent/delete/:reqId', requestController.adminDeleteSentRequest); // Admin: Delete a sent request
router.put('/adminrequest/received/approve/:reqId', requestController.adminApproveReceivedRequest); // Admin: Approve request
router.put('/adminrequest/received/deny/:reqId', requestController.adminDenyReceivedRequest); // Admin: Deny request

module.exports = router; 