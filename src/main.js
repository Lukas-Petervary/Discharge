import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";
import { CustomCursor } from "./terminal/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/Player.js";

window.debugTerminal = new Terminal();
window.cursor = new CustomCursor();

window.renderer = new Renderer();
renderer.camera.position.set(0, 1.5, 2);

window.world = new World(renderer);
world.addSphere(1, { x: 0, y: 5, z: 0 });

window.mainPlayer = new Player();

window.connection = new ConnectionManager();
connection.initialize();

window.debugTerminal.log('Finished initializing');

function animate() {
    requestAnimationFrame(animate);
    if(window.cursor.isLocked)
        window.mainPlayer.movement();
    else
        window.world.fixToAngle(window.mainPlayer.playerBody, 0);
    world.step();
    renderer.render();
}
animate();