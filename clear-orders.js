// clear-orders.js - Script to clear all orders from the database

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

const DB_URI = process.env.DB_URI;

async function clearOrders() {
    try {
        await mongoose.connect(DB_URI);
        console.log('✅ Connected to MongoDB');

        const result = await Order.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} orders`);

        console.log('✅ Orders cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

clearOrders();