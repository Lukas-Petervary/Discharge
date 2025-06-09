import {StartGamePacket} from "/shared/PacketService.js";

export class ServerLobby {
    constructor() {
        this.players = {};

    }

    startGame() {
        for (let playerId in this.players) {
            if (!this.players[playerId].isReady)
                return console.warn('Not all players are ready!');
        }

        g_ServerConnection.broadcastPacket(new StartGamePacket());
    }

    addPlayer(connection) {
        if (this.players[connection.peer]) {
            return console.warn(`player already exists with name '${connection.peer}'`);
        }
        this.players[connection.peer] = {
            _conn: connection,
            isReady: false
        };
        this.renderUI();
    }

    removePlayer(playerId) {
        delete this.players[playerId];
        this.renderUI();
    }

    setPlayer(playerId, isReady) {
        let player = this.players[playerId];
        if (!player) player = {ready: false};
        player.ready = isReady;

        this.renderUI();
    }

    renderUI() {

    }
}