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
 *     Tiers:
 *       type: object
 *       properties:
 *         idTiers:
 *           type: integer
 *           example: 1
 *         nomTiers:
 *           type: string
 *           example: "Dupont SARL"
 *         idUtilisateur:
 *           type: integer
 *           example: 2
 */

/**
 * @swagger
 * tags:
 *   - name: Tiers
 *     description: Gestion des tiers utilisateur
 */

/**
 * @swagger
 * /api/tiers:
 *   get:
 *     summary: Récupère la liste de tous les tiers de l'utilisateur connecté
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "OK : Retourne un tableau d'objets tiers"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tiers'
 *       204:
 *         description: "No Content : Aucun tiers trouvé"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       415:
 *         description: "Unsupported media type : Content-Type non supporté"
 *       500:
 *         description: "Internal Server Error : Erreur base de données"
 */
router.get('/', auth, (req, res) => {
    if (req.headers.accept && !req.headers.accept.includes('application/json') && req.headers.accept !== '*/*') {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT * FROM tiers WHERE idUtilisateur = ?', [idUtilisateur], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(204).send();
        return res.status(200).json(results);
    });
});
/**
 * @swagger
 * /api/tiers/{id}:
 *   get:
 *     summary: Récupère un tiers par son ID
 *     tags: [Tiers]
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
 *         description: "OK : Retourne l'objet tiers"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tiers'
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       404:
 *         description: "Not Found : Tier introuvable"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       415:
 *         description: "Unsupported media type : Content-Type non supporté"
 *       500:
 *         description: "Internal Server Error : Erreur base de données"
 */
router.get('/:id', auth, (req, res) => {
    if (req.headers.accept && !req.headers.accept.includes('application/json') && req.headers.accept !== '*/*') {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    const id = req.params.id;
    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT * FROM tiers WHERE idTiers = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0 || results[0].idUtilisateur !== idUtilisateur) {
            return res.status(404).json({ error: 'Tiers introuvable.' });
        }
        res.status(200).json(results[0]);
    });
});

/**
 * @swagger
 * /api/tiers:
 *   post:
 *     summary: Crée un nouveau tiers associé à l'utilisateur
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required:
 *               - nomTiers
 *             properties:
 *               nomTiers:
 *                 type: string
 *                 description: "Nom du tiers (2 à 100 caractères)"
 *     responses:
 *       201:
 *         description: "Created : Tier créé, retourne un objet Tiers"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tiers'
 *       400:
 *         description: "Bad Request : Données invalides"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       409:
 *         description: "Conflict : Nom déjà existant"
 *       415:
 *         description: "Unsupported media type : Content-Type non supporté"
 *       500:
 *         description: "Internal Server Error : Erreur base de données"
 */
router.post('/', auth, (req, res) => {
    if (req.headers.accept && !req.headers.accept.includes('application/json') && req.headers.accept !== '*/*') {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    const { nomTiers } = req.body;
    const idUtilisateur = req.user.idUtilisateur;
    if (!nomTiers || typeof nomTiers !== 'string' || nomTiers.length < 2 || nomTiers.length > 100) {
        return res.status(400).json({ error: 'nomTiers invalide : chaîne de 2 à 100 caractères.' });
    }
    db.query('SELECT idTiers FROM tiers WHERE nomTiers = ? AND idUtilisateur = ?', [nomTiers, idUtilisateur], (err, exists) => {
        if (err) return res.status(500).json({ error: err });
        if (exists.length > 0) return res.status(409).json({ error: 'Nom déjà existant.' });
        db.query('INSERT INTO tiers (nomTiers, idUtilisateur) VALUES (?, ?)', [nomTiers, idUtilisateur], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ idTiers: result.insertId, nomTiers, idUtilisateur });
        });
    });
});

/**
 * @swagger
 * /api/tiers/{id}/{nomTiers}:
 *   patch:
 *     summary: Met à jour le nom d’un tiers existant
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: nomTiers
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "OK : Tier modifié, retourne un objet Tiers"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tiers'
 *       400:
 *         description: "Bad Request : nomTiers invalide"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       404:
 *         description: "Not Found : Tier introuvable"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       409:
 *         description: "Conflict : tentative de nom déjà pris"
 *       415:
 *         description: "Unsupported media type : Content-Type non supporté"
 *       500:
 *         description: "Internal Server Error : Erreur base de données"
 */
