const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { requireAdmin, requireSuperadmin } = require('../middleware/auth');

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.use(requireAdmin); // everything below requires login

router.get('/dashboard', async (req, res) => {
    const [events, signups, donations, messages] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM events'),
        pool.query('SELECT COUNT(*) FROM signups'),
        pool.query("SELECT COUNT(*) FROM donations WHERE status = 'successful'"),
        pool.query('SELECT COUNT(*) FROM contact_messages'),
    ]);
    res.render('admin/dashboard', {
        title: 'Dashboard',
        layout: 'admin/layout',
        admin: req.session.admin,
        counts: {
            events: events.rows[0].count,
            signups: signups.rows[0].count,
            donations: donations.rows[0].count,
            messages: messages.rows[0].count,
        },
    });
});

// --- Events CRUD ---
router.get('/events', async (req, res) => {
    const result = await pool.query('SELECT * FROM events ORDER BY event_date DESC');
    res.render('admin/events', { title: 'Manage Events', layout: 'admin/layout', admin: req.session.admin, events: result.rows });
});

router.get('/events/new', (req, res) => {
    res.render('admin/event-form', { title: 'New Event', layout: 'admin/layout', admin: req.session.admin, event: null });
});

router.post('/events', upload.single('image'), async (req, res) => {
    const { title, description, event_date, event_time, location } = req.body;
    const image_path = req.file ? '/uploads/' + req.file.filename : null;
    await pool.query(
        `INSERT INTO events (title, description, event_date, event_time, location, image_path, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [title, description, event_date, event_time, location, image_path, req.session.admin.id]
    );
    res.redirect('/admin/events');
});

router.get('/events/:id/edit', async (req, res) => {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.redirect('/admin/events');
    res.render('admin/event-form', { title: 'Edit Event', layout: 'admin/layout', admin: req.session.admin, event: result.rows[0] });
});

router.put('/events/:id', upload.single('image'), async (req, res) => {
    const { title, description, event_date, event_time, location } = req.body;
    if (req.file) {
        await pool.query(
            `UPDATE events SET title=$1, description=$2, event_date=$3, event_time=$4, location=$5, image_path=$6 WHERE id=$7`,
            [title, description, event_date, event_time, location, '/uploads/' + req.file.filename, req.params.id]
        );
    } else {
        await pool.query(
            `UPDATE events SET title=$1, description=$2, event_date=$3, event_time=$4, location=$5 WHERE id=$6`,
            [title, description, event_date, event_time, location, req.params.id]
        );
    }
    res.redirect('/admin/events');
});

router.delete('/events/:id', async (req, res) => {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.redirect('/admin/events');
});

// --- Gallery CRUD ---
router.get('/gallery', async (req, res) => {
    const result = await pool.query(
        `SELECT gallery.*, events.title AS event_title FROM gallery
         LEFT JOIN events ON gallery.event_id = events.id
         ORDER BY gallery.created_at DESC`
    );
    const events = await pool.query('SELECT id, title FROM events ORDER BY event_date DESC');
    res.render('admin/gallery', {
        title: 'Manage Gallery',
        layout: 'admin/layout',
        admin: req.session.admin,
        images: result.rows,
        events: events.rows,
    });
});

router.post('/gallery', upload.single('image'), async (req, res) => {
    if (!req.file) return res.redirect('/admin/gallery');
    const { title, event_id } = req.body;
    await pool.query(
        'INSERT INTO gallery (title, image_path, event_id, uploaded_by) VALUES ($1, $2, $3, $4)',
        [title, '/uploads/' + req.file.filename, event_id || null, req.session.admin.id]
    );
    res.redirect('/admin/gallery');
});

router.delete('/gallery/:id', async (req, res) => {
    await pool.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
    res.redirect('/admin/gallery');
});

// --- Signups (view/export) ---
router.get('/signups', async (req, res) => {
    const result = await pool.query('SELECT * FROM signups ORDER BY created_at DESC');
    res.render('admin/signups', { title: 'Sign-ups', layout: 'admin/layout', admin: req.session.admin, signups: result.rows });
});

router.get('/signups/export.csv', async (req, res) => {
    const result = await pool.query('SELECT * FROM signups ORDER BY created_at DESC');
    const header = 'Name,Email,Phone,Year,Hall,Interest,Created At\n';
    const rows = result.rows
        .map((s) =>
            [s.full_name, s.email, s.phone, s.year_of_study, s.hall_residence, s.interest_area, s.created_at]
                .map((v) => `"${(v || '').toString().replace(/"/g, '""')}"`)
                .join(',')
        )
        .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=mcuf-signups.csv');
    res.send(header + rows);
});

// --- Donations (view only) ---
router.get('/donations', async (req, res) => {
    const result = await pool.query('SELECT * FROM donations ORDER BY created_at DESC');
    res.render('admin/donations', { title: 'Donations', layout: 'admin/layout', admin: req.session.admin, donations: result.rows });
});

// --- Contact messages ---
router.get('/messages', async (req, res) => {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.render('admin/messages', { title: 'Messages', layout: 'admin/layout', admin: req.session.admin, messages: result.rows });
});

// --- Manage admins (superadmin only) ---
router.get('/admins', requireSuperadmin, async (req, res) => {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM admins ORDER BY created_at ASC');
    res.render('admin/admins', { title: 'Manage Admins', layout: 'admin/layout', admin: req.session.admin, admins: result.rows });
});

router.post('/admins', requireSuperadmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 12);
    await pool.query('INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [
        name,
        email,
        hash,
        role === 'superadmin' ? 'superadmin' : 'editor',
    ]);
    res.redirect('/admin/admins');
});

router.delete('/admins/:id', requireSuperadmin, async (req, res) => {
    // prevent removing yourself
    if (parseInt(req.params.id, 10) === req.session.admin.id) {
        return res.redirect('/admin/admins');
    }
    await pool.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
    res.redirect('/admin/admins');
});

module.exports = router;
