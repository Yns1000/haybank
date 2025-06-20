const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Virement:
 *       type: object
 *       properties:
 *         idVirement:
 *           type: integer
 *         idCompteDebit:
 *           type: integer
 *         idCompteCredit:
 *           type: integer
 *         montant:
 *           type: number
 *         dateVirement:
 *           type: string
 *           format: date
 *         idTiers:
 *           type: integer
 *         idCategorie:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   - name: Virements
 *     description: Gestion des virements
 */

/**
 * @swagger
 * /api/virements:
 *   get:
 *     summary: Récupère la liste de tous les virements de l'utilisateur
 *     tags: [Virements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "OK : Retourne un tableau d'objets Virement"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Virement'
 *       204:
 *         description: "No Content : Aucun virement trouvé pour l'utilisateur"
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
    db.query('SELECT idCompte FROM compte WHERE idUtilisateur = ?', [idUtilisateur], (err, comptes) => {
        if (err) return res.status(500).json({ error: err });
        const ids = comptes.map(c => c.idCompte);
        if (ids.length === 0) return res.status(204).send();

        db.query(
            'SELECT * FROM virement WHERE idCompteDebit IN (?) OR idCompteCredit IN (?)',
            [ids, ids],
            (err, results) => {
                if (err) return res.status(500).json({ error: err });
                if (results.length === 0) return res.status(204).send();
                return res.status(200).json(results);
            }
        );
    });
});

/**
 * @swagger
 * /api/virements/{id}:
 *   get:
 *     summary: Récupère les détails d'un virement spécifique appartenant à l'utilisateur
 *     tags: [Virements]
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
 *         description: "OK : Retourne le virement"
 *       404:
 *         description: "Not Found : Virement introuvable pour l'utilisateur"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
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

    const idUtilisateur = req.user.idUtilisateur;
    const idV = req.params.id;

    db.query('SELECT idCompte FROM compte WHERE idUtilisateur = ?', [idUtilisateur], (err, comptes) => {
        if (err) return res.status(500).json({ error: err });
        const ids = comptes.map(c => c.idCompte);
        if (ids.length === 0) return res.status(404).json({ error: 'Virement introuvable pour l\'utilisateur' });

        db.query(
            'SELECT * FROM virement WHERE idVirement = ? AND (idCompteDebit IN (?) OR idCompteCredit IN (?))',
            [idV, ids, ids],
            (err, results) => {
                if (err) return res.status(500).json({ error: err });
                if (results.length === 0) return res.status(404).json({ error: 'Virement introuvable pour l\'utilisateur' });
                return res.status(200).json(results[0]);
            }
        );
    });
});

/**
 * @swagger
 * /api/virements:
 *   post:
 *     summary: Crée un nouveau virement
 *     tags: [Virements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required:
 *               - idCompteDebit
 *               - idCompteCredit
 *               - montant
 *               - dateVirement
 *             properties:
 *               idCompteDebit:
 *                 type: integer
 *               idCompteCredit:
 *                 type: integer
 *               montant:
 *                 type: number
 *               dateVirement:
 *                 type: string
 *                 format: date
 *               idTiers:
 *                 type: integer
 *               idCategorie:
 *                 type: integer
 *     responses:
 *       201:
 *         description: "Created : Virement créé, retourne l'objet Virement"
 *       400:
 *         description: "Bad Request : Données invalides"
 *       401:
 *         description: "Unauthorized : Jeton manquant ou invalide"
 *       406:
 *         description: "Not acceptable : Format de réponse non valide"
 *       409:
 *         description: "Conflict : Comptes identiques"
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

    const { idCompteDebit, idCompteCredit, montant, dateVirement, idTiers, idCategorie } = req.body;
    const idUtilisateur = req.user.idUtilisateur;

    if (!idCompteDebit || !idCompteCredit || idCompteDebit === idCompteCredit) {
        return res.status(409).json({ error: 'Comptes identiques.' });
    }
    if (!montant || typeof montant !== 'number' || montant <= 0) {
        return res.status(400).json({ error: 'Montant invalide.' });
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateVirement)) {
        return res.status(400).json({ error: 'Date invalide.' });
    }

    db.query(
        'SELECT idCompte FROM compte WHERE idCompte IN (?, ?) AND idUtilisateur = ?',
        [idCompteDebit, idCompteCredit, idUtilisateur],
        (err, comptes) => {
            if (err) return res.status(500).json({ error: err });
            if (comptes.length < 2) {
                return res.status(400).json({ error: 'Comptes invalides ou non autorisés.' });
            }
            // Préparer les valeurs pour l'insertion, mettre null si non fourni
            const tiers = typeof idTiers === 'undefined' ? null : idTiers;
            const categorie = typeof idCategorie === 'undefined' ? null : idCategorie;
            db.query(
                'INSERT INTO virement (idCompteDebit, idCompteCredit, montant, dateVirement, idTiers, idCategorie) VALUES (?, ?, ?, ?, ?, ?)',
                [idCompteDebit, idCompteCredit, montant, dateVirement, tiers, categorie],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    return res.status(201).json({ idVirement: result.insertId, idCompteDebit, idCompteCredit, montant, dateVirement, idTiers: tiers, idCategorie: categorie });
                }
            );
        }
    );
});

module.exports = router;