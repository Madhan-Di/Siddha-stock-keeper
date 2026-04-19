const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    medicine_name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    description: { type: String, default: '' },
    low_stock_limit: { type: Number, default: 10 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medicine', medicineSchema);
