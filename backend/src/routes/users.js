const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const devOnly = require("../middleware/devOnly");

const router = express.Router();

// GET /users/me (protégé)
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, avatar_url, gender, looking_for, city, bio, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: "Utilisateur introuvable" });
    }

    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /users/me (protégé) : modifier mon profil
router.put("/me", auth, async (req, res) => {
  try {
    const { name, gender, looking_for, city, bio } = req.body;

    if (name && name.length > 80) {
      return res.status(400).json({ ok: false, message: "name trop long (max 80)" });
    }
    if (city && city.length > 80) {
      return res.status(400).json({ ok: false, message: "city trop long (max 80)" });
    }
    if (gender && gender.length > 20) {
      return res.status(400).json({ ok: false, message: "gender trop long (max 20)" });
    }
    if (looking_for && looking_for.length > 20) {
      return res.status(400).json({ ok: false, message: "looking_for trop long (max 20)" });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({ ok: false, message: "bio trop longue (max 500)" });
    }

    await db.query(
      `UPDATE users
       SET
         name = COALESCE(?, name),
         gender = COALESCE(?, gender),
         looking_for = COALESCE(?, looking_for),
         city = COALESCE(?, city),
         bio = COALESCE(?, bio)
       WHERE id = ?`,
      [
        name ?? null,
        gender ?? null,
        looking_for ?? null,
        city ?? null,
        bio ?? null,
        req.user.id,
      ]
    );

    res.json({ ok: true, updated: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /users/browse (intelligent)
router.get("/browse", auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const { city, gender } = req.query;

    // 1) Mon profil (préférences)
    const [meRows] = await db.query(
      "SELECT gender, looking_for, city FROM users WHERE id = ? LIMIT 1",
      [myId]
    );
    const me = meRows[0] || {};

    // 2) Filtres effectifs
    const effectiveCity = city || me.city || null;
    const effectiveGender = gender || me.looking_for || null;

    // 3) Exclure moi-même + déjà likés + déjà passés + bloqués (dans les 2 sens)
    let sql = `
      SELECT id, name, avatar_url, gender, looking_for, city, bio, created_at
      FROM users
      WHERE id <> ?
        AND id NOT IN (SELECT liked_id FROM likes WHERE liker_id = ?)
        AND id NOT IN (SELECT passed_id FROM passes WHERE passer_id = ?)
        AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
        AND id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
    `;
    const params = [myId, myId, myId, myId, myId];

    if (effectiveCity) {
      sql += " AND city = ?";
      params.push(effectiveCity);
    }
    if (effectiveGender) {
      sql += " AND gender = ?";
      params.push(effectiveGender);
    }

    sql += " ORDER BY created_at DESC LIMIT 50";

    const [rows] = await db.query(sql, params);

    res.json({
      ok: true,
      filters_used: { city: effectiveCity, gender: effectiveGender },
      count: rows.length,
      users: rows,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ✅ DEV: set avatar_url for any user (pour seed rapidement)
// - Protégée: seulement en development
// - Optionnel: auth pour éviter usage random pendant le dev
router.put("/dev/:id/avatar", auth, devOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { avatar_url } = req.body;

    if (!id) return res.status(400).json({ ok: false, message: "id invalide" });
    if (!avatar_url || typeof avatar_url !== "string") {
      return res.status(400).json({ ok: false, message: "avatar_url requis" });
    }

    await db.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, id]);
    res.json({ ok: true, updated: true, id, avatar_url });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;