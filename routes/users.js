const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Utilisateur:
 *       type: object
 *       properties:
 *         idUtilisateur:
 *           type: integer
 *           example: 1
 *         nomUtilisateur:
 *           type: string
 *           example: "Doe"
 *         prenomUtilisateur:
 *           type: string
 *           example: "John"
 *         login:
 *           type: string
 *           example: "jdoe"
 *         ville:
 *           type: string
 *           example: "Paris"
 *         codePostal:
 *           type: string
 *           example: "75000"
 *         hashcode:
 *           type: string
 *           example: "aef123..."
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * tags:
 *   - name: Utilisateurs
 *     description: Gestion des utilisateurs et authentification
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authentifie un utilisateur
 *     tags: [Utilisateurs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [login, mdp]
 *             properties:
 *               login:
 *                 type: string
 *                 example: yns2
 *               mdp:
 *                 type: string
 *                 example: yns10
 *     responses:
 *       200:
 *         description: Hashcode renvoyé
 *       400:
 *         description: Champs manquants
 *       401:
 *         description: Identifiants invalides
 *       415:
 *         description: Format non supporté
 */

// Middleware pour vérifier le hashcode
router.post('/login', (req, res) => {
  // 415 Unsupported Media Type
  if (
      req.headers['content-type'] &&
      req.headers['content-type'] !== 'application/json'
  ) {
    return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
  }
  // 406 Not Acceptable
  if (
    req.headers['accept'] &&
    !req.headers['accept'].includes('application/json') &&
    req.headers['accept'] !== '*/*'
  ) {
    return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
  }

  const { login, mdp } = req.body;
  if (!login || !mdp) {
    return res.status(400).json({ error: 'Login et mot de passe requis.' });
  }

  db.query('SELECT * FROM utilisateur WHERE login = ?', [login], async (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });

    const user = results[0];
    let valid = false;
    try {
      valid = await bcrypt.compare(mdp, user.mdp);
    } catch (e) {
      return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe.' });
    }
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    // Génère un hashcode/token
    const hashcode = crypto.randomBytes(32).toString('hex');
    db.query('UPDATE utilisateur SET hashcode = ? WHERE idUtilisateur = ?', [hashcode, user.idUtilisateur], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.status(200).json({ hashcode });
    });
  });
});


/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Récupère l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilisateur'
 *       404:
 *         description: Non trouvé
 *       406:
 *         description: Format non acceptable
 */

