// routes/locations.js - Location management routes

const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { authorize } = require('../middleware/auth');
const logger = require('winston');

/**
 * GET /locations (Fetch Locations)
 */
router.get('/locations', authorize(['admin', 'user', 'kitchen']), async (req, res) => {
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
        return res.status(500).json({ success: false, message: 'Server error fetching locations.' });
    }
});

/**
 * PUT /locations (Admin: Update Locations)
 */
router.put('/locations', authorize(['admin']), async (req, res) => {
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

module.exports = router;