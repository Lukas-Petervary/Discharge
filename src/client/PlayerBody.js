import { PhysicsMesh } from "../render/PhysicsMesh.js";

const height = 2;
const crouchHeight = 1;

export class PlayerBody {
    constructor() {
        const radius = height / 4;
        const halfHeight = (height - 2 * radius) / 2;

        // Create Ammo.js capsule object
        const shape = this.createCapsuleShape(radius, halfHeight);
        const mass = 1;
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 0, 0));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const capsuleBody = new Ammo.btRigidBody(rbInfo);

        // Add capsule body to the physics g_World
        g_World.physicsWorld.addRigidBody(capsuleBody);

        // Three.js capsule mesh
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/SkySkybox.png');
        const capsuleMaterial = new THREE.MeshPhongMaterial({ map: texture });

        const capsuleGeometry = new THREE.CylinderGeometry(radius, radius, halfHeight * 2, 8);
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        const topSphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const topSphereMesh = new THREE.Mesh(topSphereGeometry, capsuleMaterial);
        topSphereMesh.position.y = halfHeight;

        const bottomSphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const bottomSphereMesh = new THREE.Mesh(bottomSphereGeometry, capsuleMaterial);
        bottomSphereMesh.position.y = -halfHeight;

        const capsuleGroup = new THREE.Group();
        capsuleGroup.add(capsuleMesh);
        capsuleGroup.add(topSphereMesh);
        capsuleGroup.add(bottomSphereMesh);

        // Enable shadows for all meshes
        capsuleMesh.castShadow = true;
        topSphereMesh.castShadow = true;
        bottomSphereMesh.castShadow = true;

        const forceUpright = (body) => {
            const q = body.getWorldTransform().getRotation();
            const yaw = Math.atan2(2 * (q.w() * q.y() + q.z() * q.x()), 1 - 2 * (q.y() * q.y() + q.x() * q.x()));

            const newQuaternion = new Ammo.btQuaternion();
            newQuaternion.setEulerZYX(0, yaw, 0);

            body.setWorldTransform(new Ammo.btTransform(newQuaternion, body.getWorldTransform().getOrigin()));
            body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        };

        // Create Physics Object
        this.physicsMesh = new PhysicsMesh(capsuleBody, capsuleGroup, null, forceUpright);
        this.physicsMesh.add();
    }

    createCapsuleShape(radius, halfHeight) {
        const cylinderShape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, halfHeight, radius));

        const compoundShape = new Ammo.btCompoundShape();

        const topSphereShape = new Ammo.btSphereShape(radius);
        const bottomSphereShape = new Ammo.btSphereShape(radius);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, halfHeight + radius, 0));
        compoundShape.addChildShape(transform, topSphereShape);

        transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, -(halfHeight + radius), 0));
        compoundShape.addChildShape(transform, bottomSphereShape);

        transform = new Ammo.btTransform();
        transform.setIdentity();
        compoundShape.addChildShape(transform, cylinderShape);

        return compoundShape;
    }
}
