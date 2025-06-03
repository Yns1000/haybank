const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /tiers (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM Tiers', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET /tiers/:id (détail)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM Tiers WHERE idTiers = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
});

// POST /tiers (création)
router.post('/', (req, res) => {
    const { nomTiers, idUtilisateur } = req.body;
    db.query(
        'INSERT INTO Tiers (nomTiers, idUtilisateur) VALUES (?, ?)',
        [nomTiers, idUtilisateur],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ idTiers: result.insertId, nomTiers, idUtilisateur });
        }
    );
});

// PATCH /tiers/:id (modification)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const fields = { ...req.body };
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);
    values.push(id);

    db.query(
        `UPDATE Tiers SET ${setClause} WHERE idTiers = ?`,
        values,
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Tiers mis à jour', idTiers: id });
        }
    );
});

// DELETE /tiers/:id (suppression)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM Tiers WHERE idTiers = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Tiers supprimé' });
    });
});

module.exports = router;