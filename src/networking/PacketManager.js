export class PacketManager {
    constructor() {
        this.packetHandlers = new Map();
        this.receivedPackets = 0;
        this.sentPackets = 0;
    }

    registerPacket(type, handler) {
        this.packetHandlers.set(type, handler);
    }

    handlePacket(data, fromPeerId, peerManager) {
        this.receivedPackets ++;
        const parsedData = JSON.parse(data);
        const handler = this.packetHandlers.get(parsedData.type);
        if (handler) {
            handler(parsedData, fromPeerId, peerManager);
        } else {
            debugTerminal.log(`No handler for packet type: ${parsedData.type}`);
        }
    }
}
