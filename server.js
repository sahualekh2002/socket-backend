require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

// ---------------- BASIC MIDDLEWARE ----------------
app.use(express.json());

// ---------------- CORS CONFIG ----------------
const allowedOrigins = [
  "https://strange-frontend-updated2.vercel.app",
  "https://strangerschat.fun",
  "https://www.strangerschat.fun",
  "https://strangchat.in",
  "https://www.strangchat.in",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        return callback(new Error("CORS not allowed for this origin"));
      }

      return callback(null, true);
    },
    credentials: true
  })
);

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.status(200).send("🚀 StrangerChat Socket Server Running");
});

// ---------------- CREATE HTTP SERVER ----------------
const server = http.createServer(app);

// ---------------- SOCKET.IO ----------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// ---------------- CHAT SOCKET ----------------
require("./socket/chat")(io);

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
});