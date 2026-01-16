const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// 📂 dossier uploads
const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🎛️ config multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `avatar_${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error("Format invalide (JPEG, PNG, WEBP uniquement)"),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 Mo
  },
});

// 📤 POST /uploads/avatar
router.post(
  "/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: "Aucun fichier envoyé",
        });
      }

      const avatarUrl = `/uploads/${req.file.filename}`;

      await db.query(
        "UPDATE users SET avatar_url = ? WHERE id = ?",
        [avatarUrl, req.user.id]
      );

      res.json({
        ok: true,
        avatar_url: avatarUrl,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        message: err.message,
      });
    }
  }
);

// ❌ gestion erreurs multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ ok: false, message: "Image trop lourde (max 2 Mo)" });
    }
  }

  if (err) {
    return res.status(400).json({ ok: false, message: err.message });
  }

  next();
});

module.exports = router;