// GET /users (infos de l'utilisateur connecté)
router.get('/', auth, (req, res) => {
  // 406 Not Acceptable
  if (
    req.headers['accept'] &&
    !req.headers['accept'].includes('application/json') &&
    req.headers['accept'] !== '*/*'
  ) {
    return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
  }

  const id = req.user.idUtilisateur;
  db.query('SELECT * FROM utilisateur WHERE idUtilisateur = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    // Ne retourne pas le mot de passe
    delete results[0].mdp;
    res.status(200).json(results[0]);
  });
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crée un utilisateur
 *     tags: [Utilisateurs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [login, mdp]
 *             properties:
 *               nomUtilisateur:
 *                 type: string
 *                 example: "Boughriet"
 *               prenomUtilisateur:
 *                 type: string
 *                 example: "Younes"
 *               login:
 *                 type: string
 *                 example: "yns2"
 *               mdp:
 *                 type: string
 *                 example: "yns10"
 *               ville:
 *                 type: string
 *                 example: "Lens"
 *               codePostal:
 *                 type: string
 *                 example: "62300"
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Champs manquants
 *       409:
 *         description: Login déjà utilisé
 *       415:
 *         description: Format non supporté
 */

// POST /users
router.post('/', async (req, res) => {
  // 415 Unsupported Media Type
  if (
    req.headers['content-type'] &&
    req.headers['content-type'] !== 'application/json'
  ) {
    return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
  }
  // 406 Not Acceptable
  if (
    req.headers['accept'] &&
    !req.headers['accept'].includes('application/json') &&
    req.headers['accept'] !== '*/*'
  ) {
    return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
  }

  const { nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal } = req.body;
  if (!login || !mdp) {
    return res.status(400).json({ error: 'Login et mot de passe requis.' });
  }

  db.query('SELECT idUtilisateur FROM utilisateur WHERE login = ?', [login], async (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length > 0) return res.status(409).json({ error: 'Login déjà utilisé.' });

    try {
      const hashMdp = await bcrypt.hash(mdp, 10);
      db.query(
        'INSERT INTO utilisateur (nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nomUtilisateur, prenomUtilisateur, login, hashMdp, hashcode, ville, codePostal],
        (err, result) => {
          if (err) return res.status(500).json({ error: err });
          res.status(201).json({ idUtilisateur: result.insertId, nomUtilisateur, prenomUtilisateur, login, ville, codePostal });
        }
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

/**
 * @swagger
 * /api/users:
 *   patch:
 *     summary: Modifie l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [login, mdp]
 *             properties:
 *               nomUtilisateur:
 *                 type: string
 *                 example: "Boughriet"
 *               prenomUtilisateur:
 *                 type: string
 *                 example: "Younes"
 *               login:
 *                 type: string
 *                 example: "yns2"
 *               mdp:
 *                 type: string
 *                 example: "yns10"
 *               ville:
 *                 type: string
 *                 example: "Lens"
 *               codePostal:
 *                 type: string
 *                 example: "62300"
 *     responses:
 *       200:
 *         description: Mise à jour réussie
 *       400:
 *         description: Aucun champ à mettre à jour
 *       409:
 *         description: Login déjà utilisé
 *       404:
 *         description: Utilisateur non trouvé
 *       415:
 *         description: Format non supporté
 */

// PATCH /users
router.patch('/', auth, async (req, res) => {
  // 415 Unsupported Media Type
  if (
    req.headers['content-type'] &&
    req.headers['content-type'] !== 'application/json'
  ) {
    return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
  }
  // 406 Not Acceptable
  if (
      req.headers['accept'] &&
      !req.headers['accept'].includes('application/json') &&
      req.headers['accept'] !== '*/*'
  ) {
    return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
  }

  const id = req.user.idUtilisateur;
  const fields = { ...req.body };
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

  // Vérifie si le login est déjà utilisé par un autre utilisateur
  if (fields.login) {
    const [err, results] = await new Promise(resolve => {
      db.query('SELECT idUtilisateur FROM utilisateur WHERE login = ? AND idUtilisateur != ?', [fields.login, id], (err, results) => {
        resolve([err, results]);
      });
    });
    if (err) return res.status(500).json({ error: err });
    if (results.length > 0) return res.status(409).json({ error: 'Login déjà utilisé.' });
  }

  // Si le mot de passe est présent, on le hash
  if (fields.mdp) {
    try {
      fields.mdp = await bcrypt.hash(fields.mdp, 10);
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors du hash du mot de passe.' });
    }
  }

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => fields[key]);
  values.push(id);

  db.query(
    `UPDATE utilisateur SET ${setClause} WHERE idUtilisateur = ?`,
    values,
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.status(201).json({ message: 'Utilisateur mis à jour', idUtilisateur: id });
    }
  );
});

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Supprime l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supprimé
 *       404:
 *         description: Introuvable
 *       415:
 *         description: Format non supporté
 */

// DELETE /users
router.delete('/', auth, (req, res) => {
  // 415 Unsupported Media Type
  if (
    req.headers['content-type'] &&
    req.headers['content-type'] !== 'application/json'
  ) {
    return res.status(415).json({ error: 'Format non supporté, veuillez utiliser JSON.' });
  }

  // 406 Not Acceptable
  if (
      req.headers['accept'] &&
      !req.headers['accept'].includes('application/json') &&
      req.headers['accept'] !== '*/*'
  ) {
    return res.status(406).json({ error: 'Format non acceptable, veuillez utiliser JSON.' });
  }

  const id = req.user.idUtilisateur;
  db.query('DELETE FROM utilisateur WHERE idUtilisateur = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.status(200).json({ message: 'Utilisateur supprimé' });
  });
});

module.exports = router;

