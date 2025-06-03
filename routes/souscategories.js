const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /souscategories (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM SousCategorie', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET /souscategories/:id (détail)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM SousCategorie WHERE idSousCategorie = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
});

// POST /souscategories (création)
router.post('/', (req, res) => {
    const { nomSousCategorie, idCategorie } = req.body;
    db.query(
        'INSERT INTO SousCategorie (nomSousCategorie, idCategorie) VALUES (?, ?)',
        [nomSousCategorie, idCategorie],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ idSousCategorie: result.insertId, nomSousCategorie, idCategorie });
        }
    );
});

// PATCH /souscategories/:id (modification)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const fields = { ...req.body };
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);
    values.push(id);

    db.query(
        `UPDATE SousCategorie SET ${setClause} WHERE idSousCategorie = ?`,
        values,
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Sous-catégorie mise à jour', idSousCategorie: id });
        }
    );
});

// DELETE /souscategories/:id (suppression)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM SousCategorie WHERE idSousCategorie = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Sous-catégorie supprimée' });
    });
});

module.exports = router;