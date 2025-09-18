require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./api/routes/auth.routes');
const categoryRoutes = require('./api/routes/categories.routes');
const itemRoutes = require('./api/routes/items.routes');
const dashboardRoutes = require('./api/routes/dashboard.routes');
const userRoutes = require('./api/routes/users.routes');
const transactionRoutes = require('./api/routes/transactions.routes');
const reportRoute = require('./api/routes/reports.route')

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoute);

// Simple health check route
app.get('/', (req, res) => {
    res.send('Inventory Management System API is running!');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});