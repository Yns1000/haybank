const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /mouvements (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM Mouvement', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET /mouvements/:id (détail)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM Mouvement WHERE idMouvement = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
});

// POST /mouvements (création)
router.post('/', (req, res) => {
    const { dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, idVirement, montant, typeMouvement } = req.body;
    db.query(
        'INSERT INTO Mouvement (dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, idVirement, montant, typeMouvement) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, idVirement, montant, typeMouvement],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ idMouvement: result.insertId, ...req.body });
        }
    );
});

// PATCH /mouvements/:id (modification)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const fields = { ...req.body };
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);
    values.push(id);

    db.query(
        `UPDATE Mouvement SET ${setClause} WHERE idMouvement = ?`,
        values,
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Mouvement mis à jour', idMouvement: id });
        }
    );
});

// DELETE /mouvements/:id (suppression)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM Mouvement WHERE idMouvement = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Mouvement supprimé' });
    });
});

module.exports = router;