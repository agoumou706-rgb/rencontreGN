const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

const MAX_LEN = 500;
const MAX_MESSAGES = 200;

/** Vérifier que l'utilisateur appartient au match */
async function userInMatch(matchId, userId) {
  const [rows] = await db.query(
    "SELECT id FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?) LIMIT 1",
    [matchId, userId, userId]
  );
  return rows.length > 0;
}

/** Récupérer l'autre user du match (renvoie otherId) */
async function getOtherUserId(matchId, myId) {
  const [mrows] = await db.query(
    "SELECT user1_id, user2_id FROM matches WHERE id = ? LIMIT 1",
    [matchId]
  );

  if (!mrows.length) return null;

  const { user1_id, user2_id } = mrows[0];
  return user1_id === myId ? user2_id : user1_id;
}

/** Vérifier si blocage entre 2 users (dans un sens ou l'autre) */
async function isBlockedBetween(userA, userB) {
  const [rows] = await db.query(
    `SELECT id FROM blocks
     WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)
     LIMIT 1`,
    [userA, userB, userB, userA]
  );
  return rows.length > 0;
}

/**
 * GET /messages/inbox
 * Liste des conversations (matchs) + dernier message + unread_count
 * Exclut les conversations bloquées (dans les 2 sens)
 */
router.get("/inbox", auth, async (req, res) => {
  try {
    const myId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        m.id AS match_id,
        CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END AS user_id,
        u.name, u.city, u.gender, u.avatar_url,

        lm.content AS last_message,
        lm.created_at AS last_message_at,

        (
          SELECT COUNT(*)
          FROM messages mm
          WHERE mm.match_id = m.id
            AND mm.sender_id <> ?
            AND mm.read_at IS NULL
        ) AS unread_count

      FROM matches m
      JOIN users u
        ON u.id = CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END

      LEFT JOIN (
        SELECT mm.match_id, mm.content, mm.created_at
        FROM messages mm
        JOIN (
          SELECT match_id, MAX(created_at) AS max_created
          FROM messages
          GROUP BY match_id
        ) x ON x.match_id = mm.match_id AND x.max_created = mm.created_at
      ) lm ON lm.match_id = m.id

      WHERE (m.user1_id = ? OR m.user2_id = ?)
        AND NOT EXISTS (
          SELECT 1
          FROM blocks b
          WHERE (b.blocker_id = ? AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = ?)
        )

      ORDER BY COALESCE(lm.created_at, m.created_at) DESC
      `,
      [myId, myId, myId, myId, myId, myId, myId]
    );

    res.json({ ok: true, count: rows.length, inbox: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * GET /messages/:matchId
 * Liste des messages d'un match + marque comme lus les messages reçus
 */
router.get("/:matchId", auth, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    if (!matchId) return res.status(400).json({ ok: false, message: "matchId invalide" });

    const myId = req.user.id;

    const allowed = await userInMatch(matchId, myId);
    if (!allowed) return res.status(403).json({ ok: false, message: "Accès refusé" });

    const otherId = await getOtherUserId(matchId, myId);
    if (!otherId) return res.status(404).json({ ok: false, message: "Match introuvable" });

    const blocked = await isBlockedBetween(myId, otherId);
    if (blocked) return res.status(403).json({ ok: false, message: "Conversation bloquée" });

    // ✅ Marquer comme lus les messages reçus (ceux envoyés par l'autre)
    await db.query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE match_id = ?
         AND sender_id <> ?
         AND read_at IS NULL`,
      [matchId, myId]
    );

    const [rows] = await db.query(
      `SELECT id, match_id, sender_id, content, created_at, read_at
       FROM messages
       WHERE match_id = ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [matchId, MAX_MESSAGES]
    );

    res.json({ ok: true, count: rows.length, messages: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * POST /messages/:matchId
 * Envoyer un message
 */
router.post("/:matchId", auth, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    const myId = req.user.id;
    const content = (req.body?.content || "").trim();

    if (!matchId) return res.status(400).json({ ok: false, message: "matchId invalide" });
    if (!content) return res.status(400).json({ ok: false, message: "content requis" });
    if (content.length > MAX_LEN) {
      return res.status(400).json({ ok: false, message: `Message trop long (max ${MAX_LEN})` });
    }

    const allowed = await userInMatch(matchId, myId);
    if (!allowed) return res.status(403).json({ ok: false, message: "Accès refusé" });

    const otherId = await getOtherUserId(matchId, myId);
    if (!otherId) return res.status(404).json({ ok: false, message: "Match introuvable" });

    const blocked = await isBlockedBetween(myId, otherId);
    if (blocked) return res.status(403).json({ ok: false, message: "Conversation bloquée" });

    const [result] = await db.query(
      "INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)",
      [matchId, myId, content]
    );

    res.json({ ok: true, message_id: result.insertId });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;