require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const db = require("./db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const likeRoutes = require("./routes/likes");
const matchRoutes = require("./routes/matches");
const messageRoutes = require("./routes/messages");
const passRoutes = require("./routes/passes");
const blockRoutes = require("./routes/blocks");
const uploadRoutes = require("./routes/uploads");

const app = express();

/**
 * ✅ CORS
 * - Dev: http://localhost:5173
 * - Prod: FRONTEND_URL dans .env
 */
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // REST Client / Postman (origin undefined)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Sécurité headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ Anti-spam
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ✅ JSON body limité
app.use(express.json({ limit: "200kb" }));

// ✅ Fichiers uploadés (GET /uploads/xxx.jpg)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ✅ Routes API
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/likes", likeRoutes);
app.use("/matches", matchRoutes);
app.use("/messages", messageRoutes);
app.use("/passes", passRoutes);
app.use("/blocks", blockRoutes);

// ✅ Upload API (POST /uploads/avatar)
app.use("/uploads", uploadRoutes);

// ✅ Branding
app.get("/", (req, res) => {
  res.send("Bienvenue sur Deep Dating API 💜 — Plus qu’un match.");
});

// ✅ Healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, name: "deep-dating", time: new Date().toISOString() });
});

// ✅ DB check
app.get("/db-check", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({ ok: true, db: "connected", result: rows[0].result });
  } catch (err) {
    res.status(500).json({ ok: false, db: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Deep Dating API running on http://localhost:${PORT}`);
});