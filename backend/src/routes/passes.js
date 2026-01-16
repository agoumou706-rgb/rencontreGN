const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /passes/:userId  (pass / swipe left)
router.post("/:userId", auth, async (req, res) => {
  const passedId = Number(req.params.userId);
  const passerId = req.user.id;

  if (!passedId || passedId === passerId) {
    return res.status(400).json({ ok: false, message: "userId invalide" });
  }

  try {
    await db.query(
      "INSERT IGNORE INTO passes (passer_id, passed_id) VALUES (?, ?)",
      [passerId, passedId]
    );
    res.json({ ok: true, passed: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /passes/me  (liste des profils passés)
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.passed_id AS user_id, u.name, u.city, u.gender, u.bio, p.created_at
       FROM passes p
       JOIN users u ON u.id = p.passed_id
       WHERE p.passer_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ ok: true, count: rows.length, passes: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /passes/:userId  (undo pass)
router.delete("/:userId", auth, async (req, res) => {
  try {
    const passedId = Number(req.params.userId);
    if (!passedId) {
      return res.status(400).json({ ok: false, message: "userId invalide" });
    }

    const [result] = await db.query(
      "DELETE FROM passes WHERE passer_id = ? AND passed_id = ?",
      [req.user.id, passedId]
    );

    res.json({ ok: true, undone: result.affectedRows > 0 });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;