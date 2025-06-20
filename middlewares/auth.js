// middlewares/auth.js
const db = require('../db');

module.exports = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Format de token invalide' });
    }

    token = tokenParts[1];

    db.query('SELECT *, dateExpirationHash FROM utilisateur WHERE hashcode = ?', [token], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: 'Token invalide' });

        const user = results[0];
        const now = new Date();
        if (user.dateExpirationHash && new Date(user.dateExpirationHash) < now) {
            return res.status(401).json({ error: 'Token expiré' });
        }

        req.user = user;
        next();
    });
};