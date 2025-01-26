import * as CANNON from "cannon";
import * as THREE from "three";

export class PhysicsMesh {
    static SHOW_WIREFRAMES = false;
    constructor(body, mesh, addCallback = (body,mesh)=>{}, tickCallback = (body,mesh)=>{}, renderCallback = (dt,body,mesh)=>{}) {
        this.body = body;
        this.mesh = mesh;
        this.addCallback = addCallback;
        this.tickCallback = tickCallback;
        this.renderCallback = renderCallback;
    }

    add() {
        if (this.addCallback)
            this.addCallback(this.body, this.mesh);

        if (this.body) {
            this.body.debugMesh = createWireframe(this.body);
            this.body.debugMesh.visible = PhysicsMesh.SHOW_WIREFRAMES;
            g_world.world.addBody(this.body);
            g_renderer.scene.add(this.body.debugMesh);
        }
        if (this.mesh) g_renderer.scene.add(this.mesh);
        g_world.objects.push(this);
        return this;
    }

    update() {
        this.tickCallback(this.body, this.mesh);
    }

    render(dt, subtickInterp) {
        if (PhysicsMesh.SHOW_WIREFRAMES && this.body && this.body.debugMesh) {
            this.body.debugMesh.position.copy(_pos(this.body.position));
            this.body.debugMesh.quaternion.copy(_quat(this.body.quaternion));
        }

        if (this.mesh) {
            this.mesh.position.lerpVectors(
                _pos(this.body.previousPosition),
                _pos(this.body.position),
                subtickInterp
            );
            this.mesh.quaternion.slerpQuaternions(
                _quat(this.body.previousQuaternion),
                _quat(this.body.quaternion),
                subtickInterp
            );
        }
        this.renderCallback(dt, this.body, this.mesh);
    }

    remove() {
        g_renderer.scene.remove(this.mesh);
        g_renderer.scene.remove(this.body.debugMesh);
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

function createWireframe(body) {
    const group = new THREE.Group();

    body.shapes.forEach((shape, index) => {
        let geometry;

        if (shape instanceof CANNON.Sphere) {
            const radius = shape.radius;
            geometry = new THREE.SphereGeometry(radius, 16, 16);
        } else if (shape instanceof CANNON.Box) {
            const size = shape.halfExtents;
            geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
        } else if (shape instanceof CANNON.Cylinder) {
            const { radiusTop, radiusBottom, height, numSegments } = shape;
            geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, numSegments);
            geometry.rotateX(Math.PI / 2);
        } else if (shape instanceof CANNON.ConvexPolyhedron) {
            const vertices = shape.vertices.map(v => new THREE.Vector3(v.x, v.y, v.z));
            const indices = [];
            shape.faces.forEach(face => {
                for (let i = 1; i < face.length - 1; i++) {
                    indices.push(face[0], face[i], face[i + 1]);
                }
            });

            geometry = new THREE.BufferGeometry();
            const positions = vertices.flatMap(v => [v.x, v.y, v.z]);
            geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(positions, 3)
            );
            geometry.setIndex(indices);
        } else if (shape instanceof CANNON.Trimesh) {
            const positions = shape.vertices;
            const indices = shape.indices;

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(positions, 3)
            );
            geometry.setIndex(indices);
        } else {
            console.warn("Shape type not supported:", shape);
            return;
        }

        const material = new THREE.LineBasicMaterial({ color: 0x00cccc });
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe, material);

        const offset = body.shapeOffsets[index];
        const orientation = body.shapeOrientations[index];
        if (offset) {
            line.position.copy(offset);
        }
        if (orientation) {
            line.quaternion.copy(orientation);
        }

        group.add(line);
    });

    return group;
}