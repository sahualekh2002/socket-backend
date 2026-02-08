const express = require("express");
const multer = require("multer");
const sendMail = require("../utils/mailer");

const router = express.Router();

// File upload
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const photo = req.file;

    if (!name || !message) {
      return res.status(400).json({ error: "Name and message are required." });
    }

    // Prepare attachments
    let attachments = [];
    if (photo) {
      attachments.push({
        filename: photo.originalname || "screenshot.png",
        content: photo.buffer,
        contentType: photo.mimetype,
      });
    }

    await sendMail({ name, email, message, attachments });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("CONTACT FORM ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to send email." });
  }
});

module.exports = router;
