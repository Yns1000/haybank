const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const auth = require('../middlewares/auth');


// Middleware pour vérifier le hashcode
router.post('/login', (req, res) => {
  const { login, mdp } = req.body;
  db.query('SELECT * FROM utilisateur WHERE login = ?', [login], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });
    const user = results[0];
    const valid = await bcrypt.compare(mdp, user.mdp);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    // Génère un hashcode/token
    const hashcode = crypto.randomBytes(32).toString('hex');
    db.query('UPDATE utilisateur SET hashcode = ? WHERE idUtilisateur = ?', [hashcode, user.idUtilisateur]);
    res.json({ hashcode });
  });
});

// GET /utilisateurs
router.get('/', (req, res) => {
  db.query('SELECT * FROM utilisateur', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// GET /utilisateurs/:id
router.get('/:id', auth, (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM utilisateur WHERE idUtilisateur = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

// POST /utilisateurs
router.post('/', async (req, res) => {
  const { nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal } = req.body;
  try {
    const hashMdp = mdp ? await bcrypt.hash(mdp, 10) : null;
    db.query(
        'INSERT INTO Utilisateur (nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal) VALUES (?, ?, ?, ?, ?, ?, ?)',
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

// PATCH /utilisateurs/:id
router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const fields = { ...req.body };
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

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
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Utilisateur mis à jour', idUtilisateur: id });
      }
  );
});

// DELETE /utilisateurs/:id
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM utilisateur WHERE idUtilisateur = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Utilisateur supprimé' });
  });
});

module.exports = router;

