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
        this.world.addBody(sphereBody);

        // Three.js sphere
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.renderer.scene.add(sphereMesh);

        // Store objects for synchronization
        this.objects.push({ body: sphereBody, mesh: sphereMesh });
    }

    addCapsule(radiusTop, radiusBottom, height, radialSegments, heightSegments, position) {
        // Cannon.js capsule (combination of sphere and cylinder)
        const halfHeight = height / 2;
        const sphereShape = new CANNON.Sphere(radiusTop);
        const sphereBodyTop = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y + halfHeight, position.z),
            shape: sphereShape,
            material: this.defaultMaterial, // Adjust this according to your needs
        });

        const cylinderShape = new CANNON.Cylinder(radiusTop, radiusBottom, height, radialSegments);
        const cylinderBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: cylinderShape,
            material: this.defaultMaterial, // Adjust this according to your needs
        });

        const sphereShapeBottom = new CANNON.Sphere(radiusBottom);
        const sphereBodyBottom = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y - halfHeight, position.z),
            shape: sphereShapeBottom,
            material: this.defaultMaterial, // Adjust this according to your needs
        });

        this.world.addBody(sphereBodyTop);
        this.world.addBody(cylinderBody);
        this.world.addBody(sphereBodyBottom);

        // Three.js capsule
        let capsule = new Capsule(radiusTop, radiusBottom, height, radialSegments, heightSegments, position);
        capsule.setTexture('../../assets/textures/capsule_texture.jpg');
        capsule.addToScene(renderer.scene);

        // Store objects for synchronization
        this.objects.push(
            { body: sphereBodyTop, mesh: capsule.mesh },
            { body: cylinderBody, mesh: capsule.mesh },
            { body: sphereBodyBottom, mesh: capsule.mesh }
        );

        return [{ body: sphereBodyTop, mesh: capsule.mesh }, { body: cylinderBody, mesh: capsule.mesh }, { body: sphereBodyBottom, mesh: capsule.mesh }];
    }


    step() {
        // Step the physics world
        this.world.step(1 / 60);

        // Update Three.js objects based on physics
        this.objects.forEach(obj => {
            obj.mesh.position.copy(obj.body.position);
            obj.mesh.quaternion.copy(obj.body.quaternion);
        });
    }
}