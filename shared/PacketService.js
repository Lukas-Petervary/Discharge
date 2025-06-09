export class PacketManager {
    constructor() {
        this.packetHandlers = {};
        this.receivedPackets = 0;
        this.sentPackets = 0;
        this.debugPackets = false;

        this.registerPackets();
    }

    registerPackets() {
        this.registerPacket('handshake', HandshakePacket);
        this.registerPacket('direct-connect', DirectConnectPacket)
        this.registerPacket('message', MessagePacket);
        this.registerPacket('alert', AlertPacket);
        this.registerPacket('lobby-ready', LobbyReadyPacket);
        this.registerPacket('kick-player', KickPlayerPacket);
        this.registerPacket('start-game', StartGamePacket);
        this.registerPacket('position', PositionPacket);
    }

    registerPacket(type, packetClass) {
        const page = document.body.dataset.page;
        this.packetHandlers[type] = (page === "client" ? packetClass.S2C : packetClass.C2S).bind(this);
    }

    handlePacket(data, senderID, peerManager) {
        this.receivedPackets++;
        const parsedData = JSON.parse(data);
        const handler = this.packetHandlers[parsedData.type];
        if (this.debugPackets) {
            console.log(`Incoming packet: ${parsedData.type}`, parsedData);
        }
        if (handler) {
            handler(parsedData, senderID, peerManager);
        } else {
            console.error(`No handler for packet type: ${parsedData.type}`);
        }
    }
}

class GenericPacket {
    constructor(type) {
        this.type = type;
        this.peer = document.body.dataset.page === "client" ? g_ClientConnection.peerId : g_ServerConnection.peerId;
    }

    // function executed server-side
    static C2S(packet) { console.error('Generic packet executed.') }
    // function executed client-side
    static S2C(packet) { console.error('Generic packet executed.') }

    toJSON() { return console.error('Generic packet JSONified') }
}

export class HandshakePacket extends GenericPacket {
    constructor() {
        super('handshake');
        this.playerList = null;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            playerList: this.playerList
        };
    }

    static C2S(packet, senderID) {
        const handshakeBroadcast = new HandshakePacket();
        handshakeBroadcast.playerList = Object.keys(g_ServerConnection.connections);
        g_ServerConnection.broadcastPacket( handshakeBroadcast );
    }

    static S2C(packet, senderID) {
        for(const playerId of packet.playerList) {
            if (playerId !== g_ClientConnection.peerId)
                g_Lobby._initPlayer(playerId);
        }
        g_Lobby.refreshLobbyUI();
    }
}

export class DirectConnectPacket extends GenericPacket {
    constructor(peer1, peer2) {
        super('direct-connect');
        this.peer1 = peer1;
        this.peer2 = peer2;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            peer1: this.peer1,
            peer2: this.peer2
        };
    }

    static C2S(packet, senderID) { console.warn('DirectConnect is intended S2C only.'); }

    static S2C(packet, senderID) {
        if (senderID !== g_ClientConnection.serverConnection.peer) {
            console.error(`Direct Connect must be issued from server -- sender="${senderID}"`);
            return;
        }
        if (packet.peer1 === g_ClientConnection.peerId) {
            g_ClientConnection.connectToPeer(packet.peer2)
                .then(() => console.log(`Direct Connect Success @ ID=${packet.peer2}`))
                .catch((err) => console.warn(`Direct Connect Failure @ ID=${packet.peer2}`, err));
        } else if (packet.peer2 === g_ClientConnection.peerId) {
            g_ClientConnection.connectToPeer(packet.peer1)
                .then(() => console.log(`Direct Connect Success @ ID=${packet.peer1}`))
                .catch((err) => console.warn(`Direct Connect Failure @ ID=${packet.peer1}`, err));
        } else {
            console.warn(`Direct Connect pair invalid "${packet.peer1}" <-> "${packet.peer2}"`);
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

    static S2C(packet) {
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

    static S2C(packet) {
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

    static C2S(packet) {
        g_ServerLobby.setPlayer(packet.ready);
    }

    static S2C(packet) {
        g_Lobby.players[packet.peer].ready = packet.ready;
        g_Lobby.refreshLobbyUI();
    }
}

export class KickPlayerPacket extends GenericPacket {
    constructor(kickedPlayerId) {
        super('kick-player');
        this.kickedPlayer = kickedPlayerId;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            kickedPlayer: this.kickedPlayer
        }
    }

    static C2S(packet) {
        console.warn(`KickPlayerPacket from ${packet.peer}, S2C only!`)
    }

    static S2C(packet, senderID) {
        if (senderID !== g_ClientConnection.serverConnection.peer) {
            console.error(`Kick Packet must be sent by server! Instead sent from ID=${senderID}`);
            return;
        }

        if (packet.kickedPlayer === g_ClientConnection.peerId) {
            g_ClientConnection.serverConnection.close();
            alert("You've been kicked from the lobby!");
        } else {
            const _c = g_ClientConnection.connections[packet.kickedPlayer];
            if (_c) _c.close();
            g_Lobby.onLeave(packet.kickedPlayer);
            g_Lobby.refreshLobbyUI();
        }
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

    static C2S(packet) {
        console.warn(`StartGamePacket from ${packet.peer}, S2C only!`)
    }

    static S2C(packet, senderID) {
        if (senderID !== g_ClientConnection.serverConnection.peer) {
            return console.error('Non-server tried to initiate game');
        }
        g_Menu.hideAllMenus();
        g_Lobby.startGame();
    }
}

export class PositionPacket extends GenericPacket {
    constructor(pos, vel, lookQuat) {
        super('position');
        this.pos = pos;
        this.vel = vel;
        this.lookQuat = lookQuat;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            pos: {x: this.pos.x, y: this.pos.y, z: this.pos.z},
            vel: {dx: this.vel.x, dy: this.vel.y, dz: this.vel.z},
            lookQuat: {x: this.lookQuat.x, y: this.lookQuat.y, z: this.lookQuat.z, w: this.lookQuat.w},
        }
    }

    static C2S(packet) {
        g_ServerConnection.broadcastPacket( packet );
    }

    static S2C(packet) {
        if (packet.peer === g_ClientConnection.peerId) return;

        const player = g_Lobby.players[packet.peer];
        if ( player ) {
            player.playerBody.body.position.set(packet.pos.x, packet.pos.y, packet.pos.z);
            player.playerBody.body.velocity.set(packet.vel.dx, packet.vel.dy, packet.vel.dz);
            player.playerBody.look(packet.lookQuat);
        } else {
            console.warn(`No player found with ID="${packet.peer}"`)
        }
    }
}