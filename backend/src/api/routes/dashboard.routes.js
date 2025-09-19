const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateToken, isAdmin } = require('../../middleware/auth.middleware');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // These variables hold the promises for the database queries
        const totalItemsQuery = db.query('SELECT SUM(current_quantity) as total_stock FROM items');
        const lowStockItemsQuery = db.query('SELECT COUNT(*) FROM items WHERE current_quantity < low_stock_threshold');
        const distinctItemsQuery = db.query('SELECT COUNT(*) FROM items');
        const categoriesQuery = db.query('SELECT COUNT(*) FROM categories');

        // We wait for all promises to resolve here
        const [
            totalItemsResult,
            lowStockItemsResult,
            distinctItemsResult,
            categoriesResult
        ] = await Promise.all([
            totalItemsQuery,
            lowStockItemsQuery,
            distinctItemsQuery, // <-- FIX: Changed from distinctItemsResult to distinctItemsQuery
            categoriesQuery
        ]);

        // Now we can safely use the '...Result' variables
        const stats = {
            totalStockCount: parseInt(totalItemsResult.rows[0].total_stock || 0),
            lowStockItemCount: parseInt(lowStockItemsResult.rows[0].count),
            distinctItemCount: parseInt(distinctItemsResult.rows[0].count),
            categoryCount: parseInt(categoriesResult.rows[0].count),
        };

        res.json(stats);

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats.' });
    }
});

// GET /api/dashboard/recent-activity (More focused on distributions)
router.get('/recent-activity', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT t.id, t.transaction_type, t.quantity_change, t.created_at, i.name as item_name, u.full_name as user_name, t.details
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            JOIN users u ON t.user_id = u.id
            WHERE t.transaction_type IN ('DISTRIBUTION', 'RETURN')
            ORDER BY t.created_at DESC
            LIMIT 7;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching recent activity' });
    }
});

// GET /api/dashboard/stock-by-category
router.get('/stock-by-category', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT c.name, COUNT(i.id) as item_count
            FROM items i
            JOIN categories c ON i.category_id = c.id
            GROUP BY c.name
            HAVING COUNT(i.id) > 0
            ORDER BY item_count DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching stock by category' });
    }
});

// GET /api/dashboard/distribution-trends
router.get('/distribution-trends', authenticateToken, isAdmin, async (req, res) => {
    try {
        // This query works for PostgreSQL
        const query = `
            SELECT 
                date_series.day::date AS distribution_date,
                COALESCE(SUM(ABS(t.quantity_change)), 0) AS total_distributed
            FROM 
                (SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) AS day) AS date_series
            LEFT JOIN 
                transactions t ON t.created_at::date = date_series.day::date AND t.transaction_type = 'DISTRIBUTION'
            GROUP BY 
                date_series.day
            ORDER BY 
                date_series.day ASC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching distribution trends' });
    }
});

// GET /api/dashboard/low-stock-items
router.get('/low-stock-items', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT id, name, sku, current_quantity, low_stock_threshold
            FROM items
            WHERE current_quantity <= low_stock_threshold
            ORDER BY current_quantity ASC;
            
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching low stock items' });
    }
});

module.exports = router;