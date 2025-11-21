// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: { // In production, this must be HASHED!
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: { // Added for completeness, unique index made sparse
        type: String,
        unique: true, 
        sparse: true // CRITICAL: This allows multiple users to omit the email field
    },
    role: {
        type: String,
        enum: ['user', 'kitchen', 'admin'],
        default: 'user'
    },
    enabled: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('User', UserSchema);