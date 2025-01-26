import ClientConnection from './networking/ClientConnection.js';
import * as THREE from "three";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { ClientPlayer } from "./player/ClientPlayer.js";
import { MenuRegistry } from "./overlay/MenuRegistry.js";
import { Controls } from "./player/controls/Keybinds.js";
import { Stats } from "./overlay/Stats.js";
import { Lobby } from "./networking/Lobby.js";
import { MeshDelivery } from "./render/mesh/MeshDelivery.js";
import { LightMesh } from "./render/mesh/LightMesh.js";
import {AudioHandler} from "./player/audio/AudioHandler.js";

async function init() {
    window.g_Menu = new MenuRegistry();

    window.g_FBXDelivery = new MeshDelivery();
    await g_FBXDelivery.init();

    window.g_renderer = new Renderer();
    window.g_world = new World();

    window.g_AudioManager = new AudioHandler(g_renderer.camera);
    await g_AudioManager.init();

    window.g_Controls = Controls;
    window.g_Client = new ClientPlayer();
    window.g_ClientConnection = new ClientConnection();
    window.g_Lobby = new Lobby();

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

    enableDebug()

    window.dispatchEvent(new CustomEvent("finishgameload"));
}

function onStart() {
    g_world.addPlane();

    runtimeStats.showPanel(0);
    runtimeStats.dom.style.display = 'none';
    document.body.appendChild(runtimeStats.dom);

    g_Menu.showMenu('start-menu');

    g_renderer.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const callback = (light) => {
        light.castShadow = true;
        light.position.set(5, 5, 5);
    }
    const directionalLight = new LightMesh(new THREE.DirectionalLight(0xffffff, 3), {addCallback: callback}).add();

    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        /** TODO:
         * Save persistent data to local storage
         * Pop-up to download persistent data in json file
         */
    })
    window.addEventListener('unload', () => g_ClientConnection.peer.destroy());
}

function render(dt) {
    g_renderer.render(dt);
    g_Client.moveCamera();
}

let running = false;
function gameLoop() {
    if (running) requestAnimationFrame(gameLoop);

    runtimeStats.begin();
    g_renderer.time.deltaTime = g_renderer.clock.getDelta();
    g_renderer.time.subTickTime += g_renderer.time.deltaTime;

    while (g_renderer.time.subTickTime >= g_world.TICK_RATE) {
        g_Controls.update();
        g_Client.move();

        g_world.step(g_world.TICK_RATE);
        g_renderer.time.subTickTime -= g_world.TICK_RATE;
    }

    render(g_renderer.time.deltaTime);
    runtimeStats.end();
}

await init().then(() => {
    console.log('Finished initializing');
    window.toggleGameLoop = () => {
        if (!running) {
            running = true;
            requestAnimationFrame(gameLoop);
        } else {
            running = false;
        }
    };
    onStart();
});