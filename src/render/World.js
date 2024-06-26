import { PhysicsMesh } from './PhysicsMesh.js';

export class World {
    constructor(renderer) {
        this.renderer = renderer;
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.objects = [];

        // Materials
        this.defaultMaterial = new CANNON.Material();
        this.groundMaterial = new CANNON.Material();
        this.contactMaterial = new CANNON.ContactMaterial(this.defaultMaterial, this.groundMaterial, {
            friction: 0.4,
            restitution: 0.6,
        });
        this.world.addContactMaterial(this.contactMaterial);

        this.initGround();
    }

    initGround() {
        // Cannon.js ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);

        // Three.js ground
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        this.renderer.scene.add(groundMesh);
    }

    addSphere(radius, position) {
        // Cannon.js sphere
        const sphereShape = new CANNON.Sphere(radius);
        const sphereBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: sphereShape,
            material: this.defaultMaterial,
        });

        // Three.js sphere
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        // Create PhysicsObject
        const physicsObject = new PhysicsMesh(sphereBody, sphereMesh);
        this.objects.push(physicsObject);
        physicsObject.add();
        return physicsObject;
    }

    addCapsule(radius, height, position) {
        // Cannon.js capsule
        const capsuleBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.defaultMaterial,
        });

        const sphereShape = new CANNON.Sphere(radius);
        const cylinderShape = new CANNON.Cylinder(radius, radius, height, 8);

        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, height / 2, 0));
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -height / 2, 0));
        capsuleBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2));

        // Three.js capsule
        const capsuleGeometry = new THREE.CylinderGeometry(radius, radius, height, 8);
        const capsuleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
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
        this.objects.push(physicsObject);
        return physicsObject;
    }


    step() {
        // Step the physics world
        this.world.step(1 / 60);

        // Update Three.js objects based on physics
        this.objects.forEach(obj => {
            obj.update();
        });
    }
}