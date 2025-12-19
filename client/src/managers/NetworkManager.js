import io from 'socket.io-client';

export default class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
    }

    connect() {
        this.socket = io('http://localhost:8080'); // Connect to correct server port

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Current Players
        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                if (players[id].playerId === this.socket.id) {
                    this.scene.addPlayer(players[id]);
                } else {
                    this.scene.addOtherPlayer(id, players[id]);
                }
            });
        });

        // New Player
        this.socket.on('newPlayer', (playerInfo) => {
            this.scene.addOtherPlayer(playerInfo.playerId, playerInfo);
        });

        // Other Player Disconnect
        this.socket.on('disconnect', (playerId) => {
            if (this.scene.otherPlayers[playerId]) {
                this.scene.otherPlayers[playerId].destroy();
                delete this.scene.otherPlayers[playerId];
            }
        });

        // Player Moved
        this.socket.on('playerMoved', (playerInfo) => {
            if (this.scene.otherPlayers[playerInfo.playerId]) {
                this.scene.otherPlayers[playerInfo.playerId].updatePosition(playerInfo);
            }
        });
    }

    emitPlayerMovement(x, y, flipX) {
        if (this.socket) {
            this.socket.emit('playerMovement', { x, y, flipX });
        }
    }
}
