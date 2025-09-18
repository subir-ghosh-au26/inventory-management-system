const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateToken, isAdmin } = require('../../middleware/auth.middleware');

// GET all categories (no changes needed)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching categories.' });
    }
});

// POST a new category (no changes needed)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }
    try {
        const result = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        res.status(500).json({ message: 'Server error creating category.' });
    }
});

// PUT /api/categories/:id - Update a category (NEW)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }
    try {
        const result = await db.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        res.status(500).json({ message: 'Server error updating category.' });
    }
});

// DELETE /api/categories/:id - Delete a category (NEW)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM categories WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        // Because of our "ON DELETE SET NULL" constraint on the items table,
        // this will not fail if items are using the category. It will just set their category_id to NULL.
        res.status(204).send(); // 204 No Content is standard for a successful delete
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting category.' });
    }
});

module.exports = router;