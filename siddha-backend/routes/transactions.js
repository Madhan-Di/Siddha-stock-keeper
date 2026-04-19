const express = require('express');
const router = express.Router();
const StockTransaction = require('../models/StockTransaction');
const Stock = require('../models/stock');

// GET /api/transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await StockTransaction.find()
            .populate('medicine_id', 'medicine_name')
            .populate('user_id', 'username')
            .sort({ date: -1 });
        
        // Transform to include medicine_name and username at root level
        const formatted = transactions.map(t => ({
            _id: t._id,
            medicine_id: t.medicine_id?._id || t.medicine_id,
            medicine_name: t.medicine_id?.medicine_name || 'Unknown Medicine',
            type: t.type,
            quantity: t.quantity,
            user_id: t.user_id?._id || t.user_id,
            username: t.user_id?.username || 'Unknown User',
            remarks: t.remarks,
            date: t.date.toISOString().split('T')[0]
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/transactions
router.post('/', async (req, res) => {
    try {
        const { medicine_id, type, quantity, user_id, remarks } = req.body;
        
        // Find or create stock entry
        let stock = await Stock.findOne({ medicine_id });
        if (!stock) {
            stock = new Stock({ medicine_id, quantity_available: 0 });
        }

        // Update stock quantity
        if (type === 'IN') {
            stock.quantity_available += quantity;
        } else if (type === 'OUT') {
            if (stock.quantity_available < quantity) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
            stock.quantity_available -= quantity;
        }
        
        stock.last_updated = new Date();
        await stock.save();

        // Create transaction
        const transaction = new StockTransaction(req.body);
        await transaction.save();
        
        // Populate and format response
        await transaction.populate('medicine_id', 'medicine_name');
        
        // Try to populate user, but handle if user doesn't exist
        try {
            await transaction.populate('user_id', 'username');
        } catch (err) {
            // If user doesn't exist, use the username from request body
        }
        
        const formatted = {
            _id: transaction._id,
            medicine_id: transaction.medicine_id._id,
            medicine_name: transaction.medicine_id.medicine_name,
            type: transaction.type,
            quantity: transaction.quantity,
            user_id: transaction.user_id?._id || transaction.user_id,
            username: transaction.user_id?.username || req.body.username || 'Unknown',
            remarks: transaction.remarks,
            date: transaction.date.toISOString().split('T')[0]
        };
        
        res.status(201).json(formatted);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
