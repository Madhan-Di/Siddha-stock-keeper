const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, default: '' },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StockTransaction', transactionSchema);