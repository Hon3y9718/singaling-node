const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

function checkOrJsonify(payload) {
  // Check if payload is a string and parse it into JSON
  let parsedPayload = payload;
  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (err) {
      console.warn("Failed to parse payload:", payload);
      return;
    }
  }

  return parsedPayload;
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins (adjust for prod)
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join", (payload) => {
    const { roomId } = checkOrJsonify(payload) || {};
    socket.join(roomId);
    console.log(`${socket.id} joined room: ${roomId}`);

    const clientsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set();
    const otherClients = Array.from(clientsInRoom).filter(
      (id) => id !== socket.id
    );

    if (otherClients.length > 0) {
      // Notify the new client that others are present
      socket.emit("existing-users", otherClients);
      // Notify others that a new client has joined
      socket.to(roomId).emit("new-user", socket.id);
    }
  });

  socket.on('existing-users', (users) => {
    print("Existing users: $users");
    // If you're the second one to join, wait for offer from the first
  });

  socket.on("signal", (payload) => {
    const { roomId, data } = checkOrJsonify(payload) || {};
    if (roomId && data) {
      // Relay signal to other clients in the room
      socket.to(roomId).emit("signal", { sender: socket.id, data });
      console.log(`Signal from ${socket.id} to room ${roomId}:`, data);
    } else {
      console.warn("Invalid signal payload from", socket.id, payload);
    }
  });

  // WebRTC offer
  socket.on("offer", (payload) => {
    const { roomId, offer } = checkOrJsonify(payload) || {};
    if (roomId && offer) {
      socket.to(roomId).emit("offer", { sender: socket.id, offer });
      console.log(`Offer from ${socket.id} to room ${roomId}`);
    }
  });

  // WebRTC answer
  socket.on("answer", (payload) => {
    const { roomId, answer } = checkOrJsonify(payload) || {};
    if (roomId && answer) {
      socket.to(roomId).emit("answer", { sender: socket.id, answer });
      console.log(`Answer from ${socket.id} to room ${roomId}`);
    }
  });

  // WebRTC ICE candidates
  socket.on("candidate", (payload) => {
    const { roomId, candidate } = checkOrJsonify(payload) || {};
    if (roomId && candidate) {
      socket.to(roomId).emit("candidate", { sender: socket.id, candidate });
      console.log(`Candidate from ${socket.id} to room ${roomId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
