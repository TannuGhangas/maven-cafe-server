const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.DB_URI;

async function clearDatabase() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const collections = ['users', 'menus', 'orders', 'feedbacks', 'locations'];

        for (const collection of collections) {
            try {
                const result = await mongoose.connection.db.collection(collection).deleteMany({});
                console.log(`Deleted ${result.deletedCount} documents from ${collection}`);
            } catch (error) {
                console.log(`Collection ${collection} does not exist or error: ${error.message}`);
            }
        }

        await mongoose.disconnect();
        console.log('Database cleared successfully');
    } catch (error) {
        console.error('Error clearing database:', error);
    }
}

clearDatabase();