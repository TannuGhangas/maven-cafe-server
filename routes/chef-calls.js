// routes/chef-calls.js - Chef call management routes

const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const logger = require('winston');

// In-memory storage for chef calls (could be moved to MongoDB if persistence needed)
let chefCalls = [];

// Socket.IO instance (will be set by server.js)
let io = null;
router.setIO = (socketIO) => { io = socketIO; };

// Notifications route reference (will be set by server.js)
let notificationsRoute = null;
router.setNotificationsRoute = (route) => { notificationsRoute = route; };

/**
 * POST /call-chef (User: Call Chef) - Fallback for non-socket clients
 */
router.post('/call-chef', authorize(['user', 'admin']), async (req, res) => {
    const { userId, userName, seatNumber, timestamp } = req.body;

    if (!userId || !userName || !seatNumber) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        const newCall = {
            id: Date.now().toString(),
            userId,
            userName,
            seatNumber,
            timestamp: timestamp || new Date().toISOString(),
            status: 'pending',
            chefResponse: null,
            responseTime: null
        };

        chefCalls.push(newCall);
        
        // Emit to kitchen via socket for instant notification
        if (io) {
            io.to('kitchen').emit('chef-call', newCall);
            logger.info(`Chef call emitted via socket to kitchen`);
        }
        
        // Send FCM push notification to kitchen staff (for when app is closed)
        if (notificationsRoute && notificationsRoute.getKitchenTokens) {
            const kitchenTokens = notificationsRoute.getKitchenTokens();
            if (kitchenTokens.size > 0) {
                notificationsRoute.sendMulticastNotification(
                    kitchenTokens,
                    '📞 Chef Called!',
                    `${userName} at ${seatNumber} needs assistance`,
                    { type: 'chef-call', callId: newCall.id }
                ).then(result => {
                    logger.info(`FCM sent to ${result.successCount || 0} kitchen devices`);
                }).catch(err => {
                    logger.error('FCM notification error:', err);
                });
            }
        }
        
        logger.info(`Chef called by ${userName} at ${seatNumber}`);
        res.json({ success: true, message: 'Chef has been notified!', call: newCall });
    } catch (error) {
        logger.error('Call Chef Error:', error);
        res.status(500).json({ success: false, message: 'Server error calling chef.' });
    }
});

/**
 * GET /chef-calls (Kitchen: Get Pending Chef Calls)
 */
router.get('/chef-calls', authorize(['kitchen', 'admin']), async (req, res) => {
    try {
        const pendingCalls = chefCalls.filter(call => call.status === 'pending');
        res.json(pendingCalls);
    } catch (error) {
        logger.error('Fetch Chef Calls Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching chef calls.' });
    }
});

/**
 * GET /chef-call-status (User: Check Chef Response)
 */
router.get('/chef-call-status', authorize(['user', 'admin']), async (req, res) => {
    const userId = parseInt(req.query.userId);
    
    try {
        // Find the most recent call from this user that has a response
        const userCalls = chefCalls.filter(call => 
            call.userId === userId && 
            call.chefResponse && 
            call.status === 'responded'
        );
        
        if (userCalls.length > 0) {
            const latestCall = userCalls[userCalls.length - 1];
            // Mark as read after sending
            latestCall.status = 'read';
            res.json({ success: true, call: latestCall });
        } else {
            res.json({ success: true, call: null });
        }
    } catch (error) {
        logger.error('Fetch Chef Call Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching call status.' });
    }
});

/**
 * PUT /chef-calls/:callId (Kitchen: Respond to Chef Call)
 */
router.put('/chef-calls/:callId', authorize(['kitchen', 'admin']), async (req, res) => {
    const callId = req.params.callId;
    const { action } = req.body;

    try {
        const callIndex = chefCalls.findIndex(call => call.id === callId);
        
        if (callIndex === -1) {
            return res.status(404).json({ success: false, message: 'Call not found.' });
        }

        const validActions = ['coming', 'coming_5min', 'dismiss'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }

        chefCalls[callIndex].chefResponse = action;
        chefCalls[callIndex].responseTime = new Date().toISOString();
        chefCalls[callIndex].status = action === 'dismiss' ? 'dismissed' : 'responded';
        
        // Emit response to user via socket for instant delivery
        if (io) {
            const updatedCall = chefCalls[callIndex];
            io.to(`user_${updatedCall.userId}`).emit('chef-response', {
                callId: updatedCall.id,
                response: action,
                responseTime: updatedCall.responseTime
            });
            logger.info(`Chef response emitted via socket to user ${updatedCall.userId}`);
        }
        
        logger.info(`Chef call ${callId} responded with: ${action}`);
        res.json({ success: true, message: `Response recorded: ${action}` });
    } catch (error) {
        logger.error('Update Chef Call Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating chef call.' });
    }
});

// Export the chef calls array for use in socket service
router.getChefCalls = () => chefCalls;
router.setChefCalls = (calls) => { chefCalls = calls; };

module.exports = router;