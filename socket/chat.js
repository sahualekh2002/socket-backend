const { Server } = require("socket.io");

module.exports = function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
  });

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

      if (
        waitingUser &&
        waitingUser.id !== socket.id &&
        waitingUser.connected
      ) {
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
  if (!socket.partner || !socket.partner.connected) return;

  socket.partner.emit("message", {
    sender: "stranger",
    type: "text",
    content: msg,
  });
});


    // 🔥 IMAGE MESSAGE
    socket.on("sendImage", (imageData) => {
  console.log("Image received from:", socket.id);

  if (!socket.partner) {
    console.log("No partner found");
    return;
  }

  console.log("Sending image to:", socket.partner.id);

  socket.partner.emit("receiveImage", imageData);
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
