const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /virements (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM virement', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET /virements/:id (détail)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM virement WHERE idVirement = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
});

// POST /virements (création)
router.post('/', (req, res) => {
    const { idCompteDebit, idCompteCredit, montant, dateVirement, idTiers, idCategorie } = req.body;
    db.query(
        'INSERT INTO virement (idCompteDebit, idCompteCredit, montant, dateVirement, idTiers, idCategorie) VALUES (?, ?, ?, ?, ?, ?)',
        [idCompteDebit, idCompteCredit, montant, dateVirement, idTiers, idCategorie],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ idVirement: result.insertId, idCompteDebit, idCompteCredit, montant, dateVirement, idTiers, idCategorie });
        }
    );
});

// PATCH /virements/:id (modification partielle)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const fields = { ...req.body };
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);
    values.push(id);

    db.query(
        `UPDATE virement SET ${setClause} WHERE idVirement = ?`,
        values,
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Virement mis à jour', idVirement: id });
        }
    );
});

// DELETE /virements/:id (suppression)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM virement WHERE idVirement = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Virement supprimé' });
    });
});

module.exports = router;