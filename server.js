// server.js - FINAL PRODUCTION VERSION WITH ALL LOGIC & FIXES

// --- 1. SETUP & DEPENDENCIES ---
const express = require('express');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require.main.require('./models/User'); // Use main.require for better module resolution
const Order = require.main.require('./models/Order'); // Use main.require for better module resolution

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
// NOTE: Make sure your .env has DB_URI defined (e.g., mongodb://localhost:27017/mavencafe)
const DB_URI = process.env.DB_URI;

// --- 2. CONFIGURATION & MIDDLEWARE ---
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- 3. DATABASE CONNECTION & SEEDING ---
mongoose.connect(DB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected successfully.');
        seedDatabase(); 
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// --- Database Seeding Function (Guaranteed to run once on an empty collection) ---
async function seedDatabase() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            let currentUserId = 101; 
            
            await User.insertMany([
                // NOTE: 'email' field is omitted, relying on the 'sparse: true' fix in User.js
                { id: currentUserId++, username: 'admin', password: 'adminpassword', name: 'Super Admin', role: 'admin', enabled: true },
                { id: currentUserId++, username: 'kitchen', password: 'kitchenpassword', name: 'Kitchen Manager', role: 'kitchen', enabled: true },
                { id: currentUserId++, username: 'ravi', password: 'userpassword', name: 'Ravi Sharma', role: 'user', enabled: true },
                { id: currentUserId++, username: 'puneet', password: 'puneetpassword', name: 'Puneet Singh', role: 'user', enabled: true },
            ]);
            console.log('🌱 Initial users inserted (Admin, Kitchen, Users).');
        }
    } catch (error) {
        // This catch block handles the E11000 duplicate key error if the index wasn't dropped manually
        logger.error('Database Seeding Failed (E11000 likely): Please ensure your DB is empty and restart.', error);
    }
}

// --- 4. LOGGING (Winston) ---
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ],
});
app.use((req, res, next) => {
    logger.info(`[${req.method}] ${req.url} - IP: ${req.ip}`);
    next();
});

// --- 5. AUTHORIZATION MIDDLEWARE ---

const authorize = (allowedRoles) => async (req, res, next) => {
    let userId, userRole;

    // Extract authorization data
    if (req.method === 'GET') {
        userId = parseInt(req.query.userId); 
        userRole = req.query.userRole; 
    } else {
        userId = req.body.userId;
        userRole = req.body.userRole;
    }
    
    if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Authentication required: User ID or Role missing in request.' });
    }

    try {
        const user = await User.findOne({ id: userId }); 

        if (!user) {
            return res.status(403).json({ success: false, message: 'Access denied: User not found.' });
        }
        
        if (user.role !== userRole) {
            return res.status(403).json({ success: false, message: 'Access denied: Role mismatch.' });
        }

        if (!user.enabled) {
            return res.status(403).json({ success: false, message: 'Access denied: Your account has been disabled.' });
        }
        
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: `Role '${user.role}' not authorized for this action.` });
        }
        
        req.currentUser = user; 
        next();
    } catch (error) {
        logger.error('Authorization Error:', error);
        return res.status(500).json({ success: false, message: 'Internal authorization error.' });
    }
};

// --- 6. API ENDPOINTS ---

/**
 * Endpoint 1: POST /api/login (User/Kitchen/Admin)
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
        // In a real app, you'd hash and compare passwords here.
        const user = await User.findOne({ username, password }); 

        if (user && user.enabled) {
            return res.json({ 
                success: true, 
                message: 'Login successful', 
                user: { id: user.id, name: user.name, role: user.role, username: user.username } 
            });
        } else if (user && !user.enabled) {
            return res.status(403).json({ success: false, message: 'Your account has been disabled by an administrator.' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (error) {
        logger.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});


// --- USER/ORDER ROUTES ---

/**
 * Endpoint 2: POST /api/orders (User: Place New Order)
 */
app.post('/api/orders', authorize(['user', 'admin']), async (req, res) => {
    const { userId, userName, slot, items } = req.body;

    // Basic validation based on schema
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
            timestamp: Date.now(),
        });

        logger.info(`New Order placed: ${newOrder._id} by ${newOrder.userName} in ${slot}`);
        res.status(201).json({ success: true, message: 'Order submitted successfully.', order: newOrder.toObject() });
    } catch (error) {
        logger.error('Order Submission Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during order submission.' });
    }
});

