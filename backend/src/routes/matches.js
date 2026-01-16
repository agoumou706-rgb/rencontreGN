const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /matches/me  (mes matchs)
router.get("/me", auth, async (req, res) => {
  try {
    const myId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        m.id AS match_id,
        CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END AS user_id,
        u.name, u.avatar_url, u.gender, u.city, u.bio,
        m.created_at
      FROM matches m
      JOIN users u
        ON u.id = CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END
      WHERE m.user1_id = ? OR m.user2_id = ?
      ORDER BY m.created_at DESC
      `,
      [myId, myId, myId, myId]
    );

    res.json({ ok: true, count: rows.length, matches: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;