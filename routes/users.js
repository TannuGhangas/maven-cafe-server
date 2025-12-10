// routes/users.js - User management routes

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const logger = require('winston');

/**
 * GET /users (Admin: Fetch All Users)
 */
router.get('/users', authorize(['admin']), async (req, res) => {
    try {
        const usersList = await User.find({}).select('-password'); 
        res.json(usersList);
    } catch (error) {
        logger.error('Fetch Users Error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching users.' });
    }
});

/**
 * POST /users (Admin: Add New User)
 */
router.post('/users', authorize(['admin']), async (req, res) => {
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
 * PUT /users/:userId/role (Admin: Change Role)
 */
router.put('/users/:userId/role', authorize(['admin']), async (req, res) => {
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
 * PUT /users/:userId/access (Admin: Enable/Disable User)
 */
router.put('/users/:userId/access', authorize(['admin']), async (req, res) => {
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
 * DELETE /users/:userId (Admin: Delete User)
 */
router.delete('/users/:userId', authorize(['admin']), async (req, res) => {
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
 * GET /user/:userId (Fetch User details for Profile)
 */
router.get('/user/:userId', authorize(['user', 'kitchen', 'admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const user = await User.findOne({ id: userId }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json(user);
    } catch (error) {
        logger.error('Fetch User Details Error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching user details.' });
    }
});

/**
 * PUT /user/:userId (Update User details for Profile)
 */
router.put('/user/:userId', authorize(['user', 'kitchen', 'admin']), async (req, res) => {
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

/**
 * PUT /user/:userId/profile-image (Update Profile Image)
 */
router.put('/user/:userId/profile-image', authorize(['user', 'kitchen', 'admin']), async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { profileImage, avatar } = req.body;

    if (!profileImage && !avatar) {
        return res.status(400).json({ success: false, message: 'Profile image or avatar URL is required.' });
    }

    const updateData = {};
    if (profileImage) updateData.profileImage = profileImage;
    if (avatar) updateData.avatar = avatar;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found.' });

        logger.info(`User ${userId} updated profile image.`);
        res.json({ 
            success: true, 
            message: 'Profile image updated successfully.', 
            user: updatedUser.toObject(),
            profileImage: updatedUser.profileImage || updatedUser.avatar
        });
    } catch (error) {
        logger.error('Update Profile Image Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile image.' });
    }
});

/**
 * POST /profile-image-update (Broadcast profile image update to kitchen)
 * This endpoint is called when a user updates their profile image to notify all kitchen clients
 */
router.post('/profile-image-update', authorize(['user', 'admin']), async (req, res) => {
    const { userId, userName, profileImage, action } = req.body;
    
    if (!userId || !userName) {
        return res.status(400).json({ success: false, message: 'User ID and name are required.' });
    }
    
    try {
        // Broadcast to all connected kitchen clients
        if (io) {
            const updateData = {
                userId,
                userName,
                profileImage: profileImage || null,
                action: action || 'updated',
                timestamp: Date.now()
            };
            
            io.emit('profile-image-updated', updateData);
            logger.info(`Profile image update broadcasted for user ${userName} (${userId})`);
        } else {
            logger.warn('Socket.IO instance not available for profile image update broadcast');
        }
        
        res.json({
            success: true,
            message: 'Profile image update broadcasted successfully.',
            updateData: {
                userId,
                userName,
                action: action || 'updated'
            }
        });
    } catch (error) {
        logger.error('Profile Image Update Broadcast Error:', error);
        return res.status(500).json({ success: false, message: 'Server error broadcasting profile image update.' });
    }
});

module.exports = router;