// routes/comptes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

// GET /comptes (liste, protégé et filtré)
router.get('/', auth, (req, res) => {
    // 406 Not Acceptable
    if (
        req.headers['accept'] &&
        !req.headers["accept"].includes("application/json") &&
        req.headers['accept'] !== '*/*'
    ) {
        return res
            .status(406)
            .json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    // 415 Unsupported Media Type (optionnel pour GET)
    if (
        req.headers['content-type'] &&
        req.headers['content-type'] !== 'application/json'
    ) {
        return res
            .status(415)
            .json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT * FROM compte WHERE idUtilisateur = ?', [idUtilisateur], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(204).send();
        res.status(200).json(results);
    });
});

// GET /comptes/:id (détail, protégé et filtré)
router.get('/:id', auth, (req, res) => {
    // 415 Unsupported Media Type (optionnel pour GET)
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const id = req.params.id;
    const idUtilisateur = req.user.idUtilisateur;

    db.query('SELECT * FROM compte WHERE idCompte = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Compte non trouvé' });

        const compte = results[0];
        if (compte.idUtilisateur !== idUtilisateur) {
            return res.status(403).json({ error: 'Accès interdit à ce compte.' });
        }

        res.status(200).json(compte);
    });
});

// POST /comptes (création, protégé)
router.post('/', auth, (req, res) => {
    // 415 Unsupported Media Type
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const { descriptionCompte, nomBanque } = req.body;
    const idUtilisateur = req.user.idUtilisateur;

    // Vérifie unicité de la description pour cet utilisateur
    db.query(
        'SELECT idCompte FROM compte WHERE descriptionCompte = ? AND idUtilisateur = ?',
        [descriptionCompte, idUtilisateur],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length > 0) {
                return res.status(409).json({ error: 'Un compte avec cette description existe déjà.' });
            }

            db.query(
                'INSERT INTO compte (descriptionCompte, nomBanque, idUtilisateur) VALUES (?, ?, ?)',
                [descriptionCompte, nomBanque, idUtilisateur],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    res.status(201).json({ idCompte: result.insertId, descriptionCompte, nomBanque, idUtilisateur });
                }
            );
        }
    );
});

// PATCH /comptes/:id (modification, protégé et filtré)
router.patch('/:id', auth, (req, res) => {
    // 406 Not Acceptable
    if (
        req.headers['accept'] &&
        req.headers['accept'] !== '*/*' &&
        !req.headers['accept'].includes('application/json')
    ) {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    // 415 Unsupported Media Type
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const id = req.params.id;
    const idUtilisateur = req.user.idUtilisateur;
    const fields = { ...req.body };
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    // Vérifie que le compte existe
    db.query('SELECT * FROM compte WHERE idCompte = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Compte non trouvé' });

        const compte = results[0];
        // 403 Forbidden si le compte n'appartient pas à l'utilisateur
        if (compte.idUtilisateur !== idUtilisateur) {
            return res.status(403).json({ error: 'Accès interdit à ce compte.' });
        }

        // 304 Not Modified si aucune modification détectée
        let modif = false;
        for (const key of keys) {
            if (compte[key] !== undefined && compte[key] != fields[key]) {
                modif = true;
                break;
            }
        }
        if (!modif) {
            return res.status(304).json({ message: 'Aucune modification détectée.' });
        }

        // 409 Conflict si description déjà utilisée par un autre compte de l'utilisateur
        if (fields.descriptionCompte) {
            db.query(
                'SELECT idCompte FROM compte WHERE descriptionCompte = ? AND idUtilisateur = ? AND idCompte != ?',
                [fields.descriptionCompte, idUtilisateur, id],
                (err, doublon) => {
                    if (err) return res.status(500).json({ error: err });
                    if (doublon.length > 0) {
                        return res.status(409).json({ error: 'Un compte avec cette description existe déjà.' });
                    }
                    updateCompte();
                }
            );
        } else {
            updateCompte();
        }

        function updateCompte() {
            const setClause = keys.map(key => `${key} = ?`).join(', ');
            const values = keys.map(key => fields[key]);
            values.push(id);

            db.query(
                `UPDATE compte SET ${setClause} WHERE idCompte = ?`,
                values,
                (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    res.status(200).json({ message: 'Compte mis à jour', idCompte: id });
                }
            );
        }
    });
});

// DELETE /comptes/:id (suppression, protégé et filtré)
router.delete('/:id', auth, (req, res) => {
    // 415 Unsupported Media Type
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const id = req.params.id;
    const idUtilisateur = req.user.idUtilisateur;

    // Vérifie que le compte existe
    db.query('SELECT * FROM compte WHERE idCompte = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Compte non trouvé' });

        const compte = results[0];
        // 403 Forbidden si le compte n'appartient pas à l'utilisateur
        if (compte.idUtilisateur !== idUtilisateur) {
            return res.status(403).json({ error: 'Accès interdit à ce compte.' });
        }

        db.query('DELETE FROM compte WHERE idCompte = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: err });
            res.status(200).json({ message: 'Compte supprimé' });
        });
    });
});

module.exports = router;