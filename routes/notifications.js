// routes/notifications.js - FCM token management and push notification routes

const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const logger = require('winston');

// Firebase Admin SDK
let admin = null;
try {
    admin = require('../firebaseAdmin');
} catch (err) {
    logger.warn('Firebase Admin SDK not initialized:', err.message);
}

// In-memory storage for FCM tokens (should be moved to database in production)
let fcmTokens = new Map();

// Store tokens by role for group notifications
let kitchenTokens = new Set();
let adminTokens = new Set();

/**
 * Send FCM push notification
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin) {
        logger.warn('Firebase Admin not initialized, skipping push notification');
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            token,
            webpush: {
                notification: {
                    title,
                    body,
                    icon: '/icons/icon-192-v2.png',
                    badge: '/icons/icon-192-v2.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                },
                fcmOptions: {
                    link: '/',
                },
            },
        };

        const response = await admin.messaging().send(message);
        logger.info(`FCM notification sent successfully: ${response}`);
        return { success: true, messageId: response };
    } catch (error) {
        logger.error('FCM send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to multiple tokens
 */
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
    if (!admin || tokens.length === 0) {
        return { success: false, error: 'No tokens or Firebase not initialized' };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            tokens: Array.from(tokens),
            webpush: {
                notification: {
                    title,
                    body,
                    icon: '/icons/icon-192-v2.png',
                    badge: '/icons/icon-192-v2.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        logger.info(`FCM multicast sent: ${response.successCount} success, ${response.failureCount} failed`);
        return { success: true, successCount: response.successCount, failureCount: response.failureCount };
    } catch (error) {
        logger.error('FCM multicast error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * POST /save-fcm-token (User: Save FCM Token)
 */
router.post('/save-fcm-token', async (req, res) => {
    const { token, userId, userRole } = req.body;

    if (!token || !userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Token and userId are required.' 
        });
    }

    try {
        // Store token by userId
        fcmTokens.set(String(userId), token);
        
        // Also store by role for group notifications
        if (userRole === 'kitchen') {
            kitchenTokens.add(token);
        } else if (userRole === 'admin') {
            adminTokens.add(token);
        }
        
        logger.info(`FCM token saved for user ${userId} (role: ${userRole || 'unknown'})`);
        res.json({ 
            success: true, 
            message: 'FCM token saved successfully.' 
        });
    } catch (error) {
        logger.error('Save FCM Token Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error saving FCM token.' 
        });
    }
});

/**
 * POST /send-notification (Admin/Kitchen: Send Notification to specific user)
 */
router.post('/send-notification', authorize(['admin', 'kitchen']), async (req, res) => {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId, title, and body are required.' 
        });
    }

    try {
        const token = fcmTokens.get(String(userId));
        
        if (!token) {
            return res.status(404).json({ 
                success: false, 
                message: 'FCM token not found for user.' 
            });
        }

        const result = await sendPushNotification(token, title, body, data || {});
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Notification sent successfully.',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: result.error 
            });
        }
    } catch (error) {
        logger.error('Send Notification Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error sending notification.' 
        });
    }
});

/**
 * POST /notify-kitchen (Send notification to all kitchen staff)
 */
router.post('/notify-kitchen', async (req, res) => {
    const { title, body, data } = req.body;

    if (!title || !body) {
        return res.status(400).json({ 
            success: false, 
            message: 'title and body are required.' 
        });
    }

    try {
        if (kitchenTokens.size === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No kitchen staff tokens registered.' 
            });
        }

        const result = await sendMulticastNotification(kitchenTokens, title, body, data || {});
        
        res.json({ 
            success: result.success, 
            message: `Notification sent to ${result.successCount || 0} kitchen staff.`,
            ...result
        });
    } catch (error) {
        logger.error('Notify Kitchen Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error notifying kitchen.' 
        });
    }
});

/**
 * GET /notification-debug (Debug notification system)
 */
router.get('/notification-debug', async (req, res) => {
    try {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            kitchenTokens: {
                count: kitchenTokens.size,
                tokens: Array.from(kitchenTokens).map(token => 
                    token.substring(0, 20) + '...'
                )
            },
            allTokens: {
                count: fcmTokens.size,
                users: Array.from(fcmTokens.entries()).map(([userId, token]) => ({
                    userId,
                    tokenPreview: token.substring(0, 20) + '...'
                }))
            },
            firebaseAdmin: admin ? 'initialized' : 'not initialized'
        };

        res.json({
            success: true,
            message: 'Notification debug information',
            data: debugInfo
        });
    } catch (error) {
        logger.error('Notification debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting debug information',
            error: error.message
        });
    }
});

/**
 * POST /test-notification (Test notification system)
 */
router.post('/test-notification', async (req, res) => {
    const { userId, userRole } = req.body;

    try {
        const testTitle = '🔔 Test Notification';
        const testBody = 'This is a test notification from Maven Cafe system';
        const testData = {
            type: 'test',
            timestamp: new Date().toISOString(),
            userId: userId || 'system',
            userRole: userRole || 'system'
        };

        let result;
        if (userRole === 'kitchen' || !userId) {
            // Send to all kitchen staff
            if (kitchenTokens.size === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No kitchen staff tokens available for test notification'
                });
            }
            result = await sendMulticastNotification(kitchenTokens, testTitle, testBody, testData);
        } else {
            // Send to specific user
            const token = fcmTokens.get(String(userId));
            if (!token) {
                return res.status(404).json({
                    success: false,
                    message: 'No FCM token found for user'
                });
            }
            result = await sendPushNotification(token, testTitle, testBody, testData);
        }

        res.json({
            success: result.success,
            message: `Test notification sent ${result.success ? 'successfully' : 'failed'}`,
            details: result
        });
    } catch (error) {
        logger.error('Test notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test notification',
            error: error.message
        });
    }
});

// Export functions for use in other routes
router.sendPushNotification = sendPushNotification;
router.sendMulticastNotification = sendMulticastNotification;
router.getKitchenTokens = () => kitchenTokens;
router.getTokens = () => fcmTokens;
router.setTokens = (tokens) => { fcmTokens = tokens; };

module.exports = router;
