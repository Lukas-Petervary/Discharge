import {PacketManager, HandshakePacket} from "../../shared/PacketService.js";

export default class ClientConnection {
    constructor() {
        this.peerId = this.peer = this.serverConnection = null;
        this.packetManager = new PacketManager();
        this.connections = {};

        this.setSalt();
        this.openConnection();
    }

    setSalt() {
        this.stashedId = JSON.parse(localStorage.getItem('stashedId')) || { name: null, salt: null };
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
        connectButton.style.backgroundColor = "#0060AF";

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

            localStorage.setItem('stashedId', JSON.stringify(this.stashedId));

            clearInterval(intvl);
            connectButton.innerText = `<\\Connected>`;
            connectButton.style.backgroundColor = '#8afd00';

            this.peer.on('connection', connection => {
                console.log('Incoming connection from ' + connection.peer);
                this.connections[connection.peer] = connection;
                this.sendHandshake(connection);
            });
            this.peer.on('disconnect', () => {
                console.log('Disconnected - attempting reconnect')
                this.peer.reconnect();
            });

            const joinCode = this.getJoinCodeFromHash(window.location.hash);
            if (joinCode) {
                this.joinServer(joinCode);
            }
        } catch(err) {
            clearInterval(intvl);
            connectButton.innerText = `<\\Failed>`;
            connectButton.style.backgroundColor = '#fd008a';

            document.getElementById('error-icon').style.display = 'inline-flex';
            document.getElementById('error-tooltip').textContent = err.message || "Connection Failed";
            console.error("Peer ID check failed:", err);
        }
        connectButton.onclick = this.retryConnection.bind(this);
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

    getJoinCodeFromHash(hash) {
        if (!hash.startsWith('#join=')) return null;
        return hash.split('=')[1].replace(/%20/g, " ");
    }

    printConnections() {
        console.log(`
        Connections: [${[...Object.keys(g_ClientConnection.connections)]}]
        Packets Sent: ${g_ClientConnection.packetManager.sentPackets}
        Packets Received: ${g_ClientConnection.packetManager.receivedPackets}
        `);
    }

    joinServer(server_id = null) {
        const serverId = document.getElementById('join-server-id').value.toLowerCase() || server_id;
        const peerId = 'DischargeServer_'+ serverId;

        if (this.serverConnection != null) {
            console.error(`Attempted connection to server ${peerId} while already connected to ${this.serverConnection.peer}`);
            return;
        }

        this.connectToPeer(peerId, true)
            .then(conn => {
                this.serverConnection = conn;
                g_Lobby.onJoinServer();
            })
            .catch(err => console.error('Failed to connect to server:\n', err));
    }

    connectToPeer(peerId, isServer = false) {
        return new Promise((resolve, reject) => {
            if (peerId === this.peerId) {
                console.log('Attempted self-connection');
                reject(new Error(`Self-Connection ${peerId}`));
            }
            else if (this.connections[peerId]) {
                console.log('Already connected to ' + peerId);
                reject(new Error(`Existing Connection ${peerId}`));
            }

            const connection = this.peer.connect(peerId);
            connection.on('open', () => {
                console.log('Connected to ' + peerId);
                if (!isServer) {
                    g_Lobby._initPlayer(connection.peer);
                }

                connection.on('data', data => this.packetManager.handlePacket(data, connection.peer, this));
                const onDisconnect = isServer ? () => {
                    console.warn(`Connection with server terminated "${peerId}"`);
                    delete this.serverConnection;
                    g_Lobby.players = {};
                    g_Lobby.refreshLobbyUI();
                } : () => {
                    console.log(`Connection closed with ID="${connection.peer}"`);
                    delete this.connections[connection.peer];
                    g_Lobby.refreshLobbyUI()
                    g_Lobby.onLeave(connection.peer);
                };
                connection.on('disconnect', onDisconnect.bind(this));
                connection.on('close', onDisconnect.bind(this));

                this.sendHandshake(connection);
                resolve(connection);
            });
            connection.on('error', (err) => {
                reject(err);
            });
            this.peer.on('error', err => {
                if (err.type === 'peer-unavailable') {
                    reject(err.message);
                }
            });
        });
    }

    sendHandshake(connection) {
        this.packetManager.sentPackets++;
        const handshakePacket = JSON.stringify(new HandshakePacket(), null);
        console.log(`Handshake outbound to "${connection.peer}":\n`, handshakePacket);
        connection.send(handshakePacket);
    }

    sendPacket(packet) {
        const jsonPacket = JSON.stringify(packet, null);
        this.serverConnection.send(jsonPacket);
        this.packetManager.sentPackets++;
    }
}