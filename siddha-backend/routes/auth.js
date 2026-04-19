const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            user: {
                _id: user._id,
                username: user.username,
                role: user.role
            },
            token: 'demo-token-' + user._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