/**
 * Endpoint 3: GET /api/orders/:userId (User: View Own Orders)
 */
app.get('/api/orders/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    // We allow fetching without full authorization here since the FE will pass the ID
    try {
        // Fetch only orders that are NOT delivered
        const userOrders = await Order.find({ userId, status: { $ne: 'Delivered' } }).sort({ timestamp: -1 });
        res.json(userOrders);
    } catch (error) {
        logger.error('Fetch User Orders Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching user orders.' });
    }
});

/**
 * Endpoint 11: PUT /api/orders/:orderId (User: Edit/Cancel Order)
 */
app.put('/api/orders/:orderId', authorize(['user']), async (req, res) => {
    const orderId = req.params.orderId;
    const { userId, items, action } = req.body;

    if (action === 'delete') {
        // User wants to cancel the entire order
        try {
            const result = await Order.findOneAndDelete({ _id: orderId, userId: userId, status: { $in: ['Placed', 'Making'] } });
            if (!result) return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled at this stage.' });
            
            logger.warn(`Order ${orderId} CANCELLED by user ${userId}.`);
            return res.json({ success: true, message: 'Order cancelled successfully.' });
        } catch (error) {
            logger.error('Order Cancel Error:', error);
            return res.status(500).json({ success: false, message: 'Server error cancelling order.' });
        }
    }
    
    // User wants to edit the items
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


// --- KITCHEN/ADMIN ROUTES ---

/**
 * Endpoint 4: GET /api/orders (Kitchen/Admin: View All Active Orders)
 * Active Orders = Status is Placed, Making, or Ready (not Delivered)
 */
app.get('/api/orders', authorize(['admin', 'kitchen']), async (req, res) => {
    try {
        const activeOrders = await Order.find({ status: { $ne: 'Delivered' } }).sort({ timestamp: 1 }); 
        res.json(activeOrders);
    } catch (error) {
        logger.error('Fetch All Active Orders Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching orders.' });
    }
});

/**
 * Endpoint 5: PUT /api/orders/:orderId/status (Kitchen/Admin: Update Status)
 */
app.put('/api/orders/:orderId/status', authorize(['admin', 'kitchen']), async (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    const validStatuses = ['Placed', 'Making', 'Ready', 'Delivered'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }
    
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, 
            { status }, 
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


// --- ADMIN ROUTES (User Management) ---

/**
 * Endpoint 6: GET /api/users (Admin: Fetch All Users)
 */
app.get('/api/users', authorize(['admin']), async (req, res) => {
    try {
        const usersList = await User.find({}).select('-password'); 
        res.json(usersList);
    } catch (error) {
        logger.error('Fetch Users Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching users.' });
    }
});

/**
 * Endpoint 7: POST /api/users (Admin: Add New User)
 */
app.post('/api/users', authorize(['admin']), async (req, res) => {
    // Include email field for completeness, though Admin UI might omit it
    const { username, password, name, role, enabled, email } = req.body; 
    
    if (!username || !password || !name || !role || !['user', 'kitchen', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid or incomplete user data.' });
    }
    
    try {
        // **FIX: Explicitly check for username/email duplicates BEFORE Mongoose insertion**
        const existingUser = await User.findOne({ 
            $or: [
                { username }, 
                ...(email ? [{ email }] : []) // Only check email if it's provided
            ]
        });

        if (existingUser) {
            let message = 'A duplicate value was found. Please check username or email.';
            if (existingUser.username === username) {
                message = 'Username already exists.';
            } else if (email && existingUser.email === email) {
                message = 'Email already exists.';
            }
            return res.status(409).json({ success: false, message });
        }
        
        // --- ROBUST ID CALCULATION ---
        const lastUser = await User.findOne().sort({ id: -1 }).limit(1); 
        const newId = lastUser ? lastUser.id + 1 : 101; 
        // -----------------------------
        
        const newUser = await User.create({
            id: newId, 
            username,
            password,
            name,
            email: email || undefined, // Store undefined if empty
            role,
            enabled: enabled !== undefined ? enabled : true
        });

        logger.info(`New user created: ${newUser.id} (${newUser.role}) by Admin.`);
        const { password: _, ...safeUser } = newUser.toObject(); 
        res.status(201).json({ success: true, message: 'User created successfully.', user: safeUser });
    } catch (error) {
        logger.error('Create User Error - Database detail:', error); 
        
        // Catch E11000 index violation as a fallback
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'A duplicate value was found. Please check username or email (DB Index Error).' });
        }
        
        return res.status(500).json({ success: false, message: 'Server error creating user.' });
    }
});

