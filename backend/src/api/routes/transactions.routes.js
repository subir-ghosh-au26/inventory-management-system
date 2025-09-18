const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateToken, isAdmin } = require('../../middleware/auth.middleware');

// POST /api/transactions/stock-in - Add stock to an existing item (Admin only)
router.post('/stock-in', authenticateToken, isAdmin, async (req, res) => {
    const { itemId, quantity, details } = req.body;
    const userId = req.user.id;
    const quantityToAdd = parseInt(quantity, 10);

    if (!itemId || !quantityToAdd || quantityToAdd <= 0) {
        return res.status(400).json({ message: 'Item ID and a valid positive quantity are required.' });
    }

    // We use a client from the pool to run multiple queries in a transaction
    const client = await db.getClient();

    try {
        // Start a database transaction
        await client.query('BEGIN');

        // 1. Update the item's quantity
        const updateItemQuery = `
            UPDATE items
            SET current_quantity = current_quantity + $1
            WHERE id = $2
            RETURNING *;
        `;
        const updatedItem = await client.query(updateItemQuery, [quantityToAdd, itemId]);

        if (updatedItem.rows.length === 0) {
            throw new Error('Item not found.');
        }

        // 2. Create a transaction log entry
        const createTransactionQuery = `
            INSERT INTO transactions (item_id, user_id, transaction_type, quantity_change, details)
            VALUES ($1, $2, 'STOCK_IN', $3, $4);
        `;
        await client.query(createTransactionQuery, [itemId, userId, quantityToAdd, details]);

        // If both queries succeed, commit the transaction
        await client.query('COMMIT');

        res.status(200).json(updatedItem.rows[0]);

    } catch (error) {
        // If any query fails, roll back the entire transaction
        await client.query('ROLLBACK');
        console.error('Stock-in transaction failed:', error);
        res.status(500).json({ message: error.message || 'Server error during stock-in.' });
    } finally {
        // Release the client back to the pool
        client.release();
    }
});

// GET /api/transactions - Get a log of all transactions
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    const { page = 1, limit = 15, type, itemId } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    const params = [limit, offset];
    let paramIndex = 3;

    if (type) {
        whereClauses.push(`t.transaction_type = $${paramIndex++}`);
        params.push(type);
    }
    if (itemId) {
        whereClauses.push(`t.item_id = $${paramIndex++}`);
        params.push(itemId);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const query = `
            SELECT 
                t.id, t.transaction_type, t.quantity_change, t.details, t.created_at,
                i.name as item_name,
                u.full_name as user_name
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            JOIN users u ON t.user_id = u.id
            ${whereString}
            ORDER BY t.created_at DESC
            LIMIT $1 OFFSET $2;
        `;
        const countQuery = `SELECT COUNT(*) FROM transactions t ${whereString}`;

        const [logResult, countResult] = await Promise.all([
            db.query(query, params),
            db.query(countQuery, params.slice(2)) // count query doesn't need limit/offset
        ]);

        res.json({
            logs: logResult.rows,
            totalItems: parseInt(countResult.rows[0].count, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
            currentPage: parseInt(page, 10),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching transaction log.' });
    }
});

module.exports = router;

db.getClient = () => db.pool.connect();