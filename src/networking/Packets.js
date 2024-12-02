export class PacketManager {
    constructor() {
        this.packetHandlers = {};
        this.receivedPackets = 0;
        this.sentPackets = 0;
    }

    registerPackets() {
        this.registerPacket('handshake', HandshakePacket.handleHandshake.bind(this));
        this.registerPacket('message', MessagePacket.handleMessage.bind(this));
        this.registerPacket('alert', AlertPacket.handleAlert.bind(this));
        this.registerPacket('lobby-ready', LobbyReadyPacket.handleLobbyReady.bind(this));
        this.registerPacket('kick-player', KickPlayerPacket.handleKickPlayerPacket.bind(this));
        this.registerPacket('start-game', StartGamePacket.handleStartGame.bind(this));
        this.registerPacket('join-game', JoinGamePacket.handleJoinGame.bind(this));
        this.registerPacket('position', PositionPacket.handlePositionPacket.bind(this));
    }

    registerPacket(type, handler) {
        this.packetHandlers[type] = handler;
    }

    handlePacket(data, senderID, peerManager) {
        this.receivedPackets++;
        const parsedData = JSON.parse(data);
        const handler = this.packetHandlers[parsedData.type];
        if (handler) {
            handler(parsedData, senderID, peerManager);
        } else {
            console.log(`No handler for packet type: ${parsedData.type}`);
        }
    }
}

class GenericPacket {
    constructor(type) {
        this.type = type;
        this.peer = g_ConnectionManager.peerId;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer
        };
    }
}

let handshakeList = [];
export class HandshakePacket extends GenericPacket {
    constructor() {
        super('handshake');
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            leader: g_Lobby.leader
        };
    }

    static handleHandshake(packet, senderID) {
        console.log(`Handshake inbound from "${senderID}":\n${JSON.stringify(packet)}`);

        const origin = packet.peer;
        if (handshakeList.includes(origin)) return;

        handshakeList.push(origin);
        g_Lobby.leader = packet.leader || g_Lobby.leader;
        g_Lobby.refreshLobbyUI();

        // if not already connected, establish connection
        if (!g_ConnectionManager.connections[origin]) {
            console.log(`Connecting from handshake "${senderID}"`);
            g_ConnectionManager.connectToPeer(origin);
        }
        else { // if connected, reciprocate handshake
            console.log(`Already connected to "${senderID}", returning handshake`);
            g_ConnectionManager.sendHandshake(g_ConnectionManager.connections[origin]._conn);
        }
        console.log(`Current handshakes: [${handshakeList}]\nBroadcast: ${senderID === origin}`);

        // only propagate handshake if from initial sender
        if (senderID === origin) {
            const jsonPacket = JSON.stringify(packet);
            for(const connId in g_ConnectionManager.connections) {
                const conn = g_ConnectionManager.connections[connId]._conn;
                console.log(`Broadcasting ? [${conn.peer !== origin}]: handshake to "${conn.peer}":\n${jsonPacket}`);
                // if connection is open and not returning to sender
                if (conn.open && conn.peer !== origin) {
                    conn.send(jsonPacket);
                }
            }
        }
    }
}

export class MessagePacket extends GenericPacket {
    constructor(message) {
        super('message');
        this.message = message;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            message: this.message
        };
    }

    static handleMessage(packet) {
        const message = packet.message;

        const messagesDiv = document.getElementById('messages');
        const messageElem = document.createElement('div');
        messageElem.textContent = message;
        messagesDiv.appendChild(messageElem);
    }
}

export class AlertPacket extends GenericPacket {
    constructor(message) {
        super('alert');
        this.message = message;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            message: this.message
        };
    }

    static handleAlert(packet) {
        alert(packet.message);
    }
}

export class LobbyReadyPacket extends GenericPacket {
    constructor(isReady) {
        super('lobby-ready');
        this.isReady = isReady;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            ready: this.isReady
        };
    }

    static handleLobbyReady(packet) {
        g_ConnectionManager.connections[packet.peer].ready = packet.ready;
        g_Lobby.refreshLobbyUI();
    }
}

export class KickPlayerPacket extends GenericPacket {
    constructor(kickedPlayerId) {
        super('kick-player');
        this.kickedPlayerId = kickedPlayerId;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            kickedPlayer: this.kickedPlayerId
        }
    }

    static handleKickPlayerPacket(packet, senderID) {
        if (senderID !== g_Lobby.leader) return;

        if (packet.kickedPlayer === g_ConnectionManager.peerId)
            alert("You've been kicked from the party!");
        g_ConnectionManager.connections[packet.kickedPlayer]._conn.close();
        g_Lobby.refreshLobbyUI();
    }
}

export class StartGamePacket extends GenericPacket {
    constructor() {
        super('start-game');
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer
        };
    }

    static handleStartGame(packet, senderID) {
        if (senderID !== g_Lobby.leader) {
            console.error('Non-leader tried to initiate game')
            return;
        }
        g_Menu.hideAllMenus();
        startGameLoop();
        g_ConnectionManager.broadcastPacket(new JoinGamePacket(packet));
    }
}

export class JoinGamePacket extends GenericPacket {
    constructor() {
        super('join-game');
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer
        };
    }

    static handleJoinGame(packet) {
        console.log(`${packet.peer} joined the world!`);
        g_Lobby.createPlayerBody(packet.peer);
    }
}

export class PositionPacket extends GenericPacket {
    constructor(x, y, z) {
        super('position');
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            x: this.x,
            y: this.y,
            z: this.z
        }
    }

    static handlePositionPacket(packet) {
        const playerBody = g_Lobby.players[packet.peer];
        playerBody.body.position.set(packet.x, packet.y, packet.z);
    }
}