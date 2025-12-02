// server.js

// --- 1. SETUP & DEPENDENCIES ---
const express = require('express');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require.main.require('./models/User');
const Order = require.main.require('./models/Order');
const Feedback = require.main.require('./models/Feedback');
const Menu = require.main.require('./models/Menu');
const Location = require.main.require('./models/Location');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;
const DB_URI = process.env.DB_URI;

// --- 2. CONFIGURATION & MIDDLEWARE ---
app.use(
    cors({
        origin: true, // Allow all origins for development
        methods: "GET,POST,PUT,DELETE",
        allowedHeaders: "Content-Type,Authorization"
    })
);
// CRITICAL: Express body parser must be here before routes
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Added for robustness, though JSON is used for this app

// --- 3. LOGGING (Winston) ---
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

// --- 4. DATABASE CONNECTION & SEEDING ---
mongoose.connect(DB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected successfully.');
        seedDatabase(); 
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

async function seedDatabase() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            let currentUserId = 101;

            await User.insertMany([
                { id: currentUserId++, username: 'admin', password: 'adminpassword', name: 'Super Admin', role: 'admin', enabled: true },
                { id: currentUserId++, username: 'kitchen', password: 'kitchenpassword', name: 'Kitchen Manager', role: 'kitchen', enabled: true },
                { id: currentUserId++, username: 'Tannu', password: '123', name: 'Tannu', role: 'admin', enabled: true },
            ]);
            console.log('🌱 Initial users inserted (Admin, Kitchen, Users).');

            // Seed default menu
            const defaultMenu = {
                categories: [
                    { name: 'Coffee', icon: 'FaCoffee', items: [{ name: "Black", available: true }, { name: "Milk", available: true }, { name: "Simple", available: true }, { name: "Cold", available: true }], color: '#8B4513', enabled: true },
                    { name: 'Tea', icon: 'FaMugHot', items: [{ name: "Black", available: true }, { name: "Milk", available: true }, { name: "Green", available: true }], color: '#228B22', enabled: true },
                    { name: 'Water', icon: 'FaTint', items: [{ name: "Warm", available: true }, { name: "Cold", available: true }, { name: "Hot", available: true }, { name: "Lemon", available: true }], color: '#87CEEB', enabled: true },
                    { name: 'Shikanji', icon: 'FaLemon', items: [{ name: 'normal', available: true }], color: '#FFD700', enabled: true },
                    { name: 'Jaljeera', icon: 'FaCube', items: [{ name: 'normal', available: true }], color: '#8B0000', enabled: true },
                    { name: 'Soup', icon: 'FaUtensilSpoon', items: [{ name: 'normal', available: true }], color: '#FFA500', enabled: true },
                    { name: 'Maggie', icon: 'FaUtensilSpoon', items: [{ name: 'normal', available: true }], color: '#FF6347', enabled: true },
                    { name: 'Oats', icon: 'FaUtensilSpoon', items: [{ name: 'normal', available: true }], color: '#D2691E', enabled: true },
                ],
                addOns: [{ name: "Ginger", available: true }, { name: "Cloves", available: true }, { name: "Fennel Seeds", available: true }, { name: "Cardamom", available: true }, { name: "Cinnamon", available: true }],
                sugarLevels: [{ level: 0, available: true }, { level: 1, available: true }, { level: 2, available: true }, { level: 3, available: true }],
                itemImages: {
                    tea: 'https://tmdone-cdn.s3.me-south-1.amazonaws.com/store-covers/133003776906429295.jpg',
                    coffee: 'https://i.pinimg.com/474x/7a/29/df/7a29dfc903d98c6ba13b687ef1fa1d1a.jpg',
                    water: 'https://images.stockcake.com/public/d/f/f/dffca756-1b7f-4366-8b89-4ad6f9bbf88a_large/chilled-water-glass-stockcake.jpg',
                    shikanji: 'https://i.pinimg.com/736x/1f/fd/08/1ffd086ffef72a98f234162a312cfe39.jpg',
                    jaljeera: 'https://i.ndtvimg.com/i/2018-02/jaljeera_620x330_81517570928.jpg',
                    soup: 'https://www.inspiredtaste.net/wp-content/uploads/2018/10/Homemade-Vegetable-Soup-Recipe-2-1200.jpg',
                    maggie: 'https://i.pinimg.com/736x/5c/6d/9f/5c6d9fe78de73a7698948e011d6745f1.jpg',
                    oats: 'https://images.moneycontrol.com/static-mcnews/2024/08/20240827041559_oats.jpg?impolicy=website&width=1600&height=900',
                }
            };
            await Menu.create(defaultMenu);
            console.log('🍽️ Default menu inserted.');

            // Seed default locations
            const defaultLocations = [
                { id: 1, name: 'Ajay', location: 'Seat_7', access: 'Confrence' },
                { id: 2, name: 'Tannu', location: 'Seat_8', access: 'Own seat' },
                { id: 3, name: 'Lovekush', location: 'Seat_6', access: 'Own seat' },
                { id: 4, name: 'Ansh', location: 'Seat_5', access: 'Own seat' },
                { id: 5, name: 'Vanshika', location: 'Seat_4', access: 'Own seat' },
                { id: 6, name: 'Sonu', location: 'Seat_3', access: 'Confrence' },
                { id: 7, name: 'Khushi', location: 'Seat_15', access: 'Confrence' },
                { id: 8, name: 'Sneha', location: 'Reception', access: 'Own seat' },
                { id: 9, name: 'Muskan', location: 'Seat_11', access: 'Own seat' },
                { id: 10, name: 'Nikita', location: 'Seat_16', access: 'Own seat' },
                { id: 11, name: 'Saloni', location: 'Seat_14', access: 'Own seat' },
                { id: 12, name: 'Babita', location: 'Reception', access: 'Own seat' },
                { id: 13, name: 'Monu', location: 'Seat_1', access: 'Own seat' },
                { id: 14, name: 'Sourabh', location: 'Seat_2', access: 'Own seat' },
                { id: 15, name: 'Gurmeet', location: 'Maven_Area', access: 'Confrence' },
                { id: 16, name: 'Sneha Lathwal', location: 'Maven_Area', access: 'Own seat' },
                { id: 17, name: 'Vanshika Jagga', location: 'Maven_Area', access: 'Own seat' },
                { id: 18, name: 'Nisha', location: 'Reception', access: 'Pod room/Confrence' },
                { id: 19, name: 'Suhana', location: 'Seat_10', access: 'All' },
                { id: 20, name: 'Ketan', location: 'Ketan_Cabin', access: 'All' },
                { id: 21, name: 'Bhavishya', location: 'Bhavishya_Cabin', access: 'All' },
                { id: 22, name: 'Satish', location: 'Seat_12', access: 'Own seat' },
                { id: 23, name: 'Sahil', location: 'Seat_20', access: 'Own seat/Confrence' },
                { id: 24, name: 'Diwakar', location: 'Diwakar_Sir_Cabin', access: 'All' },
                { id: 25, name: 'Sharma Sir', location: 'Sharma_Sir_Office', access: 'All' },
                { id: 26, name: 'Ritesh Sir', location: 'Ritesh_Sir_Cabin', access: 'All' },
            ];
            await Location.insertMany(defaultLocations);
            console.log('📍 Default locations inserted.');
        }

        // Seed or update menu
        const defaultMenu = {
            categories: [
                { name: 'Coffee', icon: 'FaCoffee', items: [{ name: "Black", available: true }, { name: "Milk", available: true }, { name: "Simple", available: true }, { name: "Cold", available: true }], color: '#8B4513', enabled: true },
                { name: 'Tea', icon: 'FaMugHot', items: [{ name: "Black", available: true }, { name: "Milk", available: true }, { name: "Green", available: true }], color: '#228B22', enabled: true },
                { name: 'Water', icon: 'FaTint', items: [{ name: "Warm", available: true }, { name: "Cold", available: true }, { name: "Hot", available: true }, { name: "Lemon", available: true }], color: '#87CEEB', enabled: true },
                { name: 'Shikanji', icon: 'FaLemon', items: [{ name: 'normal', available: true }], color: '#FFD700', enabled: true },
                { name: 'Jaljeera', icon: 'FaCube', items: [{ name: 'normal', available: true }], color: '#8B0000', enabled: true },
                { name: 'Soup', icon: 'FaUtensilSpoon', items: [{ name: 'normal', available: true }], color: '#FFA500', enabled: true },
                { name: 'Maggie', icon: 'FaUtensilSpoon', items: [{ name: 'normal', available: true }], color: '#FF6347', enabled: true },
                { name: 'Oats', icon: 'FaUtensilSpoon', items: [{ name: 'normal', available: true }], color: '#D2691E', enabled: true },
            ],
            addOns: [{ name: "Ginger", available: true }, { name: "Cloves", available: true }, { name: "Fennel Seeds", available: true }, { name: "Cardamom", available: true }, { name: "Cinnamon", available: true }],
            sugarLevels: [{ level: 0, available: true }, { level: 1, available: true }, { level: 2, available: true }, { level: 3, available: true }],
            itemImages: {
                tea: 'https://tmdone-cdn.s3.me-south-1.amazonaws.com/store-covers/133003776906429295.jpg',
                coffee: 'https://i.pinimg.com/474x/7a/29/df/7a29dfc903d98c6ba13b687ef1fa1d1a.jpg',
                water: 'https://images.stockcake.com/public/d/f/f/dffca756-1b7f-4366-8b89-4ad6f9bbf88a_large/chilled-water-glass-stockcake.jpg',
                shikanji: 'https://i.pinimg.com/736x/1f/fd/08/1ffd086ffef72a98f234162a312cfe39.jpg',
                jaljeera: 'https://i.ndtvimg.com/i/2018-02/jaljeera_620x330_81517570928.jpg',
                soup: 'https://www.inspiredtaste.net/wp-content/uploads/2018/10/Homemade-Vegetable-Soup-Recipe-2-1200.jpg',
                maggie: 'https://i.pinimg.com/736x/5c/6d/9f/5c6d9fe78de73a7698948e011d6745f1.jpg',
                oats: 'https://images.moneycontrol.com/static-mcnews/2024/08/20240827041559_oats.jpg?impolicy=website&width=1600&height=900',
            }
        };
        await Menu.findOneAndUpdate({}, defaultMenu, { upsert: true });
        console.log('🍽️ Menu seeded/updated.');

        // Seed locations if not exists
        const locationsExist = await Location.findOne();
        if (!locationsExist) {
            const defaultLocations = [
                { id: 1, name: 'Ajay', location: 'Seat_7', access: 'Confrence' },
                { id: 2, name: 'Tannu', location: 'Seat_8', access: 'Own seat' },
                { id: 3, name: 'Lovekush', location: 'Seat_6', access: 'Own seat' },
                { id: 4, name: 'Ansh', location: 'Seat_5', access: 'Own seat' },
                { id: 5, name: 'Vanshika', location: 'Seat_4', access: 'Own seat' },
                { id: 6, name: 'Sonu', location: 'Seat_3', access: 'Confrence' },
                { id: 7, name: 'Khushi', location: 'Seat_15', access: 'Confrence' },
                { id: 8, name: 'Sneha', location: 'Reception', access: 'Own seat' },
                { id: 9, name: 'Muskan', location: 'Seat_11', access: 'Own seat' },
                { id: 10, name: 'Nikita', location: 'Seat_16', access: 'Own seat' },
                { id: 11, name: 'Saloni', location: 'Seat_14', access: 'Own seat' },
                { id: 12, name: 'Babita', location: 'Reception', access: 'Own seat' },
                { id: 13, name: 'Monu', location: 'Seat_1', access: 'Own seat' },
                { id: 14, name: 'Sourabh', location: 'Seat_2', access: 'Own seat' },
                { id: 15, name: 'Gurmeet', location: 'Maven_Area', access: 'Confrence' },
                { id: 16, name: 'Sneha Lathwal', location: 'Maven_Area', access: 'Own seat' },
                { id: 17, name: 'Vanshika Jagga', location: 'Maven_Area', access: 'Own seat' },
                { id: 18, name: 'Nisha', location: 'Reception', access: 'Pod room/Confrence' },
                { id: 19, name: 'Suhana', location: 'Seat_10', access: 'All' },
                { id: 20, name: 'Ketan', location: 'Ketan_Cabin', access: 'All' },
                { id: 21, name: 'Bhavishya', location: 'Bhavishya_Cabin', access: 'All' },
                { id: 22, name: 'Satish', location: 'Seat_12', access: 'Own seat' },
                { id: 23, name: 'Sahil', location: 'Seat_20', access: 'Own seat/Confrence' },
                { id: 24, name: 'Diwakar', location: 'Diwakar_Sir_Cabin', access: 'All' },
                { id: 25, name: 'Sharma Sir', location: 'Sharma_Sir_Office', access: 'All' },
                { id: 26, name: 'Ritesh Sir', location: 'Ritesh_Sir_Cabin', access: 'All' },
            ];
            await Location.insertMany(defaultLocations);
            console.log('📍 Default locations inserted.');
        }
    } catch (error) {
        logger.error('Database Seeding Failed (E11000 likely): Please ensure your DB is empty and restart.', error);
    }
}

