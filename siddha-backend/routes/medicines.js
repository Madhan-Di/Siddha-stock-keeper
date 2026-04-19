const express = require('express');
const router = express.Router();
const Medicine = require('../models/medicine');
const Stock = require('../models/stock');

// GET /api/medicines
router.get('/', async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/medicines
router.post('/', async (req, res) => {
    try {
        const medicine = new Medicine(req.body);
        await medicine.save();
        
        // Create initial stock entry
        const stock = new Stock({
            medicine_id: medicine._id,
            quantity_available: 0
        });
        await stock.save();
        
        res.status(201).json(medicine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT /api/medicines/:id
router.put('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndDelete(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        // Also delete associated stock
        await Stock.deleteOne({ medicine_id: req.params.id });
        res.json({ message: 'Medicine deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
