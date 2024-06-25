import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";
import { CustomCursor } from "./terminal/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { createChar, movement } from "./client/player";

window.debugTerminal = new Terminal();
window.cursor = new CustomCursor();


window.renderer = new Renderer();
renderer.camera.position.set(0, 1.5, 2);

window.world = new World(renderer);
world.addSphere(1, { x: 0, y: 5, z: 0 });
createChar();

window.connection = new ConnectionManager();
connection.initialize();

window.debugTerminal.log('Finished initializing');

function animate() {
    requestAnimationFrame(animate);
    movement();

    world.step();
    renderer.render();
}
animate();