const express = require('express');
const router = express.Router();
const Stock = require('../models/stock');

// GET /api/stock
router.get('/', async (req, res) => {
    try {
        const stocks = await Stock.find().populate('medicine_id');
        // Format response to match frontend expectations
        const formatted = stocks.map(s => ({
            _id: s._id,
            medicine_id: s.medicine_id._id,
            quantity_available: s.quantity_available,
            last_updated: s.last_updated.toISOString().split('T')[0]
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/stock
router.post('/', async (req, res) => {
    try {
        const stock = new Stock(req.body);
        await stock.save();
        res.status(201).json(stock);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
