const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Simple settings schema
const settingsSchema = new mongoose.Schema({
    defaultLowStockLimit: { type: Number, default: 10 },
    autoBackup: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.model('Settings', settingsSchema);

// GET /api/settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/settings
router.put('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
            settings.updatedAt = new Date();
        }
        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
