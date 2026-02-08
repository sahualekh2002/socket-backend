const { Server } = require("socket.io");

module.exports = function setupSocket(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  let waitingUser = null;
  let onlineUsers = 0;

  io.on("connection", (socket) => {
    onlineUsers++;
    io.emit("status", { type: "online", count: onlineUsers });
    io.emit("online-users", onlineUsers);

    socket.partner = null;
    socket.isWaiting = false;

    console.log("USER CONNECTED:", socket.id);

    socket.on("join", () => {
      socket.emit("status", { type: "searching", message: "Searching for a stranger..." });

      if (socket.partner || socket.isWaiting) return;

      if (waitingUser && waitingUser.id !== socket.id) {
        socket.partner = waitingUser;
        waitingUser.partner = socket;

        socket.isWaiting = false;
        waitingUser.isWaiting = false;

        socket.emit("matched");
        waitingUser.emit("matched");

        socket.emit("status", { type: "matched", message: "You are now connected to a stranger" });
        waitingUser.emit("status", { type: "matched", message: "You are now connected to a stranger" });

        waitingUser = null;
      } else {
        waitingUser = socket;
        socket.isWaiting = true;
        socket.emit("status", { type: "waiting", message: "Waiting for another user..." });
      }
    });

    socket.on("message", (msg) => {
      if (!socket.partner) return;
      socket.partner.emit("message", { sender: "stranger", text: msg });
    });

    socket.on("typing", () => {
      if (socket.partner) socket.partner.emit("typing");
    });

    socket.on("disconnect", () => {
      onlineUsers--;
      io.emit("status", { type: "online", count: onlineUsers });
      io.emit("online-users", onlineUsers);

      console.log("USER DISCONNECTED:", socket.id);

      if (socket.partner) {
        socket.partner.emit("message", { sender: "system", text: "Stranger disconnected." });
        socket.partner.emit("status", { type: "disconnected", message: "Stranger left the chat" });
        socket.partner.partner = null;
        socket.partner.isWaiting = false;
      }

      if (waitingUser && waitingUser.id === socket.id) waitingUser = null;

      socket.partner = null;
      socket.isWaiting = false;
    });
  });
};
