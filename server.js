// server.js - Main server entry point (Refactored for scalability)

// Load environment variables
require('dotenv').config();

// Import configurations
const { createApp, getConfig } = require('./config/app');
const { connectDatabase } = require('./services/database');
const { initializeSocket } = require('./services/socket');

// Import routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users');
const menuRoutes = require('./routes/menu');
const feedbackRoutes = require('./routes/feedback');
const locationsRoutes = require('./routes/locations');
const chefCallsRoutes = require('./routes/chef-calls');
const notificationsRoutes = require('./routes/notifications');

// Create Express app
const app = createApp();
const config = getConfig();

// Create HTTP server
const server = require('http').createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect to database
connectDatabase();

// Register API routes
app.use('/api', authRoutes);
app.use('/api', ordersRoutes);
app.use('/api', usersRoutes);
app.use('/api', menuRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', locationsRoutes);
app.use('/api', chefCallsRoutes);
app.use('/api', notificationsRoutes);

// Sync chef calls between routes and socket service
if (chefCallsRoutes.getChefCalls) {
    io.setChefCalls(chefCallsRoutes.getChefCalls());
}

// Pass Socket.IO instance to chef-calls route for instant notifications
if (chefCallsRoutes.setIO) {
    chefCallsRoutes.setIO(io);
}

// Pass notifications route to chef-calls for FCM push notifications
if (chefCallsRoutes.setNotificationsRoute) {
    chefCallsRoutes.setNotificationsRoute(notificationsRoutes);
}

// Pass Socket.IO and notifications to orders route for real-time updates
if (ordersRoutes.setIO) {
    ordersRoutes.setIO(io);
}
if (ordersRoutes.setNotificationsRoute) {
    ordersRoutes.setNotificationsRoute(notificationsRoutes);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server
const PORT = config.port;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Maven Cafe Backend Server running on port ${PORT}`);
    console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT} (or your local IP)`);
    console.log(`🔌 Socket.IO enabled for real-time communication`);
    console.log(`🔌 Connected to MongoDB URI: ${config.dbUri ? config.dbUri.substring(0, 30) : '...' }...`);
    console.log(`📁 Modular architecture: routes, services, config separated`);
    console.log(`======================================================\n`);
});