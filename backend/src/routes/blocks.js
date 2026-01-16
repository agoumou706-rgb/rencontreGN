const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /blocks/:userId
router.post("/:userId", auth, async (req, res) => {
  const blockedId = Number(req.params.userId);
  const blockerId = req.user.id;

  if (!blockedId || blockedId === blockerId) {
    return res.status(400).json({ ok: false, message: "userId invalide" });
  }

  try {
    await db.query(
      "INSERT IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)",
      [blockerId, blockedId]
    );
    res.json({ ok: true, blocked: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /blocks/me
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.blocked_id AS user_id, u.name, u.city, u.gender, b.created_at
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ ok: true, count: rows.length, blocks: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /blocks/:userId
router.delete("/:userId", auth, async (req, res) => {
  try {
    const blockedId = Number(req.params.userId);
    if (!blockedId) return res.status(400).json({ ok: false, message: "userId invalide" });

    const [result] = await db.query(
      "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [req.user.id, blockedId]
    );

    res.json({ ok: true, unblocked: result.affectedRows > 0 });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;