/**
 * Endpoint 8: PUT /api/users/:userId/role (Admin: Change Role)
 */
app.put('/api/users/:userId/role', authorize(['admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    
    if (!['user', 'kitchen', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role provided.' });
    }
    
    try {
        const updatedUser = await User.findOneAndUpdate(
            { id: userId }, 
            { role }, 
            { new: true }
        );
        
        if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found.' });

        logger.warn(`User ${userId} role changed to: ${role} by Admin.`);
        res.json({ success: true, message: `Role updated to ${role}.` });
    } catch (error) {
        logger.error('Update Role Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating role.' });
    }
});

/**
 * Endpoint 9: PUT /api/users/:userId/access (Admin: Enable/Disable User)
 */
app.put('/api/users/:userId/access', authorize(['admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') return res.status(400).json({ success: false, message: 'Enabled status must be boolean.' });
    
    try {
        const updatedUser = await User.findOneAndUpdate(
            { id: userId }, 
            { enabled }, 
            { new: true }
        );
        
        if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found.' });

        logger.warn(`User ${userId} access set to: ${enabled} by Admin.`);
        res.json({ success: true, message: `Access ${enabled ? 'enabled' : 'disabled'} for user ${userId}.` });
    } catch (error) {
        logger.error('Update Access Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating access.' });
    }
});

/**
 * Endpoint 10: DELETE /api/users/:userId (Admin: Delete User)
 */
app.delete('/api/users/:userId', authorize(['admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
        const result = await User.deleteOne({ id: userId });

        if (result.deletedCount === 1) {
            logger.error(`User ${userId} DELETED by Admin.`);
            return res.json({ success: true, message: `User ${userId} deleted.` });
        } else {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
    } catch (error) {
        logger.error('Delete User Error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting user.' });
    }
});

/**
 * Endpoint 12: GET /api/user/:userId (Fetch User details for Profile)
 */
app.get('/api/user/:userId', authorize(['user', 'kitchen', 'admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const user = await User.findOne({ id: userId }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json(user);
    } catch (error) {
        logger.error('Fetch User Details Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching user details.' });
    }
});

/**
 * Endpoint 13: PUT /api/user/:userId (Update User details for Profile)
 */
app.put('/api/user/:userId', authorize(['user', 'kitchen', 'admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { name, email, password } = req.body; 

    const updateData = {};
    if (name) updateData.name = name;
    if (password) updateData.password = password; 

    try {
        // **FIX: Explicitly check for duplicate email during update**
        if (email) {
            const existingEmailUser = await User.findOne({ email, id: { $ne: userId } });
            if (existingEmailUser) {
                 return res.status(409).json({ success: false, message: 'Email already in use by another account.' });
            }
            updateData.email = email;
        } else {
            // Allow user to clear their email by setting it to null/undefined
            updateData.email = undefined;
        }

        const updatedUser = await User.findOneAndUpdate(
            { id: userId }, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found.' });

        logger.info(`User ${userId} updated profile details.`);
        res.json({ success: true, message: 'Profile updated successfully.', user: updatedUser.toObject() });
    } catch (error) {
        logger.error('Update Profile Error:', error);
        // Fallback catch for unique email violation
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email already in use by another account (DB Index Error).' });
        }
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
});


// --- 7. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    logger.error('Unhandled Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
    });
    res.status(500).json({
        success: false,
        message: 'An unexpected internal server error occurred. Check server logs.',
    });
});


// --- 8. START SERVER ---
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Maven Cafe Backend Server running on port ${PORT}`);
    console.log(`🔌 Connected to MongoDB URI: ${DB_URI ? DB_URI.substring(0, 30) : '...' }...`);
    console.log(`======================================================\n`);
});