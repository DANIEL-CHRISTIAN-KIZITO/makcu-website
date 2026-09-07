// Run with: npm run db:init
// Creates all tables and (if env vars are set) bootstraps the first superadmin account.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();
const pool = require('./db');

async function init() {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Schema applied.');

    const { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
    if (SUPERADMIN_EMAIL && SUPERADMIN_PASSWORD) {
        const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [SUPERADMIN_EMAIL]);
        if (existing.rows.length === 0) {
            const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
            await pool.query(
                'INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['Daniel', SUPERADMIN_EMAIL, hash, 'superadmin']
            );
            console.log('Superadmin account created for', SUPERADMIN_EMAIL);
        } else {
            console.log('Superadmin already exists, skipping.');
        }
    } else {
        console.log('SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD not set in .env — skipping admin bootstrap.');
    }

    await pool.end();
}

init().catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
});
