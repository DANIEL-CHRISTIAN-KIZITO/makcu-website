const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

router.get('/login', (req, res) => {
    if (req.session.admin) return res.redirect('/admin/dashboard');
    res.render('admin/login', { title: 'Admin Login', layout: false });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
        return res.status(401).render('admin/login', { title: 'Admin Login', layout: false, error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
        return res.status(401).render('admin/login', { title: 'Admin Login', layout: false, error: 'Invalid credentials.' });
    }

    req.session.admin = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
    res.redirect('/admin/dashboard');
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
