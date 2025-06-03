// routes/comptes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

// GET /comptes (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM Compte', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET /comptes/:id (détail, protégé par auth)
router.get('/:id', auth, (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM Compte WHERE idCompte = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
});

// POST /comptes (création)
router.post('/', (req, res) => {
    const { descriptionCompte, nomBanque, idUtilisateur } = req.body;
    db.query(
        'INSERT INTO Compte (descriptionCompte, nomBanque, idUtilisateur) VALUES (?, ?, ?)',
        [descriptionCompte, nomBanque, idUtilisateur],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ idCompte: result.insertId, descriptionCompte, nomBanque, idUtilisateur });
        }
    );
});

// PATCH /comptes/:id (modification)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const fields = { ...req.body };
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);
    values.push(id);

    db.query(
        `UPDATE Compte SET ${setClause} WHERE idCompte = ?`,
        values,
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Compte mis à jour', idCompte: id });
        }
    );
});

// DELETE /comptes/:id (suppression)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM Compte WHERE idCompte = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Compte supprimé' });
    });
});

module.exports = router;