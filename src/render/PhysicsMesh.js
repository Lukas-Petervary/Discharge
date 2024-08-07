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
        g_world.world.addBody(this.body);
        g_renderer.scene.add(this.mesh);
        g_world.objects.push(this);
    }

    update() {
        if (this.updateCallback)
            this.updateCallback(this.body, this.mesh);
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}