// routes/auth.js - Authentication routes

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const logger = require('winston');

/**
 * POST /login (User/Kitchen/Admin)
 */
router.post('/login', async (req, res) => {
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

module.exports = router;