// --- 5. AUTHORIZATION MIDDLEWARE ---

const authorize = (allowedRoles) => async (req, res, next) => {
    let userId; 
    let clientRole; 

    // Extract authorization data
    if (req.method === 'GET') {
        userId = parseInt(req.query.userId); 
        clientRole = req.query.userRole; 
    } else {
        // For POST/PUT/DELETE, check req.body (parsed by express.json())
        userId = req.body.userId;
        clientRole = req.body.userRole; 
    }
    
    // Improved Check: Handle missing authentication data
    if (!userId || !clientRole) {
        let missingField = !userId ? 'User ID' : 'User Role';
        return res.status(401).json({ success: false, message: `Authentication required: ${missingField} missing in request body/query.` });
    }
    // Ensure userId is treated as a number
    userId = parseInt(userId);

    try {
        const user = await User.findOne({ id: userId }); 

        if (!user) {
            return res.status(403).json({ success: false, message: 'Access denied: User not found in database.' });
        }
        
        if (user.role !== clientRole) {
            return res.status(403).json({ success: false, message: 'Access denied: Role mismatch with server data.' });
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
        res.status(201).json({ success: true, message: 'Order submitted successfully.', order: newOrder.toObject() });
    } catch (error) {
        logger.error('Order Submission Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during order submission.' });
    }
});

