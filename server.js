// -----------------------------------------------------------
// server.js - Main Server Entry (Production Ready)
// -----------------------------------------------------------

// Load environment variables
require("dotenv").config();

// Logger
const logger = require("./utils/logger");

// Import core app config
const { createApp, getConfig } = require("./config/app");
const { connectDatabase } = require("./services/database");
const { initializeSocket } = require("./services/socket");

// Import routes
const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const usersRoutes = require("./routes/users");
const menuRoutes = require("./routes/menu");
const feedbackRoutes = require("./routes/feedback");
const locationsRoutes = require("./routes/locations");
const chefCallsRoutes = require("./routes/chef-calls");
const notificationsRoutes = require("./routes/notifications");

// -----------------------------------------------------------
// Create Express app
// -----------------------------------------------------------
const app = createApp();
const config = getConfig();

// HTTP Server
const http = require("http");
const server = http.createServer(app);

// -----------------------------------------------------------
// Initialize Socket.IO
// -----------------------------------------------------------
let io;
try {
  io = initializeSocket(server);
  logger.info("🔌 Socket.IO initialized successfully");
} catch (err) {
  logger.error("❌ Failed to initialize Socket.IO", err);
}

// -----------------------------------------------------------
// Connect to Database
// -----------------------------------------------------------
connectDatabase()
  .then(() => logger.info("🟢 MongoDB connected successfully"))
  .catch((err) => logger.error("🔴 MongoDB connection failed", err));

// -----------------------------------------------------------
// Register API Routes
// -----------------------------------------------------------
app.use("/api", authRoutes);
app.use("/api", ordersRoutes);
app.use("/api", usersRoutes);
app.use("/api", menuRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", locationsRoutes);
app.use("/api", chefCallsRoutes);
app.use("/api", notificationsRoutes);

// -----------------------------------------------------------
// Route + Socket Link Integration
// -----------------------------------------------------------

// For chef-calls route
if (chefCallsRoutes.getChefCalls && io.setChefCalls) {
  io.setChefCalls(chefCallsRoutes.getChefCalls());
}

if (chefCallsRoutes.setIO) {
  chefCallsRoutes.setIO(io);
}

if (chefCallsRoutes.setNotificationsRoute) {
  chefCallsRoutes.setNotificationsRoute(notificationsRoutes);
}

// For orders route (instant updates)
if (ordersRoutes.setIO) {
  ordersRoutes.setIO(io);
}

if (ordersRoutes.setNotificationsRoute) {
  ordersRoutes.setNotificationsRoute(notificationsRoutes);
}

// -----------------------------------------------------------
// Health Check Endpoint
// -----------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// -----------------------------------------------------------
// Start Server
// -----------------------------------------------------------
const PORT = config.port || 5000;

server.listen(PORT, "0.0.0.0", () => {
  logger.info("======================================================");
  logger.info(`🚀 Maven Cafe Server running on port ${PORT}`);
  logger.info(`🌐 Accessible at http://0.0.0.0:${PORT}`);
  logger.info(`🔌 Socket.IO Enabled`);
  logger.info(
    `🗄️ MongoDB URI: ${
      config.dbUri ? config.dbUri.substring(0, 35) : "NOT SET"
    }...`
  );
  logger.info("📁 Modular Architecture Loaded");
  logger.info("======================================================");
});
