// middlewares/auth.js
const db = require('../db');

module.exports = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    // Remove Bearer prefix if present
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Format de token invalide' });
    }

    token = tokenParts[1];


    db.query('SELECT * FROM utilisateur WHERE hashcode = ?', [token], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: 'Token invalide' });
        req.user = results[0];
        next();
    });
};