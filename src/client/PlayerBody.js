import {PhysicsMesh} from "../render/PhysicsMesh.js";

const height = 2;
const crouchHeight = 1;

export class PlayerBody {
    constructor() {
        this.body = null;
        this.mesh = null;
        this.physicsMesh = null;
        this.onGround = true;
        this.playerMaterial = new CANNON.Material('player');

        this.init();
    }

    init() {
        world.world.addContactMaterial(
            new CANNON.ContactMaterial(this.playerMaterial, world.groundMaterial, {
                friction: 0.4,
                restitution: 0.4
            })
        );

        this.addBody();
        this.addMesh();

        // Integrate callbacks
        const contactNormal = new CANNON.Vec3();
        const upAxis = new CANNON.Vec3(0,1,0);
        const addEventListeners = (body, mesh) => {
            body.addEventListener("collide", (e) => {
                let contact = e.contact;

                contact.bi.id === body.id ? contact.ni.negate(contactNormal) : contactNormal.copy(contact.ni);

                if(contactNormal.dot(upAxis) > 0.5)
                    this.onGround = true;
            });
        };
        const forceUpright = (body, mesh) => {
            const q = body.quaternion;
            const yaw = Math.atan2(2 * (q.w * q.y + q.z * q.x), 1 - 2 * (q.y * q.y + q.x * q.x));

            const newQuaternion = new CANNON.Quaternion();
            newQuaternion.setFromEuler(0, yaw, 0, 'YXZ');

            body.quaternion.copy(newQuaternion);
            body.angularVelocity.set(0,0,0);
        };

        // Create PhysicsObject
        this.physicsMesh = new PhysicsMesh(this.body, this.mesh, addEventListeners, forceUpright);
        this.physicsMesh.add();
    }

    addBody() {
        const capsuleBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 0, 0),
            material: this.playerMaterial,
        });

        const sphereShape = new CANNON.Sphere(height/2);
        const cylinderShape = new CANNON.Cylinder(height/2, height/2, height/2, 16);

        //capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, height / 2, 0));
        //capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -height / 2, 0));
        capsuleBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2));
        this.body = capsuleBody;
    }

    addMesh() {
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/SkySkybox.png');
        const capsuleMaterial = new THREE.MeshPhongMaterial({ map: texture });

        const capsuleGeometry = new THREE.CylinderGeometry(height/2, height/2, height, 8);
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        const topSphereGeometry = new THREE.SphereGeometry(height/2, 32, 32);
        const topSphereMesh = new THREE.Mesh(topSphereGeometry, capsuleMaterial);
        topSphereMesh.position.y = height / 2;

        const bottomSphereGeometry = new THREE.SphereGeometry(height/2, 32, 32);
        const bottomSphereMesh = new THREE.Mesh(bottomSphereGeometry, capsuleMaterial);
        bottomSphereMesh.position.y = -height / 2;

        const capsuleGroup = new THREE.Group();
        capsuleGroup.add(capsuleMesh);
        capsuleGroup.add(topSphereMesh);
        capsuleGroup.add(bottomSphereMesh);
        capsuleGroup.castShadow = true;
        capsuleGroup.position.set(0, 0, 0);

        this.mesh = capsuleGroup;
    }
}