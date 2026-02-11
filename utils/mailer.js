

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // ✅ use 587 (NOT 465)
  secure: false,      // ✅ false for 587
  // family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


module.exports = async function sendMail({ name, email, message, attachments = [] }) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: "New Contact Form Submission",
    text: `New contact form message:\n\nName: ${name}\nEmail: ${email || "Not provided"}\nMessage:\n${message}`,
    attachments,
  });
};
