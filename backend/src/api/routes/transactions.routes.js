const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateToken } = require('../../middleware/auth.middleware');

// POST /api/transactions/stock-in - Add stock to an existing item (Admin only)
router.post('/stock-in', authenticateToken, async (req, res) => {
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
router.get('/', authenticateToken, async (req, res) => {
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

// --- HELPER FUNCTION FOR TRANSACTIONS ---
const executeTransaction = async (res, { itemId, userId, quantity, type, details }) => {
    const quantityChange = type === 'DISTRIBUTION' ? -Math.abs(quantity) : Math.abs(quantity);

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Check for sufficient stock before distribution
        if (type === 'DISTRIBUTION') {
            const stockCheck = await client.query('SELECT current_quantity FROM items WHERE id = $1 FOR UPDATE', [itemId]);
            if (stockCheck.rows.length === 0) throw new Error('Item not found.');
            if (stockCheck.rows[0].current_quantity < Math.abs(quantityChange)) {
                throw new Error('Insufficient stock for distribution.');
            }
        }

        // 1. Update the item's quantity
        const updateQuery = 'UPDATE items SET current_quantity = current_quantity + $1 WHERE id = $2 RETURNING *';
        const updatedItem = await client.query(updateQuery, [quantityChange, itemId]);
        if (updatedItem.rows.length === 0 && type !== 'DISTRIBUTION') throw new Error('Item not found.');

        // 2. Create the transaction log
        const logQuery = 'INSERT INTO transactions (item_id, user_id, transaction_type, quantity_change, details) VALUES ($1, $2, $3, $4, $5)';
        await client.query(logQuery, [itemId, userId, type, quantityChange, details]);

        await client.query('COMMIT');
        res.status(200).json(updatedItem.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Transaction failed for type ${type}:`, error);
        res.status(error.message.includes('Insufficient stock') ? 409 : 500).json({ message: error.message || 'Server error during transaction.' });
    } finally {
        client.release();
    }
};

// POST /api/transactions/distribute - Office Boy distributes an item
router.post('/distribute', authenticateToken, async (req, res) => {
    // Note: We don't check for isAdmin here, any authenticated user can distribute
    const { itemId, quantity, details } = req.body;
    const userId = req.user.id;
    const quantityToDistribute = parseInt(quantity, 10);

    if (!itemId || !quantityToDistribute || quantityToDistribute <= 0) {
        return res.status(400).json({ message: 'Item ID and a valid positive quantity are required.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Check for sufficient stock and update the item's quantity in one atomic operation
        const updateQuery = `
            UPDATE items SET current_quantity = current_quantity - $1
            WHERE id = $2 AND current_quantity >= $1
            RETURNING *;
        `;
        const updatedItemResult = await client.query(updateQuery, [quantityToDistribute, itemId]);

        if (updatedItemResult.rows.length === 0) {
            // This means either the item doesn't exist or stock is insufficient
            throw new Error('Item not found or insufficient stock.');
        }

        // 2. Create the transaction log entry
        const logQuery = `
            INSERT INTO transactions (item_id, user_id, transaction_type, quantity_change, details)
            VALUES ($1, $2, 'DISTRIBUTION', $3, $4);
        `;
        // We store the negative value to represent a decrease
        await client.query(logQuery, [itemId, userId, -quantityToDistribute, details]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Item distributed successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: error.message || 'Server error during distribution.' });
    } finally {
        client.release();
    }
});

// POST /api/transactions/return - Office Boy processes a return
router.post('/return', authenticateToken, async (req, res) => {
    const { itemId, quantity, details } = req.body;
    const userId = req.user.id;
    const quantityToReturn = parseInt(quantity, 10);

    if (!itemId || !quantityToReturn || quantityToReturn <= 0) {
        return res.status(400).json({ message: 'Item ID and a valid positive quantity are required.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Update the item's quantity
        const updateQuery = `UPDATE items SET current_quantity = current_quantity + $1 WHERE id = $2`;
        await client.query(updateQuery, [quantityToReturn, itemId]);

        // 2. Create the transaction log entry
        const logQuery = `
            INSERT INTO transactions (item_id, user_id, transaction_type, quantity_change, details)
            VALUES ($1, $2, 'RETURN', $3, $4);
        `;
        await client.query(logQuery, [itemId, userId, quantityToReturn, details]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Item return processed successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error during return processing.' });
    } finally {
        client.release();
    }
});

module.exports = router;

db.getClient = () => db.pool.connect();