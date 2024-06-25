import ConnectionManager from './networking/ConnectionManager.js';
import { Terminal } from "./terminal/Terminal.js";
import { CustomCursor } from "./terminal/Cursor.js";
import { Renderer, Cube } from "./render/Renderer.js";

window.debugTerminal = new Terminal();
window.cursor = new CustomCursor();


window.renderer = new Renderer();
function animate() {
    requestAnimationFrame(animate);
    // Rotate all objects in the scene
    window.renderer.objects.forEach(object => {
        object.rotation.x += 0.01;
        object.rotation.y += 0.01;
    });

    // Render the scene
    window.renderer.sceneRenderer.render(window.renderer.scene, window.renderer.camera);
}
animate();

window.connection = new ConnectionManager();
connection.initialize();

window.debugTerminal.log('loaded terminal!');