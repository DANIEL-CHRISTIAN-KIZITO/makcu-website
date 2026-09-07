require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const path = require('path');
const pool = require('./config/db');

const publicRoutes = require('./routes/public');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // default public layout at views/layout.ejs

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method')); // lets forms send PUT/DELETE via ?_method=
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        store: new pgSession({ pool, tableName: 'session' }),
        secret: process.env.SESSION_SECRET || 'change_this_secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 8, // 8 hours
            secure: process.env.NODE_ENV === 'production',
        },
    })
);

// Make admin session available in all admin views
app.use((req, res, next) => {
    res.locals.currentAdmin = req.session.admin || null;
    next();
});

app.use('/', publicRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Not Found', layout: 'layout' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Makerere University Christian Union website running on http://localhost:${PORT}`);
});
