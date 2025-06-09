import {DirectConnectPacket, KickPlayerPacket, PacketManager} from '../../shared/PacketService.js';

export class ServerConnection {
    constructor() {
        this.peer = null;
        this.peerId = localStorage.getItem('serverId') || "DischargeServer_" + this.r_();

        this.connections = {};
        this.packetManager = new PacketManager();

        this.openConnection().then(() => console.log(`Connection started with ID: ${this.peerId}`));
    }

    r_() {
        let r = (Math.random()).toString(36);
        return r.substring(r.length - 8);
    }

    async openConnection() {
        while(true) {
            try {
                this.peer = new Peer(this.peerId);
                await new Promise((resolve, reject) => {
                    this.peer.on('open', resolve);
                    this.peer.on('error', err => reject(err));
                });

                this._onConnectionSuccess();
                return;
            } catch(err) {
                console.error(err);
                this._onConnectionFailure();
            }
        }
    }

    _onConnectionSuccess() {
        localStorage.setItem('serverId', this.peerId);

        this.peer.on('connection', connection => {
            console.log('Incoming connection from ' + connection.peer);
            this.addConnection(connection);
        });
        this.peer.on('disconnect', () => {
            console.log('Disconnected - attempting reconnect')
            this.peer.reconnect();
        });
    }
    _onConnectionFailure() {
        if (this.peer)
            this.peer.destroy();
        delete this.peer;
        delete this.peerId;

        localStorage.removeItem('serverId');
        this.peerId = "DischargeServer_" + this.r_();
    }

    addConnection(connection) {
        this.connections[connection.peer] = connection;
        g_ServerLobby.addPlayer(connection);

        connection.on('data', data => {
            this.packetManager.handlePacket(data, connection.peer, this);
        });
        const onDisconnect = () => {
            console.log(`Connection with "${connection.peer}" closed`);
            this.broadcastPacket(new KickPlayerPacket(connection.peer));
            g_ServerLobby.removePlayer(connection.peer);
            delete this.connections[connection.peer];
        }
        connection.on('disconnect', onDisconnect.bind(this));
        connection.on('close', onDisconnect.bind(this));
    }

    directConnectPlayers(peer1, peer2) {
        this.sendPacket(peer1, new DirectConnectPacket(peer1, peer2));
        this.sendPacket(peer2, new DirectConnectPacket(peer1, peer2));
    }

    sendPacket(peerId, packet) {
        this.connections[peerId].send(JSON.stringify(packet));
        this.packetManager.sentPackets++;
    }

    broadcastPacket(packet) {
        for (const peerId in this.connections) {
            this.connections[peerId].send(JSON.stringify(packet));
            this.packetManager.sentPackets++;
        }
    }
}