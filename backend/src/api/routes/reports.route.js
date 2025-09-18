const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const ExcelJS = require('exceljs');
const { authenticateToken, isAdmin } = require('../../middleware/auth.middleware');

// Helper function to create styled headers for Excel sheets
const createStyledHeader = (worksheet, columns) => {
    worksheet.columns = columns;
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' } // A professional blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
};

// --- REPORT ENDPOINTS ---

// 1. GET /api/reports/stock - Generates a full inventory stock report
router.get('/stock', authenticateToken, isAdmin, async (req, res) => {
    try {
        const itemsResult = await db.query(`
            SELECT 
                i.sku, i.name, c.name as category_name, 
                i.current_quantity, i.low_stock_threshold, i.unit_of_measurement
            FROM items i 
            LEFT JOIN categories c ON i.category_id = c.id
            ORDER BY c.name, i.name
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Current Stock Report');

        createStyledHeader(worksheet, [
            { header: 'SKU', key: 'sku', width: 20 },
            { header: 'Item Name', key: 'name', width: 40 },
            { header: 'Category', key: 'category_name', width: 25 },
            { header: 'Current Quantity', key: 'current_quantity', width: 20 },
            { header: 'Unit', key: 'unit_of_measurement', width: 15 },
            { header: 'Low Stock Threshold', key: 'low_stock_threshold', width: 25 },
        ]);

        worksheet.addRows(itemsResult.rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Stock-Report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Failed to generate stock report:', error);
        res.status(500).json({ message: 'Failed to generate stock report.' });
    }
});


// 2. GET /api/reports/low-stock - Generates a report of items at or below their threshold
router.get('/low-stock', authenticateToken, isAdmin, async (req, res) => {
    try {
        const itemsResult = await db.query(`
            SELECT 
                i.sku, i.name, c.name as category_name, 
                i.current_quantity, i.low_stock_threshold
            FROM items i 
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.current_quantity <= i.low_stock_threshold
            ORDER BY i.name
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Low Stock Items');

        createStyledHeader(worksheet, [
            { header: 'SKU', key: 'sku', width: 20 },
            { header: 'Item Name', key: 'name', width: 40 },
            { header: 'Category', key: 'category_name', width: 25 },
            { header: 'Current Quantity', key: 'current_quantity', width: 20 },
            { header: 'Low Stock Threshold', key: 'low_stock_threshold', width: 25 },
        ]);

        worksheet.addRows(itemsResult.rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Low-Stock-Report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Failed to generate low stock report:', error);
        res.status(500).json({ message: 'Failed to generate low stock report.' });
    }
});


// 3. GET /api/reports/transactions - Generates a detailed transaction log report
router.get('/transactions', authenticateToken, isAdmin, async (req, res) => {
    const { startDate, endDate, type } = req.query;

    let whereClauses = [];
    const params = [];
    let paramIndex = 1;

    if (startDate) {
        whereClauses.push(`t.created_at >= $${paramIndex++}`);
        params.push(startDate);
    }
    if (endDate) {
        // Add one day to end date to make it inclusive
        const inclusiveEndDate = new Date(endDate);
        inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
        whereClauses.push(`t.created_at < $${paramIndex++}`);
        params.push(inclusiveEndDate);
    }
    if (type) {
        whereClauses.push(`t.transaction_type = $${paramIndex++}`);
        params.push(type);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const logResult = await db.query(`
            SELECT 
                t.created_at, i.name as item_name, u.full_name as user_name,
                t.transaction_type, t.quantity_change, t.details
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            JOIN users u ON t.user_id = u.id
            ${whereString}
            ORDER BY t.created_at DESC
        `, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transaction History');

        createStyledHeader(worksheet, [
            { header: 'Date & Time', key: 'created_at', width: 25 },
            { header: 'Item Name', key: 'item_name', width: 40 },
            { header: 'User', key: 'user_name', width: 25 },
            { header: 'Transaction Type', key: 'transaction_type', width: 20 },
            { header: 'Quantity Change', key: 'quantity_change', width: 20 },
            { header: 'Details', key: 'details', width: 40 },
        ]);

        // Process rows to format JSON details nicely
        const rows = logResult.rows.map(row => ({
            ...row,
            details: row.details ? JSON.stringify(row.details) : ''
        }));
        worksheet.addRows(rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Transactions-Report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Failed to generate transaction report:', error);
        res.status(500).json({ message: 'Failed to generate transaction report.' });
    }
});


// 4. GET /api/reports/consumption - Generates a summary of item distribution
router.get('/consumption', authenticateToken, isAdmin, async (req, res) => {
    try {
        const consumptionResult = await db.query(`
            SELECT 
                i.name,
                c.name as category_name,
                ABS(SUM(t.quantity_change)) as total_distributed
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE t.transaction_type = 'DISTRIBUTION'
            GROUP BY i.name, c.name
            ORDER BY total_distributed DESC
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Item Consumption');

        createStyledHeader(worksheet, [
            { header: 'Item Name', key: 'name', width: 40 },
            { header: 'Category', key: 'category_name', width: 25 },
            { header: 'Total Units Distributed', key: 'total_distributed', width: 30 },
        ]);

        worksheet.addRows(consumptionResult.rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Consumption-Report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Failed to generate consumption report:', error);
        res.status(500).json({ message: 'Failed to generate consumption report.' });
    }
});

module.exports = router;