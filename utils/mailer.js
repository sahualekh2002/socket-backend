const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
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