/**
 * Endpoint 14: POST /api/feedback (User: Submit Feedback/Complaint)
 */
app.post('/api/feedback', authorize(['user', 'admin', 'kitchen']), async (req, res) => {
    const { userId, userName, type, details, location, orderReference, status } = req.body;

    // The authorize middleware already verified userId and role.
    if (!userName || !type || !details || !location) { 
        return res.status(400).json({ success: false, message: 'Incomplete or invalid feedback data. Location is required.' });
    }

    try {
        const newFeedback = await Feedback.create({
            userId,
            userName,
            type,
            details,
            location: location || 'N/A', 
            orderReference: orderReference || 'N/A', 
            status: status || 'New', 
            timestamp: new Date()
        });

        logger.info(`New Feedback submitted: ${newFeedback._id} by ${userName} (Type: ${type})`);
        res.status(201).json({ success: true, message: 'Feedback submitted successfully.', feedback: newFeedback.toObject() });
    } catch (error) {
        logger.error('Feedback Submission Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during feedback submission.' });
    }
});

// --- FEEDBACK ROUTES FOR KITCHEN/ADMIN ---

/**
 * Endpoint 15: GET /api/feedback (Kitchen/Admin: Fetch All Complaints)
 */
app.get('/api/feedback', authorize(['admin', 'kitchen']), async (req, res) => { 
    try {
        const complaints = await Feedback.find().sort({ timestamp: -1 });
        res.json(complaints);
    } catch (err) {
        logger.error('Fetch All Complaints Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching feedback' });
    }
});

