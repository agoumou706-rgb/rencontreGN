const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, gender, looking_for, city, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: "name, email, password requis" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ ok: false, message: "Email déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, gender, looking_for, city, bio) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, password_hash, gender || null, looking_for || null, city || null, bio || null]
    );

    res.json({ ok: true, user_id: result.insertId });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "email et password requis" });
    }

    const [rows] = await db.query("SELECT id, name, email, password_hash FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(401).json({ ok: false, message: "Identifiants invalides" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;