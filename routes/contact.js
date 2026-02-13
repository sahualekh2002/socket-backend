const express = require("express");
const multer = require("multer");
const db = require("../config/db");

const router = express.Router();

// Store file in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/", upload.single("photo"), (req, res) => {
  try {
    const { name, email, message } = req.body;
    const photo = req.file ? req.file.buffer : null;

    if (!name || !message) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const sql = `
      INSERT INTO contact_messages (name, email, message, photo)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [name, email, message, photo], (err, result) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      console.log("Message saved to database ✅");
      return res.status(200).json({ success: true });
    });

  } catch (err) {
    console.error("Contact Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});





// GET all messages (Admin)
router.get("/all", (req, res) => {
  const sql = `
    SELECT id, name, email, message, created_at
    FROM contact_messages
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Fetch Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.status(200).json(results);
  });
});


// GET screenshot by id
router.get("/photo/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT photo FROM contact_messages WHERE id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).send("Image not found");
      }

      const photo = results[0].photo;

      if (!photo) {
        return res.status(404).send("No image");
      }

      res.setHeader("Content-Type", "image/jpeg");
      res.send(photo);
    }
  );
});


module.exports = router;
