import { PacketManager } from './PacketManager.js';
import { HandshakePacket, MessagePacket, AlertPacket, PositionPacket } from "./Packets.js";


export default class ConnectionManager {
    constructor() {
        this.peerId = localStorage.getItem('peerId') || this.generatePeerId();
        localStorage.setItem('peerId', this.peerId);
        this.peer = new Peer(this.peerId);
        this.connections = new Map(); // Store connections as a map
        this.packetManager = new PacketManager(); // Initialize packet registry

        this.packetManager.registerPacket('handshake', HandshakePacket.handleHandshake.bind(this));
        this.packetManager.registerPacket('message', MessagePacket.handleMessage.bind(this));
        this.packetManager.registerPacket('alert', AlertPacket.handleAlert.bind(this));
        this.packetManager.registerPacket('position', PositionPacket.handlePositionPacket.bind(this));
    }

    printConnections() {
        g_DebugTerminal.log(`
        Connections: [${[...g_ConnectionManager.connections.keys()]}]
        Packets Sent: ${g_ConnectionManager.packetManager.sentPackets}
        Packets Received: ${g_ConnectionManager.packetManager.receivedPackets}
        `);
    }

    generatePeerId() {
        return Math.random().toString(36).substring(7);
    }

    initialize() {
        this.peer.on('open', id => {
            g_DebugTerminal.log('My peer ID is: ' + id);
            document.getElementById('connection-id').textContent = 'Your Connection ID: ' + id;
        });

        this.peer.on('connection', connection => {
            g_DebugTerminal.log('Incoming connection from ' + connection.peer);
            this.addConnection(connection);
            this.sendHandshake(connection);
        });
    }

    connectToPeer(peerId) {
        if (peerId === this.peerId) {
            g_DebugTerminal.log('Attempted self-connection');
            return;
        }
        else if (this.connections.has(peerId)) {
            g_DebugTerminal.log('Already connected to ' + peerId);
            return;
        }

        const connection = this.peer.connect(peerId);
        connection.on('open', () => {
            g_DebugTerminal.log('Connected to ' + peerId);
            this.addConnection(connection);
            this.sendHandshake(connection);
        });
    }

    addConnection(connection) {
        this.connections.set(connection.peer, connection);
        connection.on('data', data => {
            this.packetManager.handlePacket(data, connection.peer, this);
        });

        connection.on('close', () => {
            g_DebugTerminal.log(`Connection with "${connection.peer}" closed`);
            document.getElementById(`peer-${connection.peer}`).remove();
            this.connections.delete(connection.peer);
        });
    }

    sendHandshake(connection) {
        this.packetManager.sentPackets++;
        const handshakePacket = JSON.stringify(new HandshakePacket(this.peerId), null);
        g_DebugTerminal.log(`Handshake outbound to "${connection.peer}":\n${handshakePacket}`);
        connection.send(handshakePacket);
    }

    sendMessage(message) {
        this.broadcastPacket(new MessagePacket(this.peerId+': '+message));
    }

    sendAlert(message) {
        this.broadcastPacket(new AlertPacket(message));
    }

    broadcastPacket(packet) {
        const jsonPacket = JSON.stringify(packet, null);
        this.connections.forEach(conn => {
            if (conn.open) {
                this.packetManager.sentPackets++;
                conn.send(jsonPacket);
            }
        });
    }

}