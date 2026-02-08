import nodemailer from "nodemailer";
import multer from "multer";

// Configure multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

export const contactRoute = [
  upload.single("photo"), // optional file upload
  async (req, res) => {
    try {
      const { name, email, message } = req.body;
      const photo = req.file; // multer gives you this if uploaded

      // --- validation ---
      if (!name || !message) {
        return res.status(400).json({ error: "Name and message are required." });
      }

      // --- file validation ---
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

      const attachments = [];
      if (photo) {
        if (!allowedTypes.includes(photo.mimetype)) {
          return res
            .status(400)
            .json({ error: "Only PNG, JPG, JPEG, and WEBP images are allowed." });
        }

        if (photo.size > MAX_FILE_SIZE) {
          return res
            .status(400)
            .json({ error: "Image is too large. Max allowed size is 2MB." });
        }

        attachments.push({
          filename: photo.originalname,
          content: photo.buffer,
          contentType: photo.mimetype,
        });
      }

      console.log("EMAIL_USER:", process.env.EMAIL_USER);
      console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
      console.log("EMAIL_TO:", process.env.EMAIL_TO);

      // --- nodemailer ---
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: "New Contact Form Submission",
        text: `
New contact form message:

Name: ${name}
Email: ${email || "Not provided"}

Message:
${message}
        `,
        attachments,
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("CONTACT API ERROR:", err);
      return res.status(500).json({ error: "Something went wrong sending the email." });
    }
  },
];
