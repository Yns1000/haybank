const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /categories (liste)
router.get('/', (req, res) => {
    db.query('SELECT * FROM categorie', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        // 204 No Content si aucune catégorie
        if (results.length === 0) return res.status(204).send();
        // 406 Not Acceptable si le format n'est pas JSON
        if (req.headers['accept'] && req.headers['accept'] !== 'application/json') {
            return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
        }
        // 415 Unsupported Media Type si le format n'est pas JSON
        if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
            return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
        }
        res.json(results);
    });
});

// GET /categories/:id (détail)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM categorie WHERE idCategorie = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        // 404 Not Found si la catégorie n'existe pas
        if (results.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        // 406 Not Acceptable si le format n'est pas JSON
        if (req.headers['accept'] && req.headers['accept'] !== 'application/json') {
            return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
        }
        // 415 Unsupported Media Type si le format n'est pas JSON
        if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
            return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
        }
        res.json(results[0]);
    });
});

// POST /categories (création)
router.post('/', (req, res) => {
    // 415 Unsupported Media Type si le Content-Type n'est pas JSON
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const { nomCategorie } = req.body;
    // 400 Bad Request si le nom n'est pas fourni
    if (!nomCategorie) {
        return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
    }

    // Vérifie si la catégorie existe déjà
    db.query('SELECT idCategorie FROM categorie WHERE nomCategorie = ?', [nomCategorie], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length > 0) {
            return res.status(409).json({ error: 'Nom de catégorie déjà utilisé.' });
        }

        db.query('INSERT INTO categorie (nomCategorie) VALUES (?)', [nomCategorie], (err, result) => {
            if (err) return res.status(500).json({ error: err });

            // 406 Not Acceptable si le client n'accepte pas le JSON
            if (req.headers['accept'] && !req.headers['accept'].includes('application/json')) {
                return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
            }

            res.status(201).json({ idCategorie: result.insertId, nomCategorie });
        });
    });
});

// PUT /categories/:id (modification)
router.put('/:id', (req, res) => {
    // 415 Unsupported Media Type
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    // 406 Not Acceptable
    if (req.headers['accept'] && !req.headers['accept'].includes('application/json')) {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }

    const id = req.params.id;
    const { nomCategorie } = req.body;
    if (!nomCategorie) {
        return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
    }

    // Vérifie si la catégorie existe
    db.query('SELECT * FROM categorie WHERE idCategorie = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée.' });

        // 304 Not Modified si même nom
        if (results[0].nomCategorie === nomCategorie) {
            return res.status(304).json({ message: 'Aucune modification détectée.' });
        }

        // Vérifie unicité du nom
        db.query('SELECT idCategorie FROM categorie WHERE nomCategorie = ? AND idCategorie != ?', [nomCategorie, id], (err, doublon) => {
            if (err) return res.status(500).json({ error: err });
            if (doublon.length > 0) {
                return res.status(409).json({ error: 'Nom de catégorie déjà utilisé.' });
            }

            db.query('UPDATE categorie SET nomCategorie = ? WHERE idCategorie = ?', [nomCategorie, id], (err, result) => {
                if (err) return res.status(500).json({ error: err });
                res.status(200).json({ message: 'Catégorie mise à jour', idCategorie: id });
            });
        });
    });
});

// DELETE /categories/:id (suppression)
router.delete('/:id', (req, res) => {
    // 415 Unsupported Media Type
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    // 406 Not Acceptable
    if (req.headers['accept'] && !req.headers['accept'].includes('application/json')) {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }

    const id = req.params.id;
    db.query('DELETE FROM categorie WHERE idCategorie = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }
        res.status(200).json({ message: 'Catégorie supprimée' });
    });
});

module.exports = router;