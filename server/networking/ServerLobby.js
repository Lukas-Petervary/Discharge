import {LobbyReadyPacket, StartGamePacket} from "../../shared/PacketManager.js";
import Logger from "../../shared/Logger.js";

export class ServerLobby {
    constructor() {
        this.players = {};

    }

    startGame() {
        for (let playerId in this.players) {
            if (!this.players[playerId].lobbyReady)
                return alert('Not all players are ready!');
        }

        g_ServerConnection.broadcastPacket(new StartGamePacket());
    }

    addPlayer(playerId) {
        if (this.players[playerId])
            return Logger.debug(`player already exists with name '${playerId}'`);
        for (const peerId in Object.keys(this.players)) {
            if (this.players[peerId]?.lobbyReady)
                g_ServerConnection.sendPacket(playerId, {type: 'lobby-ready', peer: peerId, ready: true});
        }

        this.players[playerId] = {
            lobbyReady: false
        };
        this.renderUI();
    }

    removePlayer(playerId) {
        delete this.players[playerId];
        this.renderUI();
    }

    setPlayer(playerId, isReady) {
        const player = this.players[playerId];
        if (!player) return Logger.debug(`player ${playerId} not found!`);
        else         player.lobbyReady = isReady;
        this.renderUI();
    }

    renderUI() {
        const lobbyElement = document.getElementById("lobby-connections");
        lobbyElement.innerHTML = "";
        for(const playerId in this.players) {
            const listItem = document.createElement("li");
            listItem.className = "lobby-item";

            if (this.players[playerId].lobbyReady) listItem.classList.add("lobby-ready");
            else                                   listItem.classList.remove("lobby-ready");

            listItem.textContent = playerId.substring(0, playerId.lastIndexOf('_'));
            lobbyElement.appendChild(listItem);
        }
    }
}