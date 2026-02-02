// ---------------------------
// STRANGER CHAT SERVER
// ---------------------------

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ---------------------------
// APP SETUP
// ---------------------------
const app = express();
app.use(cors()); // allow cross-origin requests

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

  // 🔔 Notify all users of online count
  io.emit("status", {
    type: "online",
    count: onlineUsers,
  });

  console.log("USER CONNECTED:", socket.id);

  // Initialize socket properties
  socket.partner = null;   // connected stranger
  socket.isWaiting = false;

  // ---------------- JOIN CHAT ----------------
  socket.on("join", () => {
    console.log("JOIN REQUEST:", socket.id);

    // Send searching status to this user
    socket.emit("status", {
      type: "searching",
      message: "Searching for a stranger...",
    });

    // If already matched or waiting, ignore
    if (socket.partner || socket.isWaiting) return;

    // If someone is waiting, match with them
    if (waitingUser && waitingUser.id !== socket.id) {
      // ✅ MATCH FOUND
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.isWaiting = false;
      waitingUser.isWaiting = false;

      // Notify both users
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

      waitingUser = null; // clear waiting user
    } else {
      // 🕒 No one waiting, set this socket as waiting
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
    if (!socket.partner) return; // only send if connected
    socket.partner.emit("message", {
      sender: "stranger",
      text: msg,
    });
  });

  // ---------------- TYPING INDICATOR ----------------
  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing"); // forward typing event to partner
    }
  });

  // ---------------- DISCONNECT ----------------
  socket.on("disconnect", () => {
    onlineUsers--;

    // Update all users with online count
    io.emit("status", {
      type: "online",
      count: onlineUsers,
    });

    console.log("USER DISCONNECTED:", socket.id);

    // Notify partner if connected
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

    // Clear waiting user if this socket was waiting
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }

    // Reset socket properties
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
