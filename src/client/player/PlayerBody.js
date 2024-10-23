import { PhysicsMesh } from "../../render/PhysicsMesh.js";

const height = 2;
const crouchHeight = 1;

export class PlayerBody {
    constructor() {
        this.playerMaterial = new CANNON.Material('player');
        g_world.world.addContactMaterial(
            new CANNON.ContactMaterial(this.playerMaterial, g_world.groundMaterial, {
                friction: 0,
                restitution: 0
            })
        );

        // Cannon capsule object
        const cylinderShape = new CANNON.Cylinder(height / 4, height / 4, height / 2, 16);
        const sphereShape = new CANNON.Sphere(height / 4);

        const capsuleBody = new CANNON.Body({ mass: 1 });

        const cylinderOffset = new CANNON.Vec3(0, height / 4, 0);

        // Create the two spheres (caps)
        const topSphereOffset = new CANNON.Vec3(0, height / 2, 0);  // Position for the top sphere
        const bottomSphereOffset = new CANNON.Vec3(0, -height / 2, 0);  // Position for the bottom sphere

// Add the cylinder to the body at the center
        capsuleBody.addShape(cylinderShape, cylinderOffset);

// Add the top and bottom spheres to the body
        capsuleBody.addShape(sphereShape, topSphereOffset);  // Top sphere
        capsuleBody.addShape(sphereShape, bottomSphereOffset);

        //capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2));

        // Three.js capsule mesh
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/SkySkybox.png');
        const capsuleMaterial = new THREE.MeshPhongMaterial({ map: texture });

        const capsuleGeometry = new THREE.CylinderGeometry(height / 2, height / 2, height, 8);
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        const capsuleGroup = new THREE.Group();
        capsuleGroup.add(capsuleMesh);
        capsuleMesh.castShadow = true;

        // Integrate callbacks for physics
        const contactNormal = new CANNON.Vec3();
        const upAxis = new CANNON.Vec3(0, 1, 0);

        const addEventListeners = (body) => {
            body.addEventListener("collide", (e) => {
                let contact = e.contact;

                contact.bi.id === body.id ? contact.ni.negate(contactNormal) : contactNormal.copy(contact.ni);

                if (contactNormal.dot(upAxis) > 0.5) {
                    g_MainPlayer.canJump = true;
                }
            });
        };

        const forceUpright = (body) => {
            const q = body.quaternion;
            const yaw = Math.atan2(2 * (q.w * q.y + q.z * q.x), 1 - 2 * (q.y * q.y + q.x * q.x));

            const newQuaternion = new CANNON.Quaternion();
            newQuaternion.setFromEuler(0, yaw, 0, 'YXZ');

            body.quaternion.copy(newQuaternion);
            body.angularVelocity.set(0, 0, 0);
        };

        // Create Physics Object
        this.physicsMesh = new PhysicsMesh(capsuleBody, capsuleGroup, addEventListeners.bind(this), forceUpright.bind(this));
        this.physicsMesh.add();
        return this.physicsMesh; 
    }
}
