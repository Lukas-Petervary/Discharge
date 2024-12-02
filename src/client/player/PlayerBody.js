import * as CANNON from 'cannon';
import * as THREE from 'three';
import { PhysicsMesh } from "../../render/PhysicsMesh.js";
import {ClientPlayer} from "./ClientPlayer.js";

const height = 2;
const radius = 0.75;
const crouchHeight = 1;

export class PlayerBody extends PhysicsMesh {
    constructor(name) {
        const body = PlayerBody.Body_();
        const nametag = PlayerBody.Nametag_(name);
        const mesh = PlayerBody.Mesh_();

        if (nametag) {
            nametag.position.copy(mesh.position);
            nametag.position.y += height;
            mesh.add(nametag);
        }


        // Integrate callbacks for physics
        const contactNormal = new CANNON.Vec3();
        const upAxis = new CANNON.Vec3(0, 1, 0);
        const addEventListeners = (body) => {
            body.addEventListener("collide", (e) => {
                let contact = e.contact;

                contact.bi.id === body.id ? contact.ni.negate(contactNormal) : contactNormal.copy(contact.ni);

                if (contactNormal.dot(upAxis) > 0.5) {
                    g_Client.canJump = true;
                }
            });
        };

        // Create Physics Object
        super(body, mesh, addEventListeners);
        this.add();
    }

    static Body_() {
        const capsuleBody = new CANNON.Body({
            mass: 1,
            material: g_world.playerMaterial,
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

        return capsuleBody;
    }

    static Mesh_() {
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
        playerMesh.receiveShadow = playerMesh.castShadow = true;

        return playerMesh;
    }

    static Nametag_(name) {
        if (!name) return null;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const fontSize = 200;

        canvas.width = name.length * fontSize + 20;
        canvas.height = fontSize + 20;
        context.font = `${fontSize}px 'JetBrains Mono', monospace`;

        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        const aspectRatio = canvas.width / canvas.height;
        sprite.scale.set(aspectRatio / 2, 0.5, 1);

        return sprite;
    }
}