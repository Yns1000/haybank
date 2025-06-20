// routes/comptes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Compte:
 *       type: object
 *       properties:
 *         idCompte:
 *           type: integer
 *           example: 1
 *         descriptionCompte:
 *           type: string
 *           example: "Compte courant"
 *         nomBanque:
 *           type: string
 *           example: "BNP"
 *         idUtilisateur:
 *           type: integer
 *           example: 2
 */

/**
 * @swagger
 * tags:
 *   - name: Comptes
 *     description: Gestion des comptes utilisateur
 */

/**
 * @swagger
 * /api/comptes:
 *   get:
 *     summary: Liste les comptes de l'utilisateur connecté
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste retournée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Compte'
 *       204:
 *         description: Aucun compte
 *       406:
 *         description: Format non acceptable
 *       415:
 *         description: Format non supporté
 */

// GET /api/comptes (liste, protégé et filtré)
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

/**
 * @swagger
 * /api/comptes/{id}:
 *   get:
 *     summary: Détail d'un compte
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compte trouvé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Non trouvé
 *       415:
 *         description: Format non supporté
 */

// GET /api/comptes/:id (détail, protégé et filtré)
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



/**
 * @swagger
 * /api/comptes:
 *   post:
 *     summary: Crée un compte
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [descriptionCompte, nomBanque]
 *             properties:
 *               descriptionCompte:
 *                 type: string
 *                 example: "Livret A"
 *               nomBanque:
 *                 type: string
 *                 example: "LCL"
 *     responses:
 *       201:
 *         description: Compte créé
 *       409:
 *         description: Doublon
 *       415:
 *         description: Format non supporté
 */

// POST /api/comptes (création, protégé)
router.post('/', auth, (req, res) => {
    // 415 Unsupported Media Type
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const { descriptionCompte, nomBanque } = req.body;
    const idUtilisateur = req.user.idUtilisateur;

    // Vérifie unicité de la description ET nomBanque pour cet utilisateur
    db.query(
        'SELECT idCompte FROM compte WHERE descriptionCompte = ? AND nomBanque = ? AND idUtilisateur = ?',
        [descriptionCompte, nomBanque, idUtilisateur],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length > 0) {
                return res.status(409).json({ error: 'Un compte avec cette description et cette banque existe déjà.' });
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



/**
 * @swagger
 * /api/comptes/{id}:
 *   patch:
 *     summary: Modifie un compte
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               descriptionCompte:
 *                 type: string
 *               nomBanque:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compte modifié
 *       304:
 *         description: Aucune modification
 *       400:
 *         description: Aucune donnée fournie
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Introuvable
 *       409:
 *         description: Doublon
 *       415:
 *         description: Format non supporté
 */

// PATCH /api/comptes/:id (modification, protégé et filtré)
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

        // 409 Conflict si description ET nomBanque déjà utilisée par un autre compte de l'utilisateur
        if (fields.descriptionCompte && fields.nomBanque) {
            db.query(
                'SELECT idCompte FROM compte WHERE descriptionCompte = ? AND nomBanque = ? AND idUtilisateur = ? AND idCompte != ?',
                [fields.descriptionCompte, fields.nomBanque, idUtilisateur, id],
                (err, doublon) => {
                    if (err) return res.status(500).json({ error: err });
                    if (doublon.length > 0) {
                        return res.status(409).json({ error: 'Un compte avec cette description et cette banque existe déjà.' });
                    }
                    updateCompte();
                }
            );
        } else if (fields.descriptionCompte || fields.nomBanque) {
            // Si un seul des deux champs est modifié, il faut récupérer la valeur de l'autre champ pour vérifier le doublon
            const champDesc = fields.descriptionCompte ? fields.descriptionCompte : undefined;
            const champBanque = fields.nomBanque ? fields.nomBanque : undefined;
            db.query('SELECT descriptionCompte, nomBanque FROM compte WHERE idCompte = ?', [id], (err, results) => {
                if (err) return res.status(500).json({ error: err });
                if (results.length === 0) return res.status(404).json({ error: 'Compte non trouvé' });
                const desc = champDesc || results[0].descriptionCompte;
                const banque = champBanque || results[0].nomBanque;
                db.query(
                    'SELECT idCompte FROM compte WHERE descriptionCompte = ? AND nomBanque = ? AND idUtilisateur = ? AND idCompte != ?',
                    [desc, banque, idUtilisateur, id],
                    (err, doublon) => {
                        if (err) return res.status(500).json({ error: err });
                        if (doublon.length > 0) {
                            return res.status(409).json({ error: 'Un compte avec cette description et cette banque existe déjà.' });
                        }
                        updateCompte();
                    }
                );
            });
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

/**
 * @swagger
 * /api/comptes/{id}:
 *   delete:
 *     summary: Supprime un compte
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Supprimé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Introuvable
 *       415:
 *         description: Format non supporté
 */

// DELETE /api/comptes/:id (suppression, protégé et filtré)
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