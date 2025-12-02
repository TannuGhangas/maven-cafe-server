// models/Menu.js

const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    categories: [{
        name: { type: String, required: true },
        icon: { type: String },
        items: [mongoose.Schema.Types.Mixed], // Allow strings or objects
        color: { type: String },
        image: { type: String },
        enabled: { type: Boolean, default: true }
    }],
    addOns: [mongoose.Schema.Types.Mixed], // Allow strings or objects
    sugarLevels: [mongoose.Schema.Types.Mixed], // Allow numbers or objects
    itemImages: {
        type: Map,
        of: String
    }
}, { strict: false });

module.exports = mongoose.model('Menu', menuSchema);