const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    userId: { 
        type: Number, 
        required: true, 
        // Best practice: Reference the Mongoose model string
        ref: 'User' 
    },
    userName: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        required: true, 
        // FIX: Enum array updated to match frontend options
        enum: [
            'Order Issue',
            'Food/Drink Quality',
            'Service/Staff Feedback',
            'Website/App Issue',
            'Other Feedback'
        ]
    },
    details: { 
        type: String, 
        required: true 
    },
    orderReference: { // Optional: Link to a specific order ID or reference
        type: String, 
        required: false 
    },
    location: { // Stored to give context for delivery issues
        type: String, 
        required: true // Making location required as per the client form's 'required' attribute
    },
    status: {
        type: String,
        enum: ['New', 'In Progress', 'Resolved'],
        default: 'New'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);