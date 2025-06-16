const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * components:
 *   schemas:
 *     Categorie:
 *       type: object
 *       required:
 *         - nomCategorie
 *       properties:
 *         idCategorie:
 *           type: integer
 *           example: 1
 *         nomCategorie:
 *           type: string
 *           example: "Informatique"
 */

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Opérations sur les catégories
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Récupère toutes les catégories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Liste retournée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categorie'
 *       204:
 *         description: Aucune catégorie
 *       415:
 *         description: Format non supporté
 */
router.get("/", (req, res) => {
  db.query("SELECT * FROM categorie", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(204).send();
    if (
      req.headers["content-type"] &&
      req.headers["content-type"] !== "application/json"
    ) {
      return res
        .status(415)
        .json({ error: "Format non supporté, veuillez utiliser JSON." });
    }
    res.json(results);
  });
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Récupère une catégorie par ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categorie'
 *       404:
 *         description: Catégorie non trouvée
 *       406:
 *         description: Format non acceptable
 *       415:
 *         description: Format non supporté
 */
router.get("/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM categorie WHERE idCategorie = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0)
        return res.status(404).json({ error: "Catégorie non trouvée" });
      if (
        req.headers["accept"] &&
        req.headers["accept"] !== "application/json"
      ) {
        return res
          .status(406)
          .json({ error: "Format non acceptable, veuillez utiliser JSON." });
      }
      if (
        req.headers["content-type"] &&
        req.headers["content-type"] !== "application/json"
      ) {
        return res
          .status(415)
          .json({ error: "Format non supporté, veuillez utiliser JSON." });
      }
      res.json(results[0]);
    }
  );
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crée une nouvelle catégorie
 *     tags: [Categories]
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required:
 *               - nomCategorie
 *             properties:
 *               nomCategorie:
 *                 type: string
 *                 example: "Finance"
 *     responses:
 *       201:
 *         description: Créée
 *       400:
 *         description: nomCategorie manquant
 *       406:
 *         description: Format non acceptable
 *       409:
 *         description: Doublon
 *       415:
 *         description: Format non supporté
 */

router.post("/", (req, res) => {
  if (
    req.headers["content-type"] &&
    req.headers["content-type"] !== "application/json"
  ) {
    return res
      .status(415)
      .json({ error: "Format non supporté, veuillez utiliser JSON." });
  }

  const { nomCategorie } = req.body;
  if (!nomCategorie) {
    return res
      .status(400)
      .json({ error: "Le nom de la catégorie est requis." });
  }

  db.query(
    "SELECT idCategorie FROM categorie WHERE nomCategorie = ?",
    [nomCategorie],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length > 0) {
        return res
          .status(409)
          .json({ error: "Nom de catégorie déjà utilisé." });
      }

      db.query(
        "INSERT INTO categorie (nomCategorie) VALUES (?)",
        [nomCategorie],
        (err, result) => {
          if (err) return res.status(500).json({ error: err });

          if (
            req.headers["accept"] &&
            !req.headers["accept"].includes("application/json") &&
            req.headers["accept"] !== "*/*"
          ) {
            return res.status(406).json({
              error: "Format non acceptable, veuillez utiliser JSON.",
            });
          }

          res.status(201).json({ idCategorie: result.insertId, nomCategorie });
        }
      );
    }
  );
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Modifie une catégorie
 *     tags: [Categories]
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
 *             required:
 *               - nomCategorie
 *             properties:
 *               nomCategorie:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mise à jour OK
 *       304:
 *         description: Non modifiée
 *       400:
 *         description: nomCategorie manquant
 *       404:
 *         description: Introuvable
 *       409:
 *         description: Doublon
 *       406:
 *         description: Format non acceptable
 *       415:
 *         description: Format non supporté
 */
router.put("/:id", (req, res) => {
  if (
    req.headers["content-type"] &&
    req.headers["content-type"] !== "application/json"
  ) {
    return res
      .status(415)
      .json({ error: "Format non supporté, veuillez utiliser JSON." });
  }
  if (
    req.headers["accept"] &&
    !req.headers["accept"].includes("application/json") &&
    req.headers["accept"] !== "*/*"
  ) {
    return res
      .status(406)
      .json({ error: "Format non acceptable, veuillez utiliser JSON." });
  }

  const id = req.params.id;
  const { nomCategorie } = req.body;
  if (!nomCategorie) {
    return res
      .status(400)
      .json({ error: "Le nom de la catégorie est requis." });
  }

  db.query(
    "SELECT * FROM categorie WHERE idCategorie = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0)
        return res.status(404).json({ error: "Catégorie non trouvée." });

      if (results[0].nomCategorie === nomCategorie) {
        return res
          .status(304)
          .json({ message: "Aucune modification détectée." });
      }

      db.query(
        "SELECT idCategorie FROM categorie WHERE nomCategorie = ? AND idCategorie != ?",
        [nomCategorie, id],
        (err, doublon) => {
          if (err) return res.status(500).json({ error: err });
          if (doublon.length > 0) {
            return res
              .status(409)
              .json({ error: "Nom de catégorie déjà utilisé." });
          }

          db.query(
            "UPDATE categorie SET nomCategorie = ? WHERE idCategorie = ?",
            [nomCategorie, id],
            (err) => {
              if (err) return res.status(500).json({ error: err });
              res
                .status(200)
                .json({ message: "Catégorie mise à jour", idCategorie: id });
            }
          );
        }
      );
    }
  );
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Supprime une catégorie
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Supprimée
 *       404:
 *         description: Introuvable
 *       406:
 *         description: Format non acceptable
 *       415:
 *         description: Format non supporté
 */
router.delete("/:id", (req, res) => {
  if (
    req.headers["content-type"] &&
    req.headers["content-type"] !== "application/json"
  ) {
    return res
      .status(415)
      .json({ error: "Format non supporté, veuillez utiliser JSON." });
  }

  if (
    req.headers["accept"] &&
    !req.headers["accept"].includes("application/json") &&
    req.headers["accept"] !== "*/*"
  ) {
    return res
      .status(406)
      .json({ error: "Format non acceptable, veuillez utiliser JSON." });
  }

  const id = req.params.id;
  db.query(
    "DELETE FROM categorie WHERE idCategorie = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Catégorie non trouvée" });
      }
      res.status(200).json({ message: "Catégorie supprimée" });
    }
  );
});

module.exports = router;
