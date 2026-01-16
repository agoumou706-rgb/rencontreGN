const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /likes/:userId  (liker quelqu'un)
router.post("/:userId", auth, async (req, res) => {
  const likedId = Number(req.params.userId);
  const likerId = req.user.id;

  if (!likedId || likedId === likerId) {
    return res.status(400).json({ ok: false, message: "userId invalide" });
  }

  try {
    // ✅ Anti-spam: max 30 likes / 24h
    const [countRows] = await db.query(
      "SELECT COUNT(*) AS c FROM likes WHERE liker_id = ? AND created_at >= NOW() - INTERVAL 1 DAY",
      [likerId]
    );

    if (countRows[0].c >= 30) {
      return res
        .status(429)
        .json({ ok: false, message: "Limite de likes atteinte (30/24h)" });
    }

    // 1) Enregistrer le like (ignore si déjà liké)
    await db.query(
      "INSERT IGNORE INTO likes (liker_id, liked_id) VALUES (?, ?)",
      [likerId, likedId]
    );

    // 2) Vérifier si l'autre a déjà liké en retour => match
    const [back] = await db.query(
      "SELECT id FROM likes WHERE liker_id = ? AND liked_id = ? LIMIT 1",
      [likedId, likerId]
    );

    if (back.length) {
      // Pour éviter doublon match (1,2) et (2,1), on stocke dans l'ordre
      const user1 = Math.min(likerId, likedId);
      const user2 = Math.max(likerId, likedId);

      await db.query(
        "INSERT IGNORE INTO matches (user1_id, user2_id) VALUES (?, ?)",
        [user1, user2]
      );

      return res.json({ ok: true, liked: true, match: true });
    }

    return res.json({ ok: true, liked: true, match: false });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /likes/me/outgoing (mes likes sortants)
router.get("/me/outgoing", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.liked_id AS user_id, u.name, u.city, u.gender, l.created_at
       FROM likes l
       JOIN users u ON u.id = l.liked_id
       WHERE l.liker_id = ?
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );

    res.json({ ok: true, count: rows.length, likes: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
// DELETE /likes/me/reset  (DEV) : supprimer tous mes likes sortants
router.delete("/me/reset", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM likes WHERE liker_id = ?", [req.user.id]);
    res.json({ ok: true, reset: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
module.exports = router;