router.patch('/:id/:nomTiers', auth, (req, res) => {
    if (req.headers.accept && !req.headers.accept.includes('application/json') && req.headers.accept !== '*/*') {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }

    const { id, nomTiers } = req.params;
    const idUtilisateur = req.user.idUtilisateur;
    if (!nomTiers || nomTiers.length < 2 || nomTiers.length > 100) {
        return res.status(400).json({ error: 'nomTiers invalide : 2 à 100 caractères.' });
    }
    db.query('SELECT * FROM tiers WHERE idTiers = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0 || results[0].idUtilisateur !== idUtilisateur) {
            return res.status(404).json({ error: 'Tiers introuvable.' });
        }
        db.query('SELECT idTiers FROM tiers WHERE nomTiers = ? AND idUtilisateur = ? AND idTiers != ?', [nomTiers, idUtilisateur, id], (err, dupe) => {
            if (err) return res.status(500).json({ error: err });
            if (dupe.length > 0) return res.status(409).json({ error: 'Nom déjà existant.' });
            db.query('UPDATE tiers SET nomTiers = ? WHERE idTiers = ?', [nomTiers, id], (err) => {
                if (err) return res.status(500).json({ error: err });
                res.status(200).json({ idTiers: id, nomTiers });
            });
        });
    });
});

/**
 * @swagger
 * /api/tiers:
 *   delete:
 *     summary: Supprimer tous les tiers existants de l'utilisateur
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "OK : Tiers supprimés"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       404:
 *         description: "Not Found : Aucun tiers à supprimer"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       409:
 *         description: "Conflict : Tiers liés à des mouvements"
 *       415:
 *         description: "Unsupported media type : Content-Type non supporté"
 *       500:
 *         description: "Internal Server Error : Erreur base de données"
 */
router.delete('/', auth, (req, res) => {
    if (req.headers.accept && !req.headers.accept.includes('application/json') && req.headers.accept !== '*/*') {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT idTiers FROM tiers WHERE idUtilisateur = ?', [idUtilisateur], (err, tiers) => {
        if (err) return res.status(500).json({ error: err });
        if (tiers.length === 0) return res.status(404).json({ error: 'Aucun tiers à supprimer.' });
        const ids = tiers.map(t => t.idTiers);
        db.query('SELECT COUNT(*) AS cnt FROM mouvement WHERE idTiers IN (?)', [ids], (err, resp) => {
            if (err) return res.status(500).json({ error: err });
            if (resp[0].cnt > 0) return res.status(409).json({ error: 'Tiers liés à des mouvements.' });
            db.query('DELETE FROM tiers WHERE idUtilisateur = ?', [idUtilisateur], (err) => {
                if (err) return res.status(500).json({ error: err });
                res.status(200).json({ message: 'Tous les tiers supprimés.' });
            });
        });
    });
});

/**
 * @swagger
 * /api/tiers/{id}:
 *   delete:
 *     summary: Supprime un tiers existant de l'utilisateur
 *     tags: [Tiers]
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
 *         description: "OK : Tier supprimé"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       404:
 *         description: "Not Found : Tier introuvable"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       409:
 *         description: "Conflict : Tier lié à des mouvements"
 *       415:
 *         description: "Unsupported media type : Content-Type non supporté"
 *       500:
 *         description: "Internal Server Error : Erreur base de données"
 */
router.delete('/:id', auth, (req, res) => {
    if (req.headers.accept && !req.headers.accept.includes('application/json') && req.headers.accept !== '*/*') {
        return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
    }
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
    }
    const id = req.params.id;
    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT * FROM tiers WHERE idTiers = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0 || results[0].idUtilisateur !== idUtilisateur) {
            return res.status(404).json({ error: 'Tiers introuvable.' });
        }
        db.query('SELECT COUNT(*) AS cnt FROM mouvement WHERE idTiers = ?', [id], (err, resp) => {
            if (err) return res.status(500).json({ error: err });
            if (resp[0].cnt > 0) return res.status(409).json({ error: 'Tier lié à des mouvements.' });
            db.query('DELETE FROM tiers WHERE idTiers = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: err });
                res.status(200).json({ message: 'Tiers supprimé.' });
            });
        });
    });
});

module.exports = router;
