import {PhysicsMesh} from "./PhysicsMesh.js";
import * as THREE from "three";

export class LightMesh extends PhysicsMesh {
    static DEBUG_LIGHTS = false;
    constructor(lightSource, {addCallback, tickCallback, renderCallback}) {
        super(null, lightSource, addCallback, tickCallback, renderCallback);
        this.mesh.debugVisual = new THREE.CameraHelper(lightSource.shadow.camera);
        this.mesh.debugVisual.visible = LightMesh.DEBUG_LIGHTS;
    }

    add() {
        this.addCallback(this.mesh)
        g_renderer.scene.add(this.mesh);
        g_renderer.scene.add(this.mesh.debugVisual);
        g_world.objects.push(this);
        return this;
    }

    render(dt, subtickInterp) {
        this.renderCallback(dt, null, this.mesh);
    }

    remove() {
        g_renderer.scene.remove(this.mesh);
        g_renderer.scene.remove(this.mesh.debugVisual);
        g_world.objects.splice(g_world.objects.indexOf(this), 1);
    }
}