/**
 * Endpoint 16: PUT /api/feedback/:id (Kitchen/Admin: Update Complaint Status)
 */
app.put('/api/feedback/:id', authorize(['admin', 'kitchen']), async (req, res) => { 
    const feedbackId = req.params.id;
    const { status } = req.body; 

    if (!['New', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    try {
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { status: status },
            { new: true }
        );

        if (!updatedFeedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found.' });
        }
        
        logger.info(`Feedback ${feedbackId} status updated to: ${status} by ${req.currentUser.name}`);
        res.json({ success: true, message: `Feedback status updated to ${status}.`, feedback: updatedFeedback });
    } catch (err) {
        logger.error('Update Complaint Status Error:', err);
        res.status(500).json({ success: false, message: 'Server error updating status' });
    }
});


/**
 * Endpoint 3: GET /api/orders/:userId (User: View Own Orders)
 */
app.get('/api/orders/:userId', authorize(['user']), async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const userOrders = await Order.find({ userId }).sort({ timestamp: -1 });
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


// --- KITCHEN/ADMIN ROUTES (Orders) ---

/**
 * Endpoint 4: GET /api/orders (Kitchen/Admin: View All Active Orders)
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
    const { username, password, name, role, enabled, email } = req.body; 
    
    if (!username || !password || !name || !role || !['user', 'kitchen', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid or incomplete user data.' });
    }
    
    try {
        const existingUser = await User.findOne({ 
            $or: [
                { username }, 
                ...(email ? [{ email }] : []) 
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
        
        const lastUser = await User.findOne().sort({ id: -1 }).limit(1); 
        const newId = lastUser ? lastUser.id + 1 : 101; 
        
        const newUser = await User.create({
            id: newId, 
            username,
            password,
            name,
            email: email || undefined, 
            role,
            enabled: enabled !== undefined ? enabled : true
        });

        logger.info(`New user created: ${newUser.id} (${newUser.role}) by Admin.`);
        const { password: _, ...safeUser } = newUser.toObject(); 
        res.status(201).json({ success: true, message: 'User created successfully.', user: safeUser });
    } catch (error) {
        logger.error('Create User Error - Database detail:', error); 
        
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
        if (email) {
            const existingEmailUser = await User.findOne({ email, id: { $ne: userId } });
            if (existingEmailUser) {
                  return res.status(409).json({ success: false, message: 'Email already in use by another account.' });
            }
            updateData.email = email;
        } else {
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
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email already in use by another account (DB Index Error).' });
        }
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
});


// --- ADMIN ROUTES (Menu Management) ---

/**
 * Endpoint 17: GET /api/menu (Fetch Menu)
 */
app.get('/api/menu', authorize(['admin', 'user', 'kitchen']), async (req, res) => {
    try {
        let menu = await Menu.findOne();
        if (!menu) {
            // Create default menu
            const defaultMenu = {
                categories: [
                    { name: 'Coffee', icon: 'FaCoffee', items: ["Black", "Milk", "Simple", "Cold"], color: '#8B4513' },
                    { name: 'Tea', icon: 'FaMugHot', items: ["Black", "Milk", "Green"], color: '#228B22' },
                    { name: 'Water', icon: 'FaTint', items: ["Warm", "Cold", "Hot", "Lemon"], color: '#87CEEB' },
                    { name: 'Shikanji', icon: 'FaLemon', items: ['normal'], color: '#FFD700' },
                    { name: 'Jaljeera', icon: 'FaCube', items: ['normal'], color: '#8B0000' },
                    { name: 'Soup', icon: 'FaUtensilSpoon', items: ['normal'], color: '#FFA500' },
                    { name: 'Maggie', icon: 'FaUtensilSpoon', items: ['normal'], color: '#FF6347' },
                    { name: 'Oats', icon: 'FaUtensilSpoon', items: ['normal'], color: '#D2691E' },
                ],
                addOns: [{ name: "Ginger", available: true }, { name: "Cloves", available: true }, { name: "Fennel Seeds", available: true }, { name: "Cardamom", available: true }, { name: "Cinnamon", available: true }],
                sugarLevels: [{ level: 0, available: true }, { level: 1, available: true }, { level: 2, available: true }, { level: 3, available: true }],
                itemImages: {
                    tea: 'https://tmdone-cdn.s3.me-south-1.amazonaws.com/store-covers/133003776906429295.jpg',
                    coffee: 'https://i.pinimg.com/474x/7a/29/df/7a29dfc903d98c6ba13b687ef1fa1d1a.jpg',
                    water: 'https://images.stockcake.com/public/d/f/f/dffca756-1b7f-4366-8b89-4ad6f9bbf88a_large/chilled-water-glass-stockcake.jpg',
                    shikanji: 'https://i.pinimg.com/736x/1f/fd/08/1ffd086ffef72a98f234162a312cfe39.jpg',
                    jaljeera: 'https://i.ndtvimg.com/i/2018-02/jaljeera_620x330_81517570928.jpg',
                    soup: 'https://www.inspiredtaste.net/wp-content/uploads/2018/10/Homemade-Vegetable-Soup-Recipe-2-1200.jpg',
                    maggie: 'https://i.pinimg.com/736x/5c/6d/9f/5c6d9fe78de73a7698948e011d6745f1.jpg',
                    oats: 'https://images.moneycontrol.com/static-mcnews/2024/08/20240827041559_oats.jpg?impolicy=website&width=1600&height=900',
                }
            };
            menu = await Menu.create(defaultMenu);
            console.log('🍽️ Default menu created on demand.');
        } else {
            // Ensure itemImages are present
            if (!menu.itemImages) {
                menu.itemImages = {
                    tea: 'https://tmdone-cdn.s3.me-south-1.amazonaws.com/store-covers/133003776906429295.jpg',
                    coffee: 'https://i.pinimg.com/474x/7a/29/df/7a29dfc903d98c6ba13b687ef1fa1d1a.jpg',
                    water: 'https://images.stockcake.com/public/d/f/f/dffca756-1b7f-4366-8b89-4ad6f9bbf88a_large/chilled-water-glass-stockcake.jpg',
                    shikanji: 'https://i.pinimg.com/736x/1f/fd/08/1ffd086ffef72a98f234162a312cfe39.jpg',
                    jaljeera: 'https://i.ndtvimg.com/i/2018-02/jaljeera_620x330_81517570928.jpg',
                    soup: 'https://www.inspiredtaste.net/wp-content/uploads/2018/10/Homemade-Vegetable-Soup-Recipe-2-1200.jpg',
                    maggie: 'https://i.pinimg.com/736x/5c/6d/9f/5c6d9fe78de73a7698948e011d6745f1.jpg',
                    oats: 'https://images.moneycontrol.com/static-mcnews/2024/08/20240827041559_oats.jpg?impolicy=website&width=1600&height=900',
                };
                await menu.save();
                console.log('🍽️ Menu updated with itemImages.');
            }
        }
        res.json(menu);
    } catch (error) {
        logger.error('Fetch Menu Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching menu.' });
    }
});

/**
 * Endpoint 18: PUT /api/menu (Admin/Kitchen: Update Menu)
 */
app.put('/api/menu', authorize(['admin', 'kitchen']), async (req, res) => {
    const { categories, addOns, sugarLevels, itemImages } = req.body;

    try {
        const updatedMenu = await Menu.findOneAndUpdate(
            {},
            { categories, addOns, sugarLevels, itemImages },
            { new: true, upsert: true }
        );

        logger.info(`Menu updated by Admin.`);
        res.json({ success: true, message: 'Menu updated successfully.', menu: updatedMenu });
    } catch (error) {
        logger.error('Update Menu Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating menu.' });
    }
});

