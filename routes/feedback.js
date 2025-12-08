// routes/feedback.js - Feedback/Complaint management routes

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { authorize } = require('../middleware/auth');
const logger = require('winston');

/**
 * POST /feedback (User: Submit Feedback/Complaint)
 */
router.post('/feedback', authorize(['user', 'admin', 'kitchen']), async (req, res) => {
    const { userId, userName, type, details, location, orderReference, status } = req.body;

    // The authorize middleware already verified userId and role.
    if (!userName || !type || !details || !location) { 
        return res.status(400).json({ success: false, message: 'Incomplete or invalid feedback data. Location is required.' });
    }

    try {
        const newFeedback = await Feedback.create({
            userId,
            userName,
            type,
            details,
            location: location || 'N/A', 
            orderReference: orderReference || 'N/A', 
            status: status || 'New', 
            timestamp: new Date()
        });

        logger.info(`New Feedback submitted: ${newFeedback._id} by ${userName} (Type: ${type})`);
        res.status(201).json({ success: true, message: 'Feedback submitted successfully.', feedback: newFeedback.toObject() });
    } catch (error) {
        logger.error('Feedback Submission Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during feedback submission.' });
    }
});

/**
 * GET /feedback (Kitchen/Admin: Fetch All Complaints)
 */
router.get('/feedback', authorize(['admin', 'kitchen']), async (req, res) => { 
    try {
        const complaints = await Feedback.find().sort({ timestamp: -1 });
        res.json(complaints);
    } catch (err) {
        logger.error('Fetch All Complaints Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching feedback' });
    }
});

/**
 * PUT /feedback/:id (Kitchen/Admin: Update Complaint Status)
 */
router.put('/feedback/:id', authorize(['admin', 'kitchen']), async (req, res) => { 
    const feedbackId = req.params.id;
    const { status } = req.body; 

    if (!['New', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    try {
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { status: status },
            { new: true }
        );

        if (!updatedFeedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found.' });
        }
        
        logger.info(`Feedback ${feedbackId} status updated to: ${status} by ${req.currentUser.name}`);
        res.json({ success: true, message: `Feedback status updated to ${status}.`, feedback: updatedFeedback });
    } catch (err) {
        logger.error('Update Complaint Status Error:', err);
        res.status(500).json({ success: false, message: 'Server error updating status' });
    }
});

module.exports = router;