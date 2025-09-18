const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// --- Configuration ---
// The details for the admin user you want to create.
const adminUser = {
    fullName: 'Administrator',
    username: 'admin',
    password: 'admin123', // You can change this, but remember it for login.
    role: 'admin'
};
// --------------------

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createAdmin = async () => {
    const client = await pool.connect();
    try {
        console.log('Checking for existing admin user...');
        const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [adminUser.username]);

        if (existingUser.rows.length > 0) {
            console.log(`User '${adminUser.username}' already exists. Skipping creation.`);
            return;
        }

        console.log('Admin user not found. Creating new admin user...');
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);

        // SQL query to insert the new user
        // Use a parameterized query to prevent SQL injection
        const queryText = `
            INSERT INTO users (full_name, username, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, role;
        `;
        const values = [adminUser.fullName, adminUser.username, hashedPassword, adminUser.role];

        const res = await client.query(queryText, values);
        console.log('---');
        console.log(`Admin user '${res.rows[0].username}' created successfully!`);
        console.log('---');

    } catch (err) {
        console.error('Error creating admin user:', err.stack);
    } finally {
        // Make sure to release the client connection
        client.release();
        // End the pool so the script exits
        await pool.end();
    }
};

createAdmin();