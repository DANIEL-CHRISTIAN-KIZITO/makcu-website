function requireAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    return res.redirect('/admin/login');
}

function requireSuperadmin(req, res, next) {
    if (req.session && req.session.admin && req.session.admin.role === 'superadmin') {
        return next();
    }
    return res.status(403).render('admin/error', {
        message: 'Only the superadmin can access this page.',
        layout: 'admin/layout',
    });
}

module.exports = { requireAdmin, requireSuperadmin };
