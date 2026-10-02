const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const PORT = 9000;

// Setup PeerJS Server pada path '/peerjs'
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

app.use(peerServer);

// Melayani file HTML statis (jika file HTML diberi nama index.html di folder 'public')
app.use(express.static('public'));

// Setup Socket.IO Server (mengizinkan CORS)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let broadcasters = new Set();

io.on('connection', (socket) => {
  let registeredId = null;

  // Registrasi broadcaster baru
  socket.on('register-broadcaster', (peerId) => {
    registeredId = peerId;
    broadcasters.add(peerId);
    io.emit('update-broadcaster-list', Array.from(broadcasters));
  });

  // Minta daftar broadcaster aktif
  socket.on('get-broadcasters', () => {
    socket.emit('update-broadcaster-list', Array.from(broadcasters));
  });

  // Hapus dari daftar jika terputus
  socket.on('disconnect', () => {
    if (registeredId) {
      broadcasters.delete(registeredId);
      io.emit('update-broadcaster-list', Array.from(broadcasters));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
