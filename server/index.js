const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const players = {};

io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    // Create new player entry
    players[socket.id] = {
        x: 100, // Default Spawn
        y: 300,
        playerId: socket.id,
        flipX: false
    };

    // Send the players object to the new player
    socket.emit('currentPlayers', players);

    // Update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);
        delete players[socket.id];
        io.emit('disconnect', socket.id);
    });

    socket.on('playerMovement', (movementData) => {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].flipX = movementData.flipX;

        // Broadcast to others
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
