// ---------------------------
// STRANGER CHAT SERVER + CONTACT FORM
// ---------------------------

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");

// ---------------------------
// APP SETUP
// ---------------------------
const app = express();

// Enable JSON parsing for API requests
app.use(express.json());

// CORS for frontend (replace with your Vercel URL)
app.use(cors({
  origin: [
    "https://strange-frontend-updated2.vercel.app",
    "https://strangerschat.fun",
    "https://strangchat.in"
  ],
  methods: ["POST", "GET"]
}));


// For file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

// ---------------------------
// CONTACT FORM ROUTE
// ---------------------------
app.post("/send", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const photo = req.file;

    if (!name || !message) {
      return res.status(400).json({ error: "Name and message are required." });
    }

    // Prepare attachments if photo uploaded
    let attachments = [];
    if (photo) {
      attachments.push({
        filename: photo.originalname || "screenshot.png",
        content: photo.buffer,
        contentType: photo.mimetype,
      });
    }

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: "New Contact Form Submission",
      text: `New contact form message:\n\nName: ${name}\nEmail: ${email || "Not provided"}\nMessage:\n${message}`,
      attachments,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("CONTACT FORM ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to send email." });
  }
});

// ---------------------------
// SOCKET.IO SETUP
// ---------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // allow any origin for socket.io
});

// ---------------------------
// GLOBAL VARIABLES
// ---------------------------
let waitingUser = null;   // socket waiting for a stranger
let onlineUsers = 0;      // total connected users

// ---------------------------
// SOCKET CONNECTION
// ---------------------------
io.on("connection", (socket) => {
  onlineUsers++;

  // 🔔 Notify all users of online count (existing)
  io.emit("status", {
    type: "online",
    count: onlineUsers,
  });

  // ✅ ADD THIS (for /counter page)
  io.emit("online-users", onlineUsers);

  console.log("USER CONNECTED:", socket.id);

  // Initialize socket properties
  socket.partner = null;   // connected stranger
  socket.isWaiting = false;

  // ---------------- JOIN CHAT ----------------
  socket.on("join", () => {
    console.log("JOIN REQUEST:", socket.id);

    socket.emit("status", {
      type: "searching",
      message: "Searching for a stranger...",
    });

    if (socket.partner || socket.isWaiting) return;

    if (waitingUser && waitingUser.id !== socket.id) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.isWaiting = false;
      waitingUser.isWaiting = false;

      socket.emit("matched");
      waitingUser.emit("matched");

      socket.emit("status", {
        type: "matched",
        message: "You are now connected to a stranger",
      });

      waitingUser.emit("status", {
        type: "matched",
        message: "You are now connected to a stranger",
      });

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.isWaiting = true;

      socket.emit("status", {
        type: "waiting",
        message: "Waiting for another user...",
      });
    }
  });

  // ---------------- MESSAGE ----------------
  socket.on("message", (msg) => {
    if (!socket.partner) return;
    socket.partner.emit("message", {
      sender: "stranger",
      text: msg,
    });
  });

  // ---------------- TYPING INDICATOR ----------------
  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  // ---------------- DISCONNECT ----------------
  socket.on("disconnect", () => {
    onlineUsers--;

    // Update all users with online count (existing)
    io.emit("status", {
      type: "online",
      count: onlineUsers,
    });

    // ✅ ADD THIS (for /counter page)
    io.emit("online-users", onlineUsers);

    console.log("USER DISCONNECTED:", socket.id);

    if (socket.partner) {
      socket.partner.emit("message", {
        sender: "system",
        text: "Stranger disconnected.",
      });

      socket.partner.emit("status", {
        type: "disconnected",
        message: "Stranger left the chat",
      });

      socket.partner.partner = null;
      socket.partner.isWaiting = false;
    }

    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }

    socket.partner = null;
    socket.isWaiting = false;
  });
});

// ---------------------------
// START SERVER
// ---------------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
