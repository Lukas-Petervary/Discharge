import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./overlay/Terminal.js";
import { CustomCursor } from "./overlay/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/Player.js";
import { MenuRegistry } from "./overlay/MenuRegistry.js";

window.g_MenuRegistry = new MenuRegistry();
g_MenuRegistry.showMenu('pause-menu');

window.g_cursor = new CustomCursor();
window.g_DebugTerminal = new Terminal();

window.g_renderer = new Renderer();
g_renderer.camera.position.set(0, 1.5, 2);

window.g_world = new World(g_renderer);
g_world.addSphere(1, { x: 0, y: 5, z: 0 });

window.g_MainPlayer = new Player();

g_DebugTerminal.log('Finished initializing');

window.g_ConnectionManager = new ConnectionManager();
g_ConnectionManager.initialize();

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
g_world.renderer.scene.add(ambientLight);

g_DebugTerminal.log('Finished instantiating connection');
g_world.loadGLTFModel('../../assets/terrain/maps/portbase/scene.gltf');

function animate() {
    requestAnimationFrame(animate);
    if(window.g_cursor.isLocked)
        window.g_MainPlayer.movement();
    else
        window.g_world.fixToAngle(window.g_MainPlayer.playerBody, 0);
    g_world.step();
    g_renderer.render();
}
animate();