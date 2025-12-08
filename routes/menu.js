// routes/menu.js - Menu management routes

const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const { authorize } = require('../middleware/auth');
const logger = require('winston');

/**
 * GET /menu (Fetch Menu)
 */
router.get('/menu', authorize(['admin', 'user', 'kitchen']), async (req, res) => {
    try {
        let menu = await Menu.findOne();
        if (!menu) {
            // Create default menu
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
            menu = await Menu.create(defaultMenu);
            console.log('🍽️ Default menu created on demand.');
        } else {
            // Normalize addOns and sugarLevels to objects
            if (menu.addOns && Array.isArray(menu.addOns)) {
                menu.addOns = menu.addOns.map(addOn => {
                    if (typeof addOn === 'string') {
                        return { name: addOn, available: true };
                    }
                    return addOn;
                });
            } else {
                menu.addOns = [{ name: "Ginger", available: true }, { name: "Salt", available: true }];
            }

            if (menu.sugarLevels && Array.isArray(menu.sugarLevels)) {
                menu.sugarLevels = menu.sugarLevels.map(level => {
                    if (typeof level === 'number') {
                        return { level: level, available: true };
                    }
                    return level;
                });
            } else {
                menu.sugarLevels = [{ level: 0, available: true }, { level: 1, available: true }, { level: 2, available: true }, { level: 3, available: true }];
            }

            // Ensure itemImages are present
            if (!menu.itemImages) {
                menu.itemImages = {
                    tea: 'https://tmdone-cdn.s3.me-south-1.amazonaws.com/store-covers/133003776906429295.jpg',
                    coffee: 'https://i.pinimg.com/474x/7a/29/df/7a29dfc903d98c6ba13b687ef1fa1d1a.jpg',
                    water: 'https://images.stockcake.com/public/d/f/f/dffca756-1b7f-4366-8b89-4ad6f9bbf88a_large/chilled-water-glass-stockcake.jpg',
                };
            }
            await menu.save();
        }
        res.json(menu);
    } catch (error) {
        logger.error('Fetch Menu Error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching menu.' });
    }
});

/**
 * PUT /menu (Admin/Kitchen: Update Menu)
 */
router.put('/menu', authorize(['admin', 'kitchen']), async (req, res) => {
    const { categories, addOns, sugarLevels, itemImages } = req.body;

    // Normalize addOns and sugarLevels
    const normalizedAddOns = (addOns || []).map(addOn => {
        if (typeof addOn === 'string') {
            return { name: addOn, available: true };
        }
        return addOn;
    });

    const normalizedSugarLevels = (sugarLevels || []).map(level => {
        if (typeof level === 'number') {
            return { level: level, available: true };
        }
        return level;
    });

    try {
        const updatedMenu = await Menu.findOneAndUpdate(
            {},
            { categories, addOns: normalizedAddOns, sugarLevels: normalizedSugarLevels, itemImages },
            { new: true, upsert: true }
        );

        logger.info(`Menu updated by Admin.`);
        res.json({ success: true, message: 'Menu updated successfully.', menu: updatedMenu });
    } catch (error) {
        logger.error('Update Menu Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating menu.' });
    }
});

module.exports = router;