const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let waitingUser = null;
let onlineUsers = 0;

const bannedWords = [
  "sex",
  "fuck",
  "fucking",
  "porn",
  "nude",
  "nudes",
  "xxx",
];

function containsBannedWords(text = "") {
  const lower = text.toLowerCase();
  return bannedWords.some((word) => lower.includes(word));
}




io.on("connection", (socket) => {
  onlineUsers++;
  io.emit("onlineCount", onlineUsers);

  socket.partner = null;
  socket.isWaiting = false;

  console.log("User connected:", socket.id);

  // ---------------------------
  // JOIN CHAT
  // ---------------------------
  socket.on("join", () => {
    // ❌ already in chat → ignore
    if (socket.partner) return;

    // ❌ same socket trying again
    if (waitingUser && waitingUser.id === socket.id) return;

    // ✅ match if someone is waiting
    if (waitingUser && !waitingUser.partner) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.isWaiting = false;
      waitingUser.isWaiting = false;

      socket.emit("matched");
      waitingUser.emit("matched");

      waitingUser = null;
    } else {
      // ✅ put in waiting queue
      waitingUser = socket;
      socket.isWaiting = true;
    }
  });

  // ---------------------------
  // TYPING
  // ---------------------------
  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  // ---------------------------
  // MESSAGE
  // ---------------------------
  socket.on("message", (msg) => {
    if (!socket.partner) return;

    // 🚫 block banned words
    if (containsBannedWords(msg)) {
      return; // silently block
    }

    socket.partner.emit("message", msg);
  });

  // ---------------------------
  // DISCONNECT
  // ---------------------------
  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("onlineCount", onlineUsers);

    // notify partner
    if (socket.partner) {
      socket.partner.emit("system", "Stranger disconnected.");
      socket.partner.partner = null;
    }

    // clear waiting user safely
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }

    socket.partner = null;
    socket.isWaiting = false;

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("Socket server running on port", PORT);
});
