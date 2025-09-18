const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { authenticateToken, isAdmin } = require('../../middleware/auth.middleware');

// GET /api/users/office-boys - Get all office boy users (Admin only)
router.get('/office-boys', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, full_name, username, is_active FROM users WHERE role = 'office_boy' ORDER BY full_name");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/users/office-boys - Create a new office boy user (Admin only)
router.post('/office-boys', authenticateToken, isAdmin, async (req, res) => {
    const { fullName, username, password } = req.body;
    if (!fullName || !username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.query(
            `INSERT INTO users (full_name, username, password_hash, role)
             VALUES ($1, $2, $3, 'office_boy') RETURNING id, full_name, username, is_active`,
            [fullName, username, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'This username is already taken.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/office-boys/:id - Update a user (Admin only)
router.put('/office-boys/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fullName, username, password, isActive } = req.body;

    // Build the query dynamically based on what fields are provided
    let query;
    const params = [];
    let setClauses = [];
    let paramIndex = 1;

    if (fullName) {
        setClauses.push(`full_name = $${paramIndex++}`);
        params.push(fullName);
    }
    if (username) {
        setClauses.push(`username = $${paramIndex++}`);
        params.push(username);
    }
    if (isActive !== undefined) {
        setClauses.push(`is_active = $${paramIndex++}`);
        params.push(isActive);
    }
    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        setClauses.push(`password_hash = $${paramIndex++}`);
        params.push(hashedPassword);
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ message: 'No fields to update provided.' });
    }

    query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id, full_name, username, is_active`;
    params.push(id);

    try {
        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'This username is already taken.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;