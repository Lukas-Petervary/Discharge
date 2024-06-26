export class PhysicsMesh {
    constructor(body, mesh) {
        this.body = body;
        this.mesh = mesh;
    }

    add() {
        window.world.world.addBody(this.body);
        window.renderer.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}