// --- ADMIN ROUTES (Location Management) ---

/**
 * Endpoint 19: GET /api/locations (Fetch Locations)
 */
app.get('/api/locations', authorize(['admin', 'user', 'kitchen']), async (req, res) => {
    try {
        let locations = await Location.find().sort({ id: 1 });
        if (locations.length === 0) {
            // Create default locations
            const defaultLocations = [
                { id: 1, name: 'Ajay', location: 'Seat_7', access: 'Confrence' },
                { id: 2, name: 'Tannu', location: 'Seat_8', access: 'Own seat' },
                { id: 3, name: 'Lovekush', location: 'Seat_6', access: 'Own seat' },
                { id: 4, name: 'Ansh', location: 'Seat_5', access: 'Own seat' },
                { id: 5, name: 'Vanshika', location: 'Seat_4', access: 'Own seat' },
                { id: 6, name: 'Sonu', location: 'Seat_3', access: 'Confrence' },
                { id: 7, name: 'Khushi', location: 'Seat_15', access: 'Confrence' },
                { id: 8, name: 'Sneha', location: 'Reception', access: 'Own seat' },
                { id: 9, name: 'Muskan', location: 'Seat_11', access: 'Own seat' },
                { id: 10, name: 'Nikita', location: 'Seat_16', access: 'Own seat' },
                { id: 11, name: 'Saloni', location: 'Seat_14', access: 'Own seat' },
                { id: 12, name: 'Babita', location: 'Reception', access: 'Own seat' },
                { id: 13, name: 'Monu', location: 'Seat_1', access: 'Own seat' },
                { id: 14, name: 'Sourabh', location: 'Seat_2', access: 'Own seat' },
                { id: 15, name: 'Gurmeet', location: 'Maven_Area', access: 'Confrence' },
                { id: 16, name: 'Sneha Lathwal', location: 'Maven_Area', access: 'Own seat' },
                { id: 17, name: 'Vanshika Jagga', location: 'Maven_Area', access: 'Own seat' },
                { id: 18, name: 'Nisha', location: 'Reception', access: 'Pod room/Confrence' },
                { id: 19, name: 'Suhana', location: 'Seat_10', access: 'All' },
                { id: 20, name: 'Ketan', location: 'Ketan_Cabin', access: 'All' },
                { id: 21, name: 'Bhavishya', location: 'Bhavishya_Cabin', access: 'All' },
                { id: 22, name: 'Satish', location: 'Seat_12', access: 'Own seat' },
                { id: 23, name: 'Sahil', location: 'Seat_20', access: 'Own seat/Confrence' },
                { id: 24, name: 'Diwakar', location: 'Diwakar_Sir_Cabin', access: 'All' },
                { id: 25, name: 'Sharma Sir', location: 'Sharma_Sir_Office', access: 'All' },
                { id: 26, name: 'Ritesh Sir', location: 'Ritesh_Sir_Cabin', access: 'All' },
            ];
            locations = await Location.insertMany(defaultLocations);
            console.log('📍 Default locations created on demand.');
        }
        res.json(locations);
    } catch (error) {
        logger.error('Fetch Locations Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching locations.' });
    }
});

/**
 * Endpoint 20: PUT /api/locations (Admin: Update Locations)
 */
app.put('/api/locations', authorize(['admin']), async (req, res) => {
    const { locations } = req.body;

    try {
        // Delete all existing locations
        await Location.deleteMany({});

        // Insert new locations
        const newLocations = await Location.insertMany(locations);

        logger.info(`Locations updated by Admin.`);
        res.json({ success: true, message: 'Locations updated successfully.', locations: newLocations });
    } catch (error) {
        logger.error('Update Locations Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating locations.' });
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Maven Cafe Backend Server running on port ${PORT}`);
    console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT} (or your local IP)`);
    console.log(`🔌 Connected to MongoDB URI: ${DB_URI ? DB_URI.substring(0, 30) : '...' }...`);
    console.log(`======================================================\n`);
});