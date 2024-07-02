import {PhysicsMesh} from "../render/PhysicsMesh.js";

const height = 2;
const crouchHeight = 1;

export class PlayerBody {
    constructor() {
        this.playerMaterial = new CANNON.Material('player');
        world.world.addContactMaterial(
            new CANNON.ContactMaterial(this.playerMaterial, world.groundMaterial, {
                friction: 0,
                restitution: 0
            })
        );

        // Cannon capsule object
        const cylinderShape = new CANNON.Cylinder(height/2, height/2, height/2, 16);
        const capsuleBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 0, 0),
            shape: cylinderShape,
            material: this.playerMaterial
        });

        const sphereShape = new CANNON.Sphere(height/2);


        //capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, height / 2, 0));
        //capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -height / 2, 0));
        capsuleBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2));

        // Three capsule mesh
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/SkySkybox.png');
        const capsuleMaterial = new THREE.MeshPhongMaterial({ map: texture });

        const capsuleGeometry = new THREE.CylinderGeometry(height/2, height/2, height, 8);
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        //const topSphereGeometry = new THREE.SphereGeometry(height/2, 32, 32);
        //const topSphereMesh = new THREE.Mesh(topSphereGeometry, capsuleMaterial);
        //topSphereMesh.position.y = height / 2;

        //const bottomSphereGeometry = new THREE.SphereGeometry(height/2, 32, 32);
        //const bottomSphereMesh = new THREE.Mesh(bottomSphereGeometry, capsuleMaterial);
        //bottomSphereMesh.position.y = -height / 2;

        const capsuleGroup = new THREE.Group();
        capsuleGroup.add(capsuleMesh);
        //capsuleGroup.add(topSphereMesh);
        //capsuleGroup.add(bottomSphereMesh);
        capsuleMesh.castShadow = true;

        // Integrate callbacks
        const contactNormal = new CANNON.Vec3();
        const upAxis = new CANNON.Vec3(0,1,0);
        const addEventListeners = (body, mesh) => {
            body.addEventListener("collide", (e) => {
                let contact = e.contact;

                contact.bi.id === body.id ? contact.ni.negate(contactNormal) : contactNormal.copy(contact.ni);

                if(contactNormal.dot(upAxis) > 0.5)
                    mainPlayer.canJump = contactNormal.dot(upAxis) > 0.5;
                debugTerminal.log(`canJump: ${mainPlayer.canJump}`);
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

        // Create Physics Object
        this.physicsMesh = new PhysicsMesh(capsuleBody, capsuleMesh, addEventListeners.bind(this), forceUpright.bind(this));
        this.physicsMesh.add();
    }

    static addCapsule(radius, height, position) {
        // Cannon.js capsule
        const playerMaterial = new CANNON.Material('player');
        this.contactMaterial = new CANNON.ContactMaterial(playerMaterial, world.groundMaterial, {
            friction: 0,
            restitution: 0
        });
        const capsuleBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: playerMaterial,
        });

        const cylinderShape = new CANNON.Cylinder(radius, radius, height, 8);

        capsuleBody.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, height / 2, 0));
        capsuleBody.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, -height / 2, 0));
        capsuleBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2));

        // Three.js capsule
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/SkySkybox.png');
        const capsuleMaterial = new THREE.MeshPhongMaterial({ map: texture });

        const capsuleGeometry = new THREE.CylinderGeometry(radius, radius, height, 8);
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        // Create top sphere mesh
        const topSphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const topSphereMesh = new THREE.Mesh(topSphereGeometry, capsuleMaterial);
        topSphereMesh.position.y = height / 2;

        // Create bottom sphere mesh
        const bottomSphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const bottomSphereMesh = new THREE.Mesh(bottomSphereGeometry, capsuleMaterial);
        bottomSphereMesh.position.y = -height / 2;

        // Combine meshes
        const capsuleGroup = new THREE.Group();
        capsuleGroup.add(capsuleMesh);
        capsuleGroup.add(topSphereMesh);
        capsuleGroup.add(bottomSphereMesh);

        // Create PhysicsObject
        const physicsObject = new PhysicsMesh(capsuleBody, capsuleGroup);
        physicsObject.add();
        return physicsObject;
    }
}