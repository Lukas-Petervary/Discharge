
import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";
import { CustomCursor } from "./terminal/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/Player.js";


window.cursor = new CustomCursor();
window.debugTerminal = new Terminal();

window.renderer = new Renderer();
renderer.camera.position.set(0, 1.5, 2);

window.world = new World(renderer);
world.addSphere(1, { x: 0, y: 5, z: 0 });

window.mainPlayer = new Player();

debugTerminal.log('Finished initializing');

window.connectionManager = new ConnectionManager();
connectionManager.initialize();

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
world.renderer.scene.add(ambientLight);



debugTerminal.log('Finished instantiating connection');
world.loadGLTFModel('../../assets/terrain/maps/portbase/scene.gltf');

function animate() {
    requestAnimationFrame(animate);
    if(window.cursor.isLocked)
        window.mainPlayer.movement();
    else
        window.world.fixToAngle(window.mainPlayer.playerBody.physicsMesh, 0);
    world.step();
    renderer.render();
    //debugTerminal.log(`playerBody pos: ${mainPlayer.playerBody.body.position}`);
}
animate();