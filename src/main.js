import ConnectionManager from './networking/ConnectionManager.js';
import * as THREE from 'three';
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { ClientPlayer } from "./client/player/ClientPlayer.js";
import { MenuRegistry } from "./overlay/MenuRegistry.js";
import { AudioManager } from "./client/audio/AudioManager.js";
import { Controls } from "./client/controls/Keybinds.js";
import { Stats } from "./overlay/Stats.js";
import { Server } from "./networking/Server.js";

async function init() {
    window.g_AudioManager = new AudioManager();
    g_AudioManager.init();

    window.g_Menu = new MenuRegistry();

    window.g_renderer = new Renderer();
    window.g_world = new World();

    window.g_Controls = Controls;
    window.g_Client = new ClientPlayer();
    window.g_ConnectionManager = new ConnectionManager();
    window.g_Lobby = new Server();

    window.runtimeStats = new Stats();

    const _originalLog = console.log;
    const _originalWarn = console.warn;
    const _originalError = console.error;
    const _originalTrace = console.trace;

    console.log = console.warn = console.error = console.trace = () => {};
    window.enableDebug = () => {
        console.log = _originalLog;
        console.warn = _originalWarn;
        console.error = _originalError;
        console.trace = _originalTrace;
        console.log("%c! DEBUG MODE ENABLED !", "background: yellow; color: black; font-size: 200%;")
    }
}

function onStart() {
    g_world.addPlane();

    runtimeStats.showPanel(0);
    runtimeStats.dom.style.display = 'none';
    document.body.appendChild(runtimeStats.dom);

    g_Menu.showMenu('start-menu');

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    g_renderer.scene.add(ambientLight);

    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        /** TODO:
         * Save persistent data to local storage
         * Pop-up to download persistent data in json file
         */
    })
    window.addEventListener('unload', () => g_ConnectionManager.peer.destroy());
}

function render(dt) {
    g_Client.moveCamera();
    g_renderer.render(dt);
}

let prevT = 0;
const fixedTimeStep = 1000 / 60;
let accumulator = 0;
let running = false;

function gameLoop(t) {
    if (!running) return;

    runtimeStats.begin();
    const dt = t - prevT;
    prevT = t;
    accumulator += dt;

    while (accumulator >= fixedTimeStep) {
        g_Controls.update();
        if(g_Controls.cameraControls.isEnabled) {
            g_Client.move();
        }
        g_AudioManager.pushPlayerPosition();
        g_world.step(fixedTimeStep);

        accumulator -= fixedTimeStep;
    }

    const interpolation = accumulator / fixedTimeStep;
    render(interpolation);
    runtimeStats.end();

    requestAnimationFrame(gameLoop);
}

await init().then(() => {
    console.log('Finished initializing');
    window.startGameLoop = () => {
        if (!running) {
            running = true;
            requestAnimationFrame(gameLoop);
        } else {
            running = false;
        }
    };
    onStart();
});