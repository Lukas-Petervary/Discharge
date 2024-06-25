import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";
import {CustomCursor} from "./terminal/Cursor.js";

window.debugTerminal = new Terminal();
window.cursor = new CustomCursor();

window.connection = new ConnectionManager();
connection.initialize();

window.debugTerminal.log('loaded terminal!');