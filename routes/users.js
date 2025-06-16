const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const auth = require('../middlewares/auth');


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

// GET /utilisateurs (infos de l'utilisateur connecté)
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


// POST /utilisateurs
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

// PATCH /utilisateurs/:id
router.patch('/:id', auth, async (req, res) => {
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

  const id = req.params.id;
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

// DELETE /utilisateurs/:id
router.delete('/:id', auth, (req, res) => {
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

  const id = req.params.id;
  db.query('DELETE FROM utilisateur WHERE idUtilisateur = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.status(200).json({ message: 'Utilisateur supprimé' });
  });
});

module.exports = router;

