// models/Location.js

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    access: { type: String, required: true }
});

module.exports = mongoose.model('Location', locationSchema);