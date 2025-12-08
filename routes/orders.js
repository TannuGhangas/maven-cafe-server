// routes/orders.js - Order management routes

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const logger = require('winston');

// Socket.IO instance (will be set by server.js)
let io = null;
router.setIO = (socketIO) => { io = socketIO; };

// Notifications route reference (will be set by server.js)
let notificationsRoute = null;
router.setNotificationsRoute = (route) => { notificationsRoute = route; };

/**
 * POST /orders (User: Place New Order)
 */
router.post('/orders', authorize(['user', 'admin']), async (req, res) => {
    const { userId, userName, slot, items } = req.body;

    if (!userId || !userName || !slot || !items || items.length === 0 || !['morning (9:00-12:00)', 'afternoon (1:00 - 5:30)'].includes(slot)) {
        return res.status(400).json({ success: false, message: 'Incomplete or invalid order data.' });
    }

    try {
        const newOrder = await Order.create({
            userId,
            userName,
            slot,
            items,
            status: 'Placed',
            tags: ['New'],
            timestamp: Date.now(),
        });

        logger.info(`New Order placed: ${newOrder._id} by ${newOrder.userName} in ${slot}`);
        
        // Emit to kitchen via socket for instant notification
        if (io) {
            try {
                // Emit through socket service for proper event handling
                io.emit('new-order', newOrder.toObject());
                logger.info(`New order emitted via socket to kitchen: ${newOrder._id}`);
            } catch (socketError) {
                logger.error('Socket emission error:', socketError);
            }
        } else {
            logger.warn('Socket.IO instance not available for order notification');
        }
        
        // Send FCM push notification to kitchen staff (for when app is closed)
        if (notificationsRoute && notificationsRoute.getKitchenTokens) {
            try {
                const kitchenTokens = notificationsRoute.getKitchenTokens();
                logger.info(`Found ${kitchenTokens.size} kitchen FCM tokens for notification`);
                
                if (kitchenTokens.size > 0) {
                    const itemSummary = items.map(i => `${i.quantity}x ${i.item}`).join(', ');
                    const notificationPayload = {
                        title: '🍽️ New Order!',
                        body: `${userName}: ${itemSummary}`,
                        data: { 
                            type: 'new-order', 
                            orderId: newOrder._id.toString(),
                            userName: userName,
                            timestamp: new Date().toISOString()
                        }
                    };
                    
                    notificationsRoute.sendMulticastNotification(
                        kitchenTokens,
                        notificationPayload.title,
                        notificationPayload.body,
                        notificationPayload.data
                    ).then(result => {
                        logger.info(`FCM sent to ${result.successCount || 0} kitchen devices for new order ${newOrder._id}`);
                    }).catch(err => {
                        logger.error('FCM notification error:', err);
                    });
                } else {
                    logger.warn('No kitchen FCM tokens available for notification');
                }
            } catch (fcmError) {
                logger.error('FCM setup error:', fcmError);
            }
        } else {
            logger.warn('Notifications route not available for FCM notifications');
        }
        
        res.status(201).json({ success: true, message: 'Order submitted successfully.', order: newOrder.toObject() });
    } catch (error) {
        logger.error('Order Submission Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during order submission.' });
    }
});

/**
 * GET /orders/:userId (User: View Own Orders)
 */
router.get('/orders/:userId', authorize(['user']), async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const userOrders = await Order.find({ userId }).sort({ timestamp: -1 });
        res.json(userOrders);
    } catch (error) {
        logger.error('Fetch User Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching user orders.' });
    }
});

/**
 * PUT /orders/:orderId (User: Edit/Cancel Order)
 */
router.put('/orders/:orderId', authorize(['user']), async (req, res) => {
    const orderId = req.params.orderId;
    const { userId, items, action } = req.body;

    if (action === 'delete') {
        try {
            const result = await Order.findOneAndDelete({ _id: orderId, userId: userId, status: { $in: ['Placed', 'Making'] } });
            if (!result) return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled at this stage.' });
            
            logger.warn(`Order ${orderId} CANCELLED by user ${userId}.`);
            
            // Emit to kitchen via socket for instant update
            if (io) {
                try {
                    io.emit('order-deleted', { 
                        orderId: orderId, 
                        userId: userId,
                        cancelledBy: userId,
                        timestamp: Date.now()
                    });
                    logger.info(`Order cancellation emitted via socket to kitchen: ${orderId}`);
                } catch (socketError) {
                    logger.error('Socket emission error for order cancellation:', socketError);
                }
            } else {
                logger.warn('Socket.IO instance not available for order cancellation notification');
            }
            
            return res.json({ success: true, message: 'Order cancelled successfully.' });
        } catch (error) {
            logger.error('Order Cancel Error:', error);
            return res.status(500).json({ success: false, message: 'Server error cancelling order.' });
        }
    }
    
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Items list is empty for update.' });
    }

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, userId: userId, status: { $in: ['Placed'] } }, 
            { items, timestamp: Date.now() }, 
            { new: true }
        );

        if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found or cannot be edited (status is already Making/Ready/Delivered).' });
        
        logger.info(`Order ${orderId} EDITED by user ${userId}.`);
        res.json({ success: true, message: 'Order updated successfully.', order: updatedOrder.toObject() });
    } catch (error) {
        logger.error('Order Update Error:', error);
        return res.status(500).json({ success: false, message: 'Server error updating order.' });
    }
});

/**
 * GET /orders (Kitchen/Admin: View All Active Orders)
 */
router.get('/orders', authorize(['admin', 'kitchen']), async (req, res) => {
    try {
        const activeOrders = await Order.find({ status: { $ne: 'Delivered' } }).sort({ timestamp: 1 });
        
        // Manually fetch user data for each order since userId is stored as Number
        const ordersWithUserInfo = await Promise.all(activeOrders.map(async (order) => {
            const orderObj = order.toObject();
            const user = await User.findOne({ id: order.userId }).select('name profileImage avatar role');
            
            return {
                ...orderObj,
                userProfile: {
                    name: user?.name || order.userName,
                    profileImage: user?.profileImage || user?.avatar || null,
                    role: user?.role || 'user'
                }
            };
        }));
        
        res.json(ordersWithUserInfo);
    } catch (error) {
        logger.error('Fetch All Active Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching orders.' });
    }
});

/**
 * PUT /orders/:orderId/status (Kitchen/Admin: Update Status)
 */
router.put('/orders/:orderId/status', authorize(['admin', 'kitchen']), async (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    const validStatuses = ['Placed', 'Making', 'Ready', 'Delivered'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }
    
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status, $pull: { tags: 'New' } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        
        logger.info(`Order ${orderId} status updated to: ${status} by ${req.currentUser.name}`);
        res.json({ success: true, message: `Order ${orderId} status updated to ${status}.` });
    } catch (error) {
        logger.error('Update Order Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating order status.' });
    }
});

module.exports = router;