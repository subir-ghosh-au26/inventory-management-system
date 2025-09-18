const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateToken, isAdmin } = require('../../middleware/auth.middleware');

// POST /api/items - Create a new item AND add its initial stock
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { sku, name, description, category_id, low_stock_threshold, unit_of_measurement, quantity } = req.body;
    const userId = req.user.id;
    const initialQuantity = parseInt(quantity, 10) || 0;

    if (!sku || !name || !unit_of_measurement || !category_id) {
        return res.status(400).json({ message: 'SKU, Name, Category, and Unit of Measurement are required.' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Create the item with the initial quantity
        const createItemQuery = `
            INSERT INTO items (sku, name, description, category_id, current_quantity, low_stock_threshold, unit_of_measurement)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const newItemResult = await client.query(createItemQuery,
            [sku, name, description, category_id, initialQuantity, low_stock_threshold, unit_of_measurement]
        );
        const newItem = newItemResult.rows[0];

        // 2. Create the initial 'STOCK_IN' transaction for the new item
        if (initialQuantity > 0) {
            const createTransactionQuery = `
                INSERT INTO transactions (item_id, user_id, transaction_type, quantity_change, details)
                VALUES ($1, $2, 'STOCK_IN', $3, $4);
            `;
            await client.query(createTransactionQuery, [newItem.id, userId, initialQuantity, { note: 'Initial stock' }]);
        }

        await client.query('COMMIT');
        res.status(201).json(newItem);

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'An item with this SKU already exists.' });
        }
        console.error('Error creating item with initial stock:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// GET /api/items - Get a list of all items (for any authenticated user)
// Optimization: Added pagination to handle large datasets
router.get('/', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { search } = req.query;

    let whereClause = '';
    const queryParams = [limit, offset];
    let paramIndex = 3;

    if (search) {
        // Use ILIKE for case-insensitive partial matching on both name and SKU
        whereClause = `WHERE (i.name ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
    }

    try {
        const itemsQuery = `
            SELECT i.*, c.name as category_name FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            ${whereClause}
            ORDER BY i.name ASC LIMIT $1 OFFSET $2
        `;
        const itemsResult = await db.query(itemsQuery, queryParams);

        const totalQuery = `SELECT COUNT(*) FROM items i ${whereClause}`;
        // For the count query, we only need the search param, not limit/offset
        const totalResult = await db.query(totalQuery, search ? [`%${search}%`] : []);

        const totalItems = parseInt(totalResult.rows[0].count, 10);

        res.json({
            items: itemsResult.rows,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            totalItems,
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// GET /api/items/by-sku/:sku - Get a single item by its SKU (for QR scan lookup)
router.get('/by-sku/:sku', authenticateToken, async (req, res) => {
    try {
        const { sku } = req.params;
        const result = await db.query('SELECT * FROM items WHERE sku = $1', [sku]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching item by SKU:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// PUT /api/items/:id - Update an existing item (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category_id, low_stock_threshold, unit_of_measurement } = req.body;

        const result = await db.query(
            `UPDATE items SET
             name = $1, description = $2, category_id = $3, low_stock_threshold = $4, unit_of_measurement = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [name, description, category_id, low_stock_threshold, unit_of_measurement, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found to update.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/items/:id - Update an existing item (Admin only)
// This was created before, just ensure it's complete.
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    // We do not allow updating SKU or current_quantity directly via this route.
    // SKU is a permanent identifier, and quantity is managed via transactions.
    const { name, description, category_id, low_stock_threshold, unit_of_measurement } = req.body;

    try {
        const result = await db.query(
            `UPDATE items SET
             name = $1, description = $2, category_id = $3, low_stock_threshold = $4, unit_of_measurement = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [name, description, category_id, low_stock_threshold, unit_of_measurement, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/items/:id - Delete an item (Admin only)
// Note: Deleting an item with existing transactions might be problematic due to foreign key constraints.
// A soft delete (setting an `is_archived` flag) is often a better production strategy. For now, we'll do a hard delete.
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        // Respond with 204 No Content for successful deletion
        res.status(204).send();
    } catch (error) {
        // This will catch errors if the item is referenced in the transactions table
        if (error.code === '23503') { // foreign_key_violation
            return res.status(409).json({ message: 'Cannot delete item because it has existing transaction records. Consider archiving it instead.' });
        }
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;