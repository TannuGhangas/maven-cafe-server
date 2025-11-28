// models/Menu.js

const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    categories: [{
        name: { type: String, required: true },
        icon: { type: String },
        items: [String],
        color: { type: String },
        image: { type: String }
    }],
    addOns: [String],
    sugarLevels: [Number],
    itemImages: {
        type: Map,
        of: String
    }
});

module.exports = mongoose.model('Menu', menuSchema);