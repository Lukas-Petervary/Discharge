export class PhysicsMesh {
    constructor(body, mesh, addCallback, updateCallback) {
        this.body = body;
        this.mesh = mesh;
        this.addCallback = addCallback;
        this.updateCallback = updateCallback;
    }

    add() {
        if (this.addCallback)
            this.addCallback(this.body, this.mesh);
        window.world.world.addBody(this.body);
        window.renderer.scene.add(this.mesh);
    }

    update() {
        if (this.updateCallback)
            this.updateCallback(this.body, this.mesh);
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}