import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./overlay/Terminal.js";
import { CustomCursor } from "./overlay/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/Player.js";
import { MenuRegistry } from "./overlay/MenuRegistry.js";
import { AudioManager } from "./client/audio/AudioManager.js";

async function main() {
    await init();
    g_DebugTerminal.log('Finished initializing');

    onStart();
    animate();
}

async function init() {
    window.g_AudioManager = new AudioManager();
    g_AudioManager.init();

    window.g_MenuRegistry = new MenuRegistry();

    window.g_cursor = new CustomCursor();
    window.g_DebugTerminal = new Terminal();

    window.g_renderer = new Renderer();
    g_renderer.camera.position.set(0, 1.5, 2);

    window.g_world = new World();

    window.g_MainPlayer = new Player();

    window.g_ConnectionManager = new ConnectionManager();
    g_ConnectionManager.initialize();

    g_DebugTerminal.log('Finished instantiating connection');
    g_world.loadGLTFModel('assets/terrain/maps/portbase/scene.gltf');
}

function onStart() {
    g_MenuRegistry.showMenu('pause-menu');
    g_world.addSphere(1, { x: 0, y: 5, z: 0 });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    g_renderer.scene.add(ambientLight);
}

function tick() {
    g_AudioManager.pushPlayerPosition();

    if(g_cursor.isLocked)
        g_MainPlayer.movement();

    g_cursor.delta = {dx: 0, dy: 0};
    g_world.step();
}

function animate() {
    requestAnimationFrame(animate);
    tick();
    g_renderer.render();
}

main();