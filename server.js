require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");

// Routes & Socket
const contactRoute = require("./routes/contact");
const setupSocket = require("./socket/chat");

// ---------------------------
// APP SETUP
// ---------------------------
const app = express();

// JSON parsing
app.use(express.json());

// CORS
app.use(cors({
  origin: [
    "https://strange-frontend-updated2.vercel.app",
    "https://strangerschat.fun",
    "https://strangchat.in",
        "https://www.strangchat.in",   // 👈 ADD THIS
    "https://www.strangerschat.fun",   // 👈 ADD THIS
    "http://localhost:3000"
  ],
  methods: ["POST", "GET"]
}));

// Routes
app.use("/send", contactRoute);

// HTTP + Socket.IO
const server = http.createServer(app);
setupSocket(server);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("SERVER RUNNING ON PORT", PORT));
