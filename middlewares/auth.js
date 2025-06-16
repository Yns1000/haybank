// middlewares/auth.js
const db = require('../db');

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    db.query('SELECT * FROM utilisateur WHERE hashcode = ?', [token], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: 'Token invalide' });
        req.user = results[0];
        next();
    });
};