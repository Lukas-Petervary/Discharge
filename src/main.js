import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";

window.debugTerminal = new Terminal();
window.connection = new ConnectionManager();
connection.initialize();

window.debugTerminal.log('loaded terminal!');