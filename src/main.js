import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";
import { CustomCursor } from "./terminal/Cursor.js";
import { Renderer } from "./render/Renderer.js";
import { World } from "./render/World.js";
import { Player } from "./client/Player.js";

window.addEventListener("DOMContentLoaded", () => {
    window.cursor = new CustomCursor();
    window.debugTerminal = new Terminal();

    window.g_Renderer = new Renderer();
    //window.g_World = new World();

    const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(2, 5, 5),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    sphereMesh.position.set(0, 0, 2);

    g_Renderer.scene.add(sphereMesh);

    Ammo().then((Ammo) => {


        //window.mainPlayer = new Player();

        debugTerminal.log('Finished initializing');

        //window.connectionManager = new ConnectionManager();
        //connectionManager.initialize();

        //g_World.loadGLTFModel('../../assets/terrain/maps/portbase/scene.gltf');
    });
    animate()
});

function animate() {
    window.requestAnimationFrame(animate);
    if(window.cursor.isLocked)
        //window.mainPlayer.movement();

    //g_World.step();
    g_Renderer.render();
}