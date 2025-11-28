// models/Order.js

const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    // 1. UPDATED: Expanded the item enum to match frontend configuration logic (including Maggie, Shikanji, Jaljeera)
    item: {
        type: String,
        required: true,
        enum: ['coffee', 'tea', 'water', 'shikanji', 'jaljeera', 'maggie', 'soup', 'oats']
    },
    type: { type: String, required: false }, // e.g., 'Black Coffee', 'Masala Tea', 'Hot Milk'
    
    // 2. UPDATED: Changed from Number to String to accommodate both numeric values ('0', '1', '2') and 'None'.
    sugarLevel: { type: String, required: false }, 
    
    // 3. NEW FIELD: Added to store selected spice/add-ons from the config page.
    selectedAddOns: { type: [String], required: false, default: [] }, // e.g., ['Ginger', 'Cardamom']
    
    quantity: { type: Number, required: true, default: 1 },
    location: { type: String, required: true }, // General location (e.g., 'Sharma Sir Cabin')
    tableNo: { type: Number, required: false }, // 1-25 if needed
    customLocation: { type: String, required: false }, // If 'others' is selected
    notes: { type: String, required: false }, // Special needs/preferences
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    userId: { type: Number, required: true, ref: 'User' },
    userName: { type: String, required: true },
    slot: { type: String, required: true, enum: ['morning (9:00-12:00)', 'afternoon (1:00 - 5:30)'] },
    items: [OrderItemSchema],
    status: {
        type: String,
        enum: ['Placed', 'Making', 'Ready', 'Delivered'],
        default: 'Placed'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);