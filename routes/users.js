const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /utilisateurs
router.get('/', (req, res) => {
  db.query('SELECT * FROM Utilisateur', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// GET /utilisateurs/:id
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM Utilisateur WHERE idUtilisateur = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

// POST /utilisateurs
router.post('/', (req, res) => {
  const { nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal } = req.body;
  db.query(
    'INSERT INTO Utilisateur (nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ idUtilisateur: result.insertId, nomUtilisateur, prenomUtilisateur, login, mdp, hashcode, ville, codePostal });
    }
  );
});

// PATCH /utilisateurs/:id
router.patch('/:id', (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => fields[key]);
  values.push(id);

  db.query(
    `UPDATE Utilisateur SET ${setClause} WHERE idUtilisateur = ?`,
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
  db.query('DELETE FROM Utilisateur WHERE idUtilisateur = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Utilisateur supprimé' });
  });
});

module.exports = router;
// PUT /users/:id
router.put('/:id', (req, res) => {
  const { name, email } = req.body;
  db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id: req.params.id, name, email });
  });
});

// DELETE /users/:id
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Utilisateur supprimé' });
  });
});

module.exports = router;
