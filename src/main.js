import ConnectionManager from './networking/ConnectionManager.js';
import { CustomCursor } from "./overlay/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/player/Player.js";
import { MenuRegistry } from "./overlay/MenuRegistry.js";
import { AudioManager } from "./client/audio/AudioManager.js";
import { Controls, KeybindManager } from "./client/controls/Keybinds.js";
import { Translatable } from "./client/Translatable.js";
import { Stats } from "./overlay/Stats.js";

async function init() {
    window.g_AudioManager = new AudioManager();
    g_AudioManager.init();

    window.Lang = new Translatable();
    Lang.swapJson('assets/lang/english.json');

    window.g_Cursor = new CustomCursor();
    window.g_KeybindManager = new KeybindManager();
    window.g_Menu = new MenuRegistry();
    window.g_Controls = new Controls();

    window.g_renderer = new Renderer();
    g_renderer.camera.position.set(0, 1.5, 2);

    window.g_world = new World();

    window.g_MainPlayer = new Player();

    window.g_ConnectionManager = new ConnectionManager();
    g_ConnectionManager.init();

    console.log('Finished instantiating connection');
    g_world.loadGLTFModel('assets/terrain/maps/portbase/scene.gltf');

    window.runtimeStats = new Stats();
}

function onStart() {
    runtimeStats.showPanel(0);
    runtimeStats.dom.style.display = 'none';
    document.body.appendChild(runtimeStats.dom);

    g_Menu.showMenu('pause-menu');
    g_world.addSphere(1, { x: 0, y: 5, z: 0 });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    g_renderer.scene.add(ambientLight);
}

function updateWorld(timeStep) {
    g_AudioManager.pushPlayerPosition();

    if(g_Cursor.isLocked)
        g_MainPlayer.move();

    g_world.step(timeStep);
}

function render() {
    g_MainPlayer.moveCamera();
    g_Cursor.delta = {dx: 0, dy: 0};
    g_renderer.render();
    g_KeybindManager.update();
}

let lastUpdateTime = 0;
const fixedTimeStep = 1000 / 60; // 60 updates per second
let accumulator = 0;

function gameLoop(currentTime) {
    runtimeStats.begin();
    const deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;
    accumulator += deltaTime;

    // Process fixed time steps
    while (accumulator >= fixedTimeStep) {
        updateWorld(fixedTimeStep / 1000);
        accumulator -= fixedTimeStep;
    }

    // Render frame with interpolation
    const interpolation = accumulator / fixedTimeStep;
    render(interpolation);

    runtimeStats.end();
    requestAnimationFrame(gameLoop);
}

await init().then(() => {
        console.log('Finished initializing');
        onStart();
        requestAnimationFrame(gameLoop);
});