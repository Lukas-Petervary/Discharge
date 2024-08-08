import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./overlay/Terminal.js";
import { CustomCursor } from "./overlay/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/player/Player.js";
import { MenuRegistry } from "./overlay/MenuRegistry.js";
import { AudioManager } from "./client/audio/AudioManager.js";
import { Controls, KeybindManager } from "./client/controls/Keybinds.js";

async function main() {
    await init();
    g_DebugTerminal.log('Finished initializing');

    onStart();
    animate();
    setInterval(tick, 1000 / 60);
    startRTS();
}

async function init() {
    window.g_AudioManager = new AudioManager();
    g_AudioManager.init();

    window.g_MenuRegistry = new MenuRegistry();

    window.g_cursor = new CustomCursor();
    window.g_KeybindManager = new KeybindManager();
    window.g_Controls = new Controls();

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
        g_MainPlayer.move();

    g_cursor.delta = {dx: 0, dy: 0};
    g_world.step();

    tickCount++;
}

function animate() {
    g_MainPlayer.moveCamera();
    g_renderer.render();
    g_KeybindManager.update();
    frameCount++;
    requestAnimationFrame(animate);
}

// to do: brutally memory inefficient storage, update to make faster/lighter
function startRTS() {
    let heapLimit, totalSize, usedHeap;
    if (recordHeap) {
        heapLimit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
    } else {
        g_DebugTerminal.log('Memory API is not supported in this browser.');
        heapLimit = totalSize = usedHeap = -1;
    }

    window.runtimeStats = {
        tps: [],
        fps: [],
        heap_size_limit: heapLimit,
        heap_size: [],
        used_heap: []
    };

    setInterval(collectRTS, 1000);
}

let tickCount = 0;
let frameCount = 0;
const recordHeap = window.performance && performance.memory;
function collectRTS() {
    runtimeStats.tps.push(tickCount);
    runtimeStats.fps.push(frameCount);
    if (recordHeap) {
        runtimeStats.heap_size.push(performance.memory.totalJSHeapSize / 1024 / 1024);
        runtimeStats.used_heap.push(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    console.log(`tps: ${tickCount}`, `fps: ${frameCount}`);
    tickCount = 0;
    frameCount = 0;
}

main();
