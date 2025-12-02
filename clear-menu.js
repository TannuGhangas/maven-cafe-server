const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.DB_URI;

async function clearMenu() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const result = await mongoose.connection.db.collection('menus').deleteMany({});
        console.log(`Deleted ${result.deletedCount} menu documents`);

        await mongoose.disconnect();
        console.log('Menu collection cleared successfully');
    } catch (error) {
        console.error('Error clearing menu:', error);
    }
}

clearMenu();