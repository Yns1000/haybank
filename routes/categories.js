const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /categories (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM Categorie', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET /categories/:id (détail)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM Categorie WHERE idCategorie = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
});

// POST /categories (création)
router.post('/', (req, res) => {
    const { nomCategorie } = req.body;
    db.query('INSERT INTO Categorie (nomCategorie) VALUES (?)', [nomCategorie], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ idCategorie: result.insertId, nomCategorie });
    });
});

// PUT /categories/:id (modification)
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { nomCategorie } = req.body;
    db.query('UPDATE Categorie SET nomCategorie = ? WHERE idCategorie = ?', [nomCategorie, id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Catégorie mise à jour', idCategorie: id });
    });
});

// DELETE /categories/:id (suppression)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM Categorie WHERE idCategorie = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Catégorie supprimée' });
    });
});

module.exports = router;