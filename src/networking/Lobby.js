import {JoinGamePacket, KickPlayerPacket, LobbyReadyPacket, StartGamePacket} from "./Packets.js";
import {PlayerBody} from "../client/player/PlayerBody.js";

export class Lobby {
    constructor() {
        this.leader = g_ConnectionManager.peerId;
        this.lobbyReadied = false;

        this.players = {};

        this.initLobbyScreen()
    }

    initLobbyScreen() {
        const playerNameInput = document.getElementById("player-name");
        playerNameInput.value = g_ConnectionManager.stashedId.name;
        playerNameInput.style.width = `${Math.max(playerNameInput.value.length, 2)}ch`;
        playerNameInput.addEventListener("input", () => {
            playerNameInput.style.width = `${Math.max(playerNameInput.value.length, 2)}ch`;
            playerNameInput.classList.add("typed");
            g_ConnectionManager.stashedId.name = playerNameInput.value;
            setTimeout(() => playerNameInput.classList.remove("typed"), 1000);
        });

        const copyUUIDButton = document.getElementById("connection-id");
        copyUUIDButton.onclick = () => {
            navigator.clipboard.writeText(g_ConnectionManager.peerId).then(() => {
                const innerText = copyUUIDButton.innerText;
                copyUUIDButton.innerText = "Copied!";
                setTimeout(() => {
                    copyUUIDButton.innerText = innerText;
                }, 1000);
            });
        };
    }

    refreshLobbyUI() {
        if (g_Lobby.leader !== g_ConnectionManager.peerId) {
            document.getElementById("lobby-title").classList.remove("lobby-leader");
            const joinSpan = document.getElementById("lobby-join");
            if (joinSpan) {
                joinSpan.remove();
            }
            const readyButton = document.getElementById("main-play-button");
            if (readyButton.onclick !== this.readyButton) {
                readyButton.onclick = this.readyButton;
                readyButton.innerText = "Ready";
            }
        }

        const lobbyElement = document.getElementById("lobby-connections");
        lobbyElement.innerHTML = "";
        for(const peerId in g_ConnectionManager.connections) {
            const listItem = document.createElement("li");
            listItem.className = "lobby-item";

            if (g_Lobby.leader === peerId) {
                listItem.classList.add("lobby-leader");
            } else {
                listItem.classList.remove("lobby-leader");
            }
            if (g_ConnectionManager.connections[peerId].ready) {
                listItem.classList.add("lobby-ready");
            } else {
                listItem.classList.remove("lobby-ready");
            }

            listItem.textContent = peerId.substring(0, peerId.lastIndexOf('_'));

            if (g_Lobby.leader === g_ConnectionManager.peerId) {
                const kickButton = document.createElement("button");
                kickButton.className = "kick-button";
                kickButton.textContent = "X";
                kickButton.style.display = "none";
                kickButton.onclick = () => this.kickPeer(peerId);

                listItem.appendChild(kickButton);
                listItem.onmouseenter = () => kickButton.style.display = "inline-flex";
                listItem.onmouseleave = () => kickButton.style.display = "none";
            }

            lobbyElement.appendChild(listItem);
        }
    }

    joinPeer() {
        const playerName = document.getElementById('join-player-name');
        const playerId = document.getElementById('join-player-id');
        const peerId = `${playerName.value}_${playerId.value}`;
        g_ConnectionManager.joinPlayer(peerId);
    }

    kickPeer(peerId) {
        g_ConnectionManager.broadcastPacket(new KickPlayerPacket(peerId));
        g_ConnectionManager.connections[peerId]._conn.close();
    }

    readyButton() {
        this.lobbyReadied = !this.lobbyReadied;
        g_ConnectionManager.broadcastPacket(new LobbyReadyPacket(this.lobbyReadied));
    }

    startGame() {
        for (const peerId in g_ConnectionManager.connections) {
            if (g_Lobby.leader === peerId) continue;
            if (!g_ConnectionManager.connections[peerId].ready) {
                alert('Not all players are ready!');
                return;
            }
        }
        g_Menu.hideAllMenus();
        startGameLoop();
        g_ConnectionManager.broadcastPacket(new StartGamePacket());
        g_ConnectionManager.broadcastPacket(new JoinGamePacket());
    }

    createPlayerBody(peerId) {
        this.players[peerId] = new PlayerBody(peerId.substring(0, peerId.lastIndexOf('_')));
    }
}