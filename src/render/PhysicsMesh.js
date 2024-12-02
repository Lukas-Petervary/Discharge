import * as THREE from "three";

export class PhysicsMesh {
    constructor(body, mesh, addCallback, updateCallback) {
        this.body = body;
        this.mesh = mesh;
        this.uuid = mesh.uuid;
        this.addCallback = addCallback;
        this.updateCallback = updateCallback;
    }

    add() {
        if (this.addCallback)
            this.addCallback(this.body, this.mesh);
        g_world.world.addBody(this.body);
        g_renderer.scene.add(this.mesh);
        g_world.objects.push(this);
    }

    update() {
        if (this.updateCallback)
            this.updateCallback(this.body, this.mesh);
        this.mesh.position.copy( _pos(this.body.position) );
        this.mesh.quaternion.copy( _quat(this.body.quaternion) );
    }

    remove() {
        g_renderer.scene.remove(this.mesh);
        g_world.world.removeBody(this.body);
        g_world.objects.splice(g_world.objects.indexOf(this), 1);
    }
}

function _pos(pos) {
    return new THREE.Vector3(pos.x, pos.y, pos.z);
}
function _quat(quat) {
    return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
}