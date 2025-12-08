// services/seeding.js - Database seeding service

const User = require('../models/User');
const Menu = require('../models/Menu');
const Location = require('../models/Location');
const { logger } = require('../middleware/logger');

/**
 * Seed default users
 */
const seedUsers = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            let currentUserId = 101;

            await User.insertMany([
                { id: currentUserId++, username: 'admin', password: 'adminpassword', name: 'Super Admin', role: 'admin', enabled: true },
                { id: currentUserId++, username: 'kitchen', password: 'kitchenpassword', name: 'Kitchen Manager', role: 'kitchen', enabled: true },
                { id: currentUserId++, username: 'Tannu', password: '123', name: 'Tannu', role: 'admin', enabled: true },
            ]);
            logger.info('🌱 Initial users inserted (Admin, Kitchen, Users).');
            return true;
        }
        logger.info('👥 Users already exist, skipping user seeding.');
        return false;
    } catch (error) {
        logger.error('❌ User seeding error:', error);
        throw error;
    }
};

/**
 * Seed default menu
 */
const seedMenu = async () => {
    try {
        const defaultMenu = {
            categories: [
                { name: 'Coffee', icon: 'FaCoffee', items: [{ name: "Black", available: true }, { name: "Milk", available: true }, { name: "Simple", available: true }, { name: "Cold", available: true }], color: '#8B4513', enabled: true },
                { name: 'Tea', icon: 'FaMugHot', items: [{ name: "Black", available: true }, { name: "Milk", available: true }, { name: "Green", available: true }], color: '#228B22', enabled: true },
                { name: 'Water', icon: 'FaTint', items: [{ name: "Warm", available: true }, { name: "Cold", available: true }, { name: "Hot", available: true }, { name: "Lemon", available: true }], color: '#87CEEB', enabled: true },
            ],
            addOns: [{ name: "Ginger", available: true }, { name: "Salt", available: true }],
            sugarLevels: [{ level: 0, available: true }, { level: 1, available: true }, { level: 2, available: true }, { level: 3, available: true }],
            itemImages: {
                tea: 'https://tmdone-cdn.s3.me-south-1.amazonaws.com/store-covers/133003776906429295.jpg',
                coffee: 'https://i.pinimg.com/474x/7a/29/df/7a29dfc903d98c6ba13b687ef1fa1d1a.jpg',
                water: 'https://images.stockcake.com/public/d/f/f/dffca756-1b7f-4366-8b89-4ad6f9bbf88a_large/chilled-water-glass-stockcake.jpg',
            }
        };

        const existingMenu = await Menu.findOne();
        if (!existingMenu) {
            await Menu.create(defaultMenu);
            logger.info('🍽️ Default menu inserted.');
            return true;
        } else {
            // Update existing menu
            await Menu.findOneAndUpdate({}, defaultMenu, { upsert: true });
            logger.info('🍽️ Menu seeded/updated.');
            return false;
        }
    } catch (error) {
        logger.error('❌ Menu seeding error:', error);
        throw error;
    }
};

/**
 * Seed default locations
 */
const seedLocations = async () => {
    try {
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

        const existingLocations = await Location.findOne();
        if (!existingLocations) {
            await Location.insertMany(defaultLocations);
            logger.info('📍 Default locations inserted.');
            return true;
        } else {
            logger.info('📍 Locations already exist, skipping location seeding.');
            return false;
        }
    } catch (error) {
        logger.error('❌ Location seeding error:', error);
        throw error;
    }
};

/**
 * Run all seeding operations
 */
const seedDatabase = async () => {
    try {
        logger.info('🌱 Starting database seeding...');
        
        const results = {
            users: await seedUsers(),
            menu: await seedMenu(),
            locations: await seedLocations()
        };
        
        logger.info('✅ Database seeding completed:', results);
        return results;
    } catch (error) {
        logger.error('❌ Database Seeding Failed:', error);
        throw error;
    }
};

module.exports = {
    seedDatabase,
    seedUsers,
    seedMenu,
    seedLocations
};