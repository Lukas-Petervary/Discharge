import * as CANNON from 'cannon';
import * as THREE from 'three';
import { PhysicsMesh } from "../../render/PhysicsMesh.js";

const height = 2;
const radius = 0.75;
const crouchHeight = 1;

export class PlayerBody {
    constructor() {
        this.playerMaterial = new CANNON.Material('player');
        g_world.world.addContactMaterial(
            new CANNON.ContactMaterial(this.playerMaterial, g_world.groundMaterial, {
                friction: 0,
                restitution: 0.1
            })
        );

        // Cannon capsule object
        const capsuleBody = new CANNON.Body({
            mass: 1,
            material: this.playerMaterial,
            fixedRotation: true,
            linearDamping: 0.9,
        });

        const cylinder = new CANNON.Cylinder(radius, radius, height - 2 * radius, 8);
        const cylinderQuaternion = new CANNON.Quaternion();
        cylinderQuaternion.setFromEuler(Math.PI / 2, 0, 0);  // Rotate so it's vertical
        capsuleBody.addShape(cylinder, new CANNON.Vec3(0, 0, 0), cylinderQuaternion);

        const B_sphereTop = new CANNON.Sphere(radius);
        capsuleBody.addShape(B_sphereTop, new CANNON.Vec3(0, height / 2 - radius, 0));

        const B_sphereBottom = new CANNON.Sphere(radius);
        capsuleBody.addShape(B_sphereBottom, new CANNON.Vec3(0, -height / 2 + radius, 0));

        // Three.js capsule mesh
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/SkySkybox.png');
        const capsuleMaterial = new THREE.MeshPhongMaterial({ map: texture });

        const cylinderHeight = height - 2 * radius;  // Adjusted to leave space for hemispheres
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, cylinderHeight, 8);
        const cylinderMesh = new THREE.Mesh(cylinderGeometry, capsuleMaterial);
        cylinderMesh.position.set(0, 0, 0); // Center cylinder

        const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
        const topSphereMesh = new THREE.Mesh(sphereGeometry, capsuleMaterial);
        topSphereMesh.position.set(0, cylinderHeight / 2, 0);

        const bottomSphereMesh = new THREE.Mesh(sphereGeometry, capsuleMaterial);
        bottomSphereMesh.position.set(0, -cylinderHeight / 2, 0);

        const playerMesh = new THREE.Group();
        playerMesh.add(cylinderMesh);
        playerMesh.add(topSphereMesh);
        playerMesh.add(bottomSphereMesh);
        playerMesh.castShadow = true;

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

        // Create Physics Object
        this.physicsMesh = new PhysicsMesh(capsuleBody, playerMesh, addEventListeners.bind(this));
        this.physicsMesh.add();
        return this.physicsMesh;
    }
}
