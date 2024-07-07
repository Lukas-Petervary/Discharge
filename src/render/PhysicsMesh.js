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

        g_World.physicsWorld.addRigidBody(this.body);
        g_Renderer.scene.add(this.mesh);
        g_World.objects.push(this);
    }

    update() {
        if (this.updateCallback)
            this.updateCallback(this.body, this.mesh);

        // Update mesh position and rotation to match the physics body
        const ms = this.body.getMotionState();
        if (ms) {
            ms.getWorldTransform(g_World.transform);
            const p = g_World.transform.getOrigin();
            const q = g_World.transform.getRotation();
            this.mesh.position.set(p.x(), p.y(), p.z());
            this.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
}