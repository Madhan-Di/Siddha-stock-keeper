const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity_available: { type: Number, required: true, default: 0 },
    last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stock', stockSchema);
