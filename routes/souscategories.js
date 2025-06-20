const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * components:
 *   schemas:
 *     SousCategorie:
 *       type: object
 *       required:
 *         - nomSousCategorie
 *         - idCategorie
 *       properties:
 *         idSousCategorie:
 *           type: integer
 *         nomSousCategorie:
 *           type: string
 *         idCategorie:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   - name: SousCategories
 *     description: Opérations sur les sous-catégories
 */

/**
 * @swagger
 * /api/souscategories:
 *   get:
 *     summary: Récupère toutes les sous-catégories
 *     tags: [SousCategories]
 *     responses:
 *       200:
 *         description: Liste retournée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SousCategorie'
 *       204: { description: Aucune sous-catégorie }
 *       406: { description: Format non acceptable }
 *       415: { description: Format non supporté }
 *       500: { description: Erreur serveur }

 */
router.get('/', (req, res) => {
    if (
        req.headers['accept'] &&
        !req.headers['accept'].includes('application/json') &&
        req.headers['accept'] !== '*/*'
    ) {
        return res.status(406).json({ error: 'Format non acceptable' });
    }

    if (
        req.headers['content-type'] &&
        req.headers['content-type'] !== 'application/json'
    ) {
        return res.status(415).json({ error: 'Format non supporté' });
    }

    db.query('SELECT * FROM souscategorie', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(204).send();
        res.json(results);
    });
});

/**
 * @swagger
 * /api/souscategories/{id}:
 *   get:
 *     summary: Récupère une sous-catégorie par ID
 *     tags: [SousCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Sous-catégorie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SousCategorie'
 *       404: { description: Introuvable }
 *       406: { description: Format non acceptable }
 *       415: { description: Format non supporté }
 *       500: { description: Erreur serveur }
 */
router.get('/:id', (req, res) => {
    if (
        req.headers['accept'] &&
        !req.headers['accept'].includes('application/json') &&
        req.headers['accept'] !== '*/*'
    ) {
        return res.status(406).json({ error: 'Format non acceptable' });
    }

    if (
        req.headers['content-type'] &&
        req.headers['content-type'] !== 'application/json'
    ) {
        return res.status(415).json({ error: 'Format non supporté' });
    }

    const id = req.params.id;
    db.query('SELECT * FROM souscategorie WHERE idSousCategorie = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Introuvable' });
        res.json(results[0]);
    });
});

/**
 * @swagger
 * /api/souscategories:
 *   post:
 *     summary: Crée une sous-catégorie
 *     tags: [SousCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SousCategorie' }
 *     responses:
 *       201: { description: Créée }
 *       400: { description: Champs requis manquants }
 *       404: { description: Catégorie parente inexistante }
 *       406: { description: Format non acceptable }
 *       409: { description: Doublon }
 *       415: { description: Format non supporté }
 *       500: { description: Erreur serveur }
 */
router.post('/', (req, res) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté' });
    }

    if (
        req.headers['accept'] &&
        !req.headers['accept'].includes('application/json') &&
        req.headers['accept'] !== '*/*'
    ) {
        return res.status(406).json({ error: 'Format non acceptable' });
    }

    const { nomSousCategorie, idCategorie } = req.body;
    if (!nomSousCategorie || !idCategorie)
        return res.status(400).json({ error: 'Champs requis manquants' });

    db.query('SELECT * FROM categorie WHERE idCategorie = ?', [idCategorie], (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        if (rows.length === 0) return res.status(404).json({ error: 'Catégorie parente inexistante' });

        db.query('SELECT * FROM souscategorie WHERE nomSousCategorie = ?', [nomSousCategorie], (err, doublons) => {
            if (err) return res.status(500).json({ error: err });
            if (doublons.length > 0)
                return res.status(409).json({ error: 'Sous-catégorie déjà existante' });

            db.query(
                'INSERT INTO souscategorie (nomSousCategorie, idCategorie) VALUES (?, ?)',
                [nomSousCategorie, idCategorie],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    res.status(201).json({ idSousCategorie: result.insertId, nomSousCategorie, idCategorie });
                }
            );
        });
    });
});

/**
 * @swagger
 * /api/souscategories/{id}:
 *   put:
 *     summary: Modifie une sous-catégorie
 *     tags: [SousCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SousCategorie' }
 *     responses:
 *       200: { description: Modifiée }
 *       304: { description: Non modifiée }
 *       400: { description: Champs manquants }
 *       404: { description: Introuvable }
 *       406: { description: Format non acceptable }
 *       409: { description: Doublon }
 *       415: { description: Format non supporté }
 *       500: { description: Erreur serveur }
 */
router.put('/:id', (req, res) => {
    if (req.headers['content-type'] !== 'application/json')
        return res.status(415).json({ error: 'Format non supporté' });

    if (
        req.headers['accept'] &&
        !req.headers['accept'].includes('application/json') &&
        req.headers['accept'] !== '*/*'
    ) {
        return res.status(406).json({ error: 'Format non acceptable' });
    }

    const id = req.params.id;
    const { nomSousCategorie, idCategorie } = req.body;

    if (!nomSousCategorie || !idCategorie)
        return res.status(400).json({ error: 'Champs manquants' });

    db.query('SELECT * FROM souscategorie WHERE idSousCategorie = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Introuvable' });

        if (results[0].nomSousCategorie === nomSousCategorie && results[0].idCategorie === idCategorie)
            return res.status(304).json({ message: 'Aucune modification' });

        db.query(
            'SELECT * FROM souscategorie WHERE nomSousCategorie = ? AND idSousCategorie != ?',
            [nomSousCategorie, id],
            (err, doublon) => {
                if (err) return res.status(500).json({ error: err });
                if (doublon.length > 0)
                    return res.status(409).json({ error: 'Doublon détecté' });

                db.query(
                    'UPDATE souscategorie SET nomSousCategorie = ?, idCategorie = ? WHERE idSousCategorie = ?',
                    [nomSousCategorie, idCategorie, id],
                    (err) => {
                        if (err) return res.status(500).json({ error: err });
                        res.status(200).json({ message: 'Sous-catégorie modifiée' });
                    }
                );
            }
        );
    });
});

/**
 * @swagger
 * /api/souscategories/{id}:
 *   delete:
 *     summary: Supprime une sous-catégorie
 *     tags: [SousCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Supprimée }
 *       404: { description: Introuvable }
 *       406: { description: Format non acceptable }
 *       415: { description: Format non supporté }
 *       500: { description: Erreur serveur }
 */
router.delete('/:id', (req, res) => {
    if (
        req.headers['content-type'] &&
        req.headers['content-type'] !== 'application/json'
    ) {
        return res.status(415).json({ error: 'Format non supporté' });
    }

    if (
        req.headers['accept'] &&
        !req.headers['accept'].includes('application/json') &&
        req.headers['accept'] !== '*/*'
    ) {
        return res.status(406).json({ error: 'Format non acceptable' });
    }

    const id = req.params.id;
    db.query('DELETE FROM souscategorie WHERE idSousCategorie = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Introuvable' });
        res.status(200).json({ message: 'Sous-catégorie supprimée' });
    });
});

module.exports = router;
