// -----------------------------------------------------------
// routes/notifications.js – FCM Token Management + Push System
// -----------------------------------------------------------

const express = require("express");
const router = express.Router();

const { authorize } = require("../middleware/auth");
const logger = require("../utils/logger");

// -----------------------------------------------------------
// Firebase Admin SDK (safe import)
// -----------------------------------------------------------
let admin = null;
try {
    admin = require("../firebaseAdmin");
    logger.info("Firebase Admin SDK initialized");
} catch (err) {
    logger.warn(`Firebase Admin SDK not initialized: ${err.message}`);
}

// -----------------------------------------------------------
// In-memory token storage (use DB in production)
// -----------------------------------------------------------
let fcmTokens = new Map();   // userId → token
let kitchenTokens = new Set();
let adminTokens = new Set();

// -----------------------------------------------------------
// SINGLE DEVICE NOTIFICATION
// -----------------------------------------------------------
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin) {
        return { success: false, error: "Firebase Admin not initialized" };
    }

    try {
        const message = {
            token,
            notification: { title, body },
            data: { ...data, click_action: "FLUTTER_NOTIFICATION_CLICK" },

            webpush: {
                notification: {
                    title,
                    body,
                    icon: "/icons/icon-192-v2.png",
                    badge: "/icons/icon-192-v2.png",
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                    tag: Date.now().toString(),
                    renotify: true,
                },
                fcmOptions: { link: "/" }
            }
        };

        const response = await admin.messaging().send(message);
        logger.info(`FCM single notification sent: ${response}`);

        return { success: true, messageId: response };
    } catch (error) {
        logger.error(`FCM send error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// -----------------------------------------------------------
// MULTICAST NOTIFICATION
// -----------------------------------------------------------
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
    if (!admin) {
        return { success: false, error: "Firebase Admin not initialized" };
    }

    if (tokens.size === 0) {
        return { success: false, error: "No tokens available" };
    }

    try {
        const message = {
            tokens: [...tokens],
            notification: { title, body },
            data: { ...data, click_action: "FLUTTER_NOTIFICATION_CLICK" },

            webpush: {
                notification: {
                    title,
                    body,
                    icon: "/icons/icon-192-v2.png",
                    badge: "/icons/icon-192-v2.png",
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                    tag: Date.now().toString(),
                    renotify: true
                },
                fcmOptions: { link: "/" }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        logger.info(
            `FCM multicast: ${response.successCount} success, ${response.failureCount} failed`
        );

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        logger.error(`FCM multicast error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// -----------------------------------------------------------
// SAVE USER FCM TOKEN
// -----------------------------------------------------------
router.post("/save-fcm-token", async (req, res) => {
    const { token, userId, userRole } = req.body;

    if (!token || !userId) {
        return res.status(400).json({
            success: false,
            message: "token and userId are required"
        });
    }

    try {
        fcmTokens.set(String(userId), token);

        if (userRole === "kitchen") kitchenTokens.add(token);
        if (userRole === "admin") adminTokens.add(token);

        logger.info(`FCM token saved for user ${userId} (${userRole})`);

        res.json({ success: true, message: "FCM token saved successfully" });
    } catch (err) {
        logger.error(`Save token error: ${err.message}`);
        res.status(500).json({ success: false, message: "Server error saving token" });
    }
});

// -----------------------------------------------------------
// SEND TO SPECIFIC USER
// -----------------------------------------------------------
router.post("/send-notification", authorize(["admin", "kitchen"]), async (req, res) => {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
        return res.status(400).json({
            success: false,
            message: "userId, title, and body required"
        });
    }

    const token = fcmTokens.get(String(userId));

    if (!token) {
        return res.status(404).json({
            success: false,
            message: "User FCM token not found"
        });
    }

    const result = await sendPushNotification(token, title, body, data || {});

    result.success
        ? res.json({ success: true, message: "Notification sent", id: result.messageId })
        : res.status(500).json({ success: false, message: result.error });
});

// -----------------------------------------------------------
// SEND TO ALL KITCHEN STAFF
// -----------------------------------------------------------
router.post("/notify-kitchen", async (req, res) => {
    const { title, body, data } = req.body;

    if (!title || !body) {
        return res.status(400).json({
            success: false,
            message: "title and body required"
        });
    }

    if (kitchenTokens.size === 0) {
        return res.status(404).json({
            success: false,
            message: "No kitchen tokens registered"
        });
    }

    const result = await sendMulticastNotification(kitchenTokens, title, body, data || {});
    res.json({ success: true, details: result });
});

// -----------------------------------------------------------
// DEBUG ROUTE
// -----------------------------------------------------------
router.get("/notification-debug", (req, res) => {
    res.json({
        firebaseAdmin: admin ? "initialized" : "not initialized",
        kitchenTokens: [...kitchenTokens].map(t => t.slice(0, 20) + "..."),
        allTokens: [...fcmTokens.entries()].map(([id, t]) => ({
            userId: id,
            token: t.slice(0, 20) + "..."
        })),
        timestamp: new Date().toISOString()
    });
});

// -----------------------------------------------------------
// TEST NOTIFICATION
// -----------------------------------------------------------
router.post("/test-notification", async (req, res) => {
    const { userId, userRole } = req.body;

    const title = "🔔 Test Notification";
    const body = "This is a test notification.";
    const data = { type: "test", time: new Date().toISOString() };

    let result;

    if (userRole === "kitchen" || !userId) {
        if (kitchenTokens.size === 0) {
            return res.status(404).json({
                success: false,
                message: "No kitchen tokens registered"
            });
        }
        result = await sendMulticastNotification(kitchenTokens, title, body, data);
    } else {
        const token = fcmTokens.get(String(userId));
        if (!token) {
            return res.status(404).json({ success: false, message: "User token not found" });
        }
        result = await sendPushNotification(token, title, body, data);
    }

    res.json({
        success: result.success,
        message: result.success ? "Test notification sent" : "Failed",
        details: result
    });
});

// -----------------------------------------------------------
// EXPORT
// -----------------------------------------------------------
router.sendPushNotification = sendPushNotification;
router.sendMulticastNotification = sendMulticastNotification;
router.getKitchenTokens = () => kitchenTokens;
router.getTokens = () => fcmTokens;

module.exports = router;
