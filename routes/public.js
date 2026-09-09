const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// Home
router.get('/', async (req, res) => {
    const upcoming = await pool.query(
        'SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC LIMIT 3'
    );
    res.render('index', { title: 'Home', events: upcoming.rows });
});

// About
router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

// Fellowship Profile
router.get('/profile', (req, res) => {
    res.render('profile', { title: 'Fellowship Profile' });
});

// Events list
router.get('/events', async (req, res) => {
    const result = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
    res.render('events', { title: 'Events', events: result.rows });
});

// Event detail
router.get('/events/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).render('404', { title: 'Not Found' });
    res.render('event-detail', { title: result.rows[0].title, event: result.rows[0] });
});

// Give
router.get('/give', (req, res) => {
    res.render('give', {
        title: 'Give',
        flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    });
});

// Give - record donation initiation (actual payment confirmation happens via webhook/callback)
router.post(
    '/give',
    [
        body('amount').isFloat({ gt: 0 }),
        body('donor_email').isEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('give', {
                title: 'Give',
                flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
                error: 'Please check the amount and email you entered.',
            });
        }
        const { donor_name, donor_email, amount, purpose, transaction_ref } = req.body;
        await pool.query(
            `INSERT INTO donations (donor_name, donor_email, amount, purpose, payment_provider, transaction_ref, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
            [donor_name, donor_email, amount, purpose, 'flutterwave', transaction_ref]
        );
        res.redirect('/give/thank-you');
    }
);

router.get('/give/thank-you', (req, res) => {
    res.render('give-thank-you', { title: 'Thank You' });
});

// Payment provider webhook/callback - verify and update donation status
router.post('/give/callback', async (req, res) => {
    // TODO: verify signature/transaction with Flutterwave's verify-transaction API
    // before marking as successful. This is a stub for that logic.
    const { transaction_ref, status } = req.body;
    if (transaction_ref) {
        await pool.query('UPDATE donations SET status = $1 WHERE transaction_ref = $2', [
            status === 'successful' ? 'successful' : 'failed',
            transaction_ref,
        ]);
    }
    res.sendStatus(200);
});

// Join / small groups sign-up
router.get('/join', (req, res) => {
    res.render('join', { title: 'Join Us' });
});

router.post(
    '/join',
    [body('full_name').notEmpty(), body('email').isEmail()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('join', { title: 'Join Us', error: 'Please fill in your name and a valid email.' });
        }
        const { full_name, email, phone, year_of_study, hall_residence, interest_area } = req.body;
        await pool.query(
            `INSERT INTO signups (full_name, email, phone, year_of_study, hall_residence, interest_area)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [full_name, email, phone, year_of_study, hall_residence, interest_area]
        );
        res.render('join', { title: 'Join Us', success: true });
    }
);

// Gallery
router.get('/gallery', async (req, res) => {
    const result = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.render('gallery', { title: 'Gallery', images: result.rows });
});

// Contact
router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact' });
});

router.post(
    '/contact',
    [body('name').notEmpty(), body('email').isEmail(), body('message').notEmpty()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('contact', { title: 'Contact', error: 'Please fill in all fields with a valid email.' });
        }
        const { name, email, message } = req.body;
        await pool.query('INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)', [
            name,
            email,
            message,
        ]);
        res.render('contact', { title: 'Contact', success: true });
    }
);

module.exports = router;
