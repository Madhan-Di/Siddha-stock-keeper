require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));

const seedAdmin = async () => {
    const exists = await User.findOne({ username: 'admin' });
    if (!exists) {
        await User.create({
            username: 'admin',
            password: 'admin',
            role: 'admin'
        });
        console.log('✅ Default admin created (admin/admin)');
    }
};

const startServer = async () => {
    try {
        await connectDB();      // connect database
        await seedAdmin();      // seed admin

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error(error);
    }
};

startServer();