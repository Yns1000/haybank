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
 *     Mouvement:
 *       type: object
 *       required:
 *         - dateMouvement
 *         - idCompte
 *         - idTiers
 *         - idCategorie
 *         - montant
 *         - typeMouvement
 *       properties:
 *         dateMouvement:
 *           type: string
 *           format: date
 *           example: "2025-06-20"
 *         idCompte:
 *           type: integer
 *           example: 3
 *         idTiers:
 *           type: integer
 *           example: 1
 *         idCategorie:
 *           type: integer
 *           example: 2
 *         idSousCategorie:
 *           type: integer
 *           example: 2
 *           nullable: true
 *         idVirement:
 *           type: integer
 *           nullable: true
 *           example: null
 *         montant:
 *           type: number
 *           example: 120.5
 *         typeMouvement:
 *           type: string
 *           enum: ["D", "C"]
 *           example: "D"
 *
 * tags:
 *   - name: Mouvements
 *     description: Gestion des mouvements utilisateurs
 */

/**
 * @swagger
 * /api/mouvements:
 *   get:
 *     summary: Récupère la liste des mouvements de l'utilisateur
 *     tags: [Mouvements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mouvement'
 *       204:
 *         description: Aucun mouvement
 *       401:
 *         description: Unauthorized
 *       406:
 *         description: Not acceptable
 *       500:
 *         description: Internal Server Error
 */
router.get('/', auth, (req, res) => {
    if (req.headers['accept'] && !req.headers['accept'].includes('application/json') && req.headers['accept'] !== '*/*')
        return res.status(406).json({ error: 'Format non acceptable' });

    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT idCompte FROM compte WHERE idUtilisateur = ?', [idUtilisateur], (err, comptes) => {
        if (err) return res.status(500).json({ error: err });
        if (comptes.length === 0) return res.status(204).send();

        const compteIds = comptes.map(c => c.idCompte);
        db.query('SELECT * FROM mouvement WHERE idCompte IN (?)', [compteIds], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length === 0) return res.status(204).send();
            res.status(200).json(results);
        });
    });
});

/**
 * @swagger
 * /api/mouvements/{id}:
 *   get:
 *     summary: Récupère les détails d'un mouvement par son ID
 *     tags: [Mouvements]
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
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mouvement'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       406:
 *         description: Not acceptable
 *       415:
 *         description: Unsupported Media Type
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', auth, (req, res) => {
    if (req.headers['accept'] && !req.headers['accept'].includes('application/json') && req.headers['accept'] !== '*/*')
        return res.status(406).json({ error: 'Format non acceptable' });
    if (req.headers['content-type'] && req.headers['content-type'] !== 'application/json')
        return res.status(415).json({ error: 'Format non supporté' });

    const id = req.params.id;
    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT * FROM mouvement WHERE idMouvement = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Mouvement introuvable' });

        const idCompte = results[0].idCompte;
        db.query('SELECT * FROM compte WHERE idCompte = ? AND idUtilisateur = ?', [idCompte, idUtilisateur], (err, comptes) => {
            if (err) return res.status(500).json({ error: err });
            if (comptes.length === 0) return res.status(403).json({ error: 'Accès interdit' });
            res.status(200).json(results[0]);
        });
    });
});

/**
 * @swagger
 * /api/mouvements:
 *   post:
 *     summary: Crée un nouveau mouvement
 *     tags: [Mouvements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mouvement'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mouvement'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict
 *       415:
 *         description: Unsupported Media Type
 *       406:
 *         description: Not acceptable
 *       500:
 *         description: Internal Server Error
 */

router.post('/', auth, (req, res) => {
    if (req.headers['content-type'] !== 'application/json')
        return res.status(415).json({ error: 'Format non supporté' });
    if (req.headers['accept'] && !req.headers['accept'].includes('application/json') && req.headers['accept'] !== '*/*')
        return res.status(406).json({ error: 'Format non acceptable' });

    const { dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, idVirement, montant, typeMouvement } = req.body;

    if (
        dateMouvement == null ||
        idCompte == null ||
        idTiers == null ||
        idCategorie == null ||
        montant == null ||
        typeMouvement == null
    ) {
        return res.status(400).json({ error: 'Champs manquants ou invalides' });
    }

    if (!["D", "C"].includes(typeMouvement))
        return res.status(409).json({ error: 'Conflit : typeMouvement invalide (doit être D ou C)' });

    if (typeof montant !== 'number' || isNaN(montant) || montant === 0) {
        return res.status(400).json({ error: 'Le montant doit être un nombre non nul' });
    }

    let montantSigne;
    let avertissement = null;

    if (typeMouvement === "D") {
        // Débit : doit être négatif
        if (montant > 0) {
            montantSigne = -montant;
            avertissement = "Montant positif converti en négatif pour le débit";
        } else {
            montantSigne = montant;
        }
    } else {
        // Crédit : doit être positif
        if (montant < 0) {
            montantSigne = -montant;
            avertissement = "Montant négatif converti en positif pour le crédit";
        } else {
            montantSigne = montant;
        }
    }

    const idUtilisateur = req.user.idUtilisateur;
    db.query('SELECT * FROM compte WHERE idCompte = ? AND idUtilisateur = ?', [idCompte, idUtilisateur], (err, comptes) => {
        if (err) return res.status(500).json({ error: err });
        if (comptes.length === 0) return res.status(403).json({ error: 'Accès interdit au compte spécifié' });

        db.query(
            'INSERT INTO mouvement (dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, idVirement, montant, typeMouvement) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, idVirement, montantSigne, typeMouvement],
            (err, result) => {
                if (err) return res.status(500).json({ error: err });

                const response = {
                    idMouvement: result.insertId,
                    dateMouvement,
                    idCompte,
                    idTiers,
                    idCategorie,
                    idSousCategorie,
                    idVirement,
                    montant: montantSigne,
                    typeMouvement
                };

                if (avertissement) {
                    response.avertissement = avertissement;
                }

                res.status(201).json(response);
            }
        );
    });
});
module.exports = router;
