import ConnectionManager from "./ConnectionManager.js";
export { HandshakePacket, MessagePacket, AlertPacket, PositionPacket };


let handshakeList = [];
class GenericPacket {
    constructor(type) {
        this.type = type;
        this.peer = connectionManager.peerId;
    }
}

class HandshakePacket extends GenericPacket {
    constructor(peerId) {
        super('handshake');
        this.peerId = peerId;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            peerId: this.peerId
        };
    }

    static handleHandshake(packet, fromPeerId) {
        debugTerminal.log(`Handshake inbound from "${fromPeerId}":\n${JSON.stringify(packet)}`);

        const sender = packet.peerId;
        if (!handshakeList.includes(sender)) {
            handshakeList.push(sender);

            // if not already connected, establish connection
            if (!connectionManager.connections.has(sender)) {
                debugTerminal.log(`Connecting from handshake "${fromPeerId}"`);
                connectionManager.connectToPeer(sender);
            }
            else { // if connected, reciprocate handshake
                debugTerminal.log(`Already connected to "${fromPeerId}", returning handshake`);
                connectionManager.sendHandshake(connectionManager.connections.get(sender));
            }
            debugTerminal.log(`Current handshakes: [${handshakeList}]\nBroadcast: ${fromPeerId === sender}`);

            // only propagate handshake if from initial sender
            if (fromPeerId === sender) {
                const jsonPacket = JSON.stringify(packet);
                this.connections.forEach(conn => {
                    debugTerminal.log(`Broadcasting ? [${conn.peer !== sender}]: handshake to "${conn.peer}":\n${jsonPacket}`);
                    // if connection is open and not returning to sender
                    if (conn.open && conn.peer !== sender) {
                        conn.send(jsonPacket);
                    }
                });
            }
        }

    }
}

class MessagePacket extends GenericPacket {
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

class AlertPacket extends GenericPacket {
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

class PositionPacket extends GenericPacket {
    constructor(x, y) {
        super('position');
        this.x = x;
        this.y = y;
    }

    toJSON() {
        return {
            type: this.type,
            peer: this.peer,
            x: this.x,
            y: this.y
        }
    }

    static handlePositionPacket(packet) {
        const peerId = packet.peer, x = packet.x, y = packet.y;
        let peerDiv = document.getElementById(`peer-${peerId}`);

        if (!peerDiv) {
            peerDiv = document.createElement('div');
            peerDiv.id = `peer-${peerId}`;
            peerDiv.style.position = 'absolute';
            peerDiv.innerText = peerId;
            document.body.appendChild(peerDiv);
        }

        peerDiv.style.left = `${x}px`;
        peerDiv.style.top = `${y}px`;
    }
}