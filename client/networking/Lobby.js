import {LobbyReadyPacket} from "/PacketService.js";
import {PlayerBody} from "../player/PlayerBody.js";

export class Lobby {
    constructor() {
        this.lobbyReadied = false;
        this.players = {};

        this.initLobbyScreen()
    }

    initLobbyScreen() {
        const playerNameInput = document.getElementById("player-name");
        playerNameInput.value = g_ClientConnection.stashedId.name;
        playerNameInput.style.width = `${Math.max(playerNameInput.value.length, 2)}ch`;
        playerNameInput.addEventListener("input", () => {
            playerNameInput.style.width = `${Math.max(playerNameInput.value.length, 2)}ch`;
            playerNameInput.classList.add("typed");
            g_ClientConnection.stashedId.name = playerNameInput.value;
            setTimeout(() => playerNameInput.classList.remove("typed"), 1000);
        });

        const copyUUIDButton = document.getElementById("connection-id");
        copyUUIDButton.onclick = () => {
            navigator.clipboard.writeText(g_ClientConnection.peerId).then(() => {
                const innerText = copyUUIDButton.innerText;
                copyUUIDButton.innerText = "Copied!";
                setTimeout(() => {
                    copyUUIDButton.innerText = innerText;
                }, 1000);
            });
        };
    }

    refreshLobbyUI() {
        const lobbyElement = document.getElementById("lobby-connections");
        lobbyElement.innerHTML = "";
        for(const playerId in this.players) {
            const listItem = document.createElement("li");
            listItem.className = "lobby-item";

            if (this.players[playerId].ready) {
                listItem.classList.add("lobby-ready");
            } else {
                listItem.classList.remove("lobby-ready");
            }

            listItem.textContent = playerId.substring(0, playerId.lastIndexOf('_'));

            lobbyElement.appendChild(listItem);
        }
    }

    onJoinServer() {
        const span = document.getElementById("lobby-join");
        const tf = document.getElementById("join-server-id");
        tf.disabled = true;

        const button = span.querySelector("button");
        button.textContent = "Leave";
        button.onclick = () => location.reload();
    }

    onLeave(peerId) {
        this.players[peerId].playerBody.remove();
        delete this.players[peerId];
    }

    readyButton() {
        this.lobbyReadied = !this.lobbyReadied;

        const title = document.getElementById('lobby-title');
        const button = document.getElementById('ready-button');
        if (this.lobbyReadied) {
            title.classList.add("lobby-ready");
            button.classList.add("lobby-ready");
            button.textContent = "Not Ready";
        } else {
            title.classList.remove("lobby-ready");
            button.classList.remove("lobby-ready");
            button.textContent = "Ready";
        }

        g_ClientConnection.sendPacket(new LobbyReadyPacket(this.lobbyReadied));
    }

    _initPlayer(peerId) {
        console.trace();
        if (this.players[peerId]) {
            console.log(`Player "${peerId}" is already in the lobby`);
            return;
        }
        this.players[peerId] = {
            name: peerId.substring(0, peerId.lastIndexOf('_')),
            id: peerId.substring(peerId.lastIndexOf('_') + 1),
            ready: false,
            playerBody: new PlayerBody(peerId.substring(0, peerId.lastIndexOf('_')))
        };
    }

    startGame() {
        for (const player in this.players) {
            if (!player.ready) {
                alert('Not all players are ready!');
                return;
            }
        }
        g_Menu.hideAllMenus();
        toggleGameLoop();
    }

    stopGame() {
        g_Menu.showMenu('start-menu');
        g_Menu.menuStack = [g_Menu.menuStack[1]];
        toggleGameLoop();
    }
}