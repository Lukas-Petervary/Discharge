import {PacketManager, HandshakePacket} from "./Packets.js";

export default class ConnectionManager {
    constructor() {
        this.peerId = this.peer = null;
        this.setSalt();
        if(this.stashedId.open) this.openConnection();

        this.connections = {};
        this.packetManager = new PacketManager();
        this.packetManager.registerPackets();
    }

    setSalt() {
        this.stashedId = JSON.parse(localStorage.getItem('stashedId')) || { name: null, salt: null, open: false };
        if (!this.stashedId.salt) {
            const salt = (Math.random()).toString(36);
            this.stashedId.salt = salt.substring(salt.length - 8);
        }
        document.getElementById('connection-id').textContent = this.stashedId.salt;
    }

    async openConnection() {
        if (!this.stashedId.name) {
            console.warn("No stashed name");
            return;
        }

        document.getElementById('player-name').disabled = true;
        const connectButton = document.getElementById('create-connection-id');
        connectButton.style.backgroundColor = "blue";

        let c_ = 0;
        const b_ = '⠈⠐⠄⡀⢀⠠⠂⠁';
        const intvl = setInterval(() => {
            c_ = (c_+1)%8;
            connectButton.innerText = `<\\Connecting${b_[c_]}>`;
        }, 200);

        this.peerId = this.stashedId.name + "_" + this.stashedId.salt;
        this.peerId = this.peerId.trim();
        this.peer = new Peer(this.peerId);

        try {
            await new Promise((resolve, reject) => {
                this.peer.on('open', resolve);
                this.peer.on('error', err => reject(err));
            });

            this.stashedId.open = true;
            localStorage.setItem('stashedId', JSON.stringify(this.stashedId));

            clearInterval(intvl);
            connectButton.innerText = `<\\Connected>`;
            connectButton.style.backgroundColor = '#8afd00';

            connectButton.onclick = () => {
                navigator.clipboard.writeText(`${window.location.href.split("#join=")[0]}#join=${g_ConnectionManager.peerId}`)
                    .then(() => alert('URL copied to clipboard!'))
                    .catch(err => console.error('Failed to copy: ', err));
            };

            this.onConnectionSuccess();
        } catch(err) {
            clearInterval(intvl);
            connectButton.innerText = `<\\Failed>`;
            connectButton.style.backgroundColor = '#fd008a';

            document.getElementById('error-icon').style.display = 'inline-flex';
            document.getElementById('error-tooltip').textContent = err.message || "Connection Failed";
            console.error("Peer ID check failed:", err);
            connectButton.onclick = this.retryConnection.bind(this);
        }
    }

    retryConnection() {
        if (this.peer)
            this.peer.destroy();
        delete this.peer;
        delete this.peerId;

        localStorage.removeItem('stashedId');
        this.setSalt();
        const playerName = document.getElementById('player-name');
        playerName.disabled = false;
        this.stashedId.name = playerName.value;

        const connectButton = document.getElementById('create-connection-id');
        connectButton.onclick = this.openConnection.bind(this)
        connectButton.style.backgroundColor = 'transparent';
        connectButton.innerText = '<\\Connect>';

        document.getElementById('error-icon').style.display = 'none';
    }

    onConnectionSuccess() {
        console.log(`Started connection with peerID=${this.peerId}`);
        g_Lobby.leader = this.peerId;

        this.peer.on('connection', connection => {
            console.log('Incoming connection from ' + connection.peer);
            this.addConnection(connection);
            this.sendHandshake(connection);
        });
        this.peer.on('disconnect', () => {
            console.log('Disconnected - attempting reconnect')
            this.peer.reconnect();
        });

        const joinCode = this.getJoinCodeFromHash(window.location.hash);
        if (joinCode) {
            this.joinPlayer(joinCode);
        }
    }

    getJoinCodeFromHash(hash) {
        if (!hash.startsWith('#join=')) return null;
        return hash.split('=')[1].replace(/%20/g, " ");
    }

    printConnections() {
        console.log(`
        Connections: [${[...Object.keys(g_ConnectionManager.connections)]}]
        Packets Sent: ${g_ConnectionManager.packetManager.sentPackets}
        Packets Received: ${g_ConnectionManager.packetManager.receivedPackets}
        `);
    }

    joinPlayer(peerId) {
        if (g_Lobby.leader !== this.peerId) {
            console.error("Can't connect to other players as non-leader");
            return;
        }
        g_Lobby.leader = null;
        this.connectToPeer(peerId);
    }

    connectToPeer(peerId) {
        if (peerId === this.peerId) {
            console.log('Attempted self-connection');
            return;
        }
        else if (this.connections[peerId]) {
            console.log('Already connected to ' + peerId);
            return;
        }

        const connection = this.peer.connect(peerId);
        connection.on('open', () => {
            console.log('Connected to ' + peerId);
            this.addConnection(connection);
            this.sendHandshake(connection);
        });
    }

    addConnection(connection) {
        this.connections[connection.peer] = connection_t(connection);
        g_Lobby.refreshLobbyUI();
        connection.on('data', data => {
            this.packetManager.handlePacket(data, connection.peer, this);
        });
        connection.on('disconnect', () => {
            console.log(`Disconnected from "${connection.peer}", attempting reconnect`);
            delete this.connections[connection.peer];
            g_Lobby.refreshLobbyUI()
        });
        connection.on('close', () => {
            console.log(`Connection with "${connection.peer}" closed`);
            delete this.connections[connection.peer];
            g_Lobby.refreshLobbyUI()
        });
    }

    sendHandshake(connection) {
        this.packetManager.sentPackets++;
        const handshakePacket = JSON.stringify(new HandshakePacket(this.peerId), null);
        console.log(`Handshake outbound to "${connection.peer}":\n${handshakePacket}`);
        connection.send(handshakePacket);
    }

    broadcastPacket(packet) {
        const jsonPacket = JSON.stringify(packet, null);
        for(const conn in this.connections) {
            const connection = this.connections[conn]._conn;
            if (connection.open) {
                this.packetManager.sentPackets++;
                connection.send(jsonPacket);
            }
        }
    }
}

const connection_t = (connection) => {
    return {
        _conn: connection,
        ready: false
    };
}
