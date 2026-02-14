require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    "https://strange-frontend-updated2.vercel.app",
    "https://strangerschat.fun",
    "https://strangchat.in",
    "https://www.strangchat.in",
    "https://www.strangerschat.fun",
    "http://localhost:3000"
  ],
  methods: ["POST", "GET"]
}));

const server = http.createServer(app);

// 🔥 USE chat.js SOCKET
const setupSocket = require("./socket/chat");
setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("SERVER RUNNING ON PORT", PORT));
