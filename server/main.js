import {ServerConnection} from "./networking/ServerConnection.js";
import {StartGamePacket} from "/PacketService.js";

window.g_ServerConnection = new ServerConnection();

document.getElementById('start-button').onclick = () => {
    g_ServerConnection.broadcastPacket(new StartGamePacket())
}