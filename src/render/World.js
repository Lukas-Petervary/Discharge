import { PhysicsMesh } from './PhysicsMesh.js';

export class World {
    constructor(renderer) {
        this.renderer = renderer;
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.objects = [];
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        // Materials
        this.defaultMaterial = new CANNON.Material();
        this.groundMaterial = new CANNON.Material();
        this.contactMaterial = new CANNON.ContactMaterial(this.defaultMaterial, this.groundMaterial, {
            friction: 0.4,
            restitution: 0.6,
        });
        this.world.addContactMaterial(this.contactMaterial);

        //this.initGround();
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

    fixToAngle(object, axis = 'y') {
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromAxisAngle(new CANNON.Vec3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0), 0);
        object.body.quaternion.copy(quaternion);
    }

    // Function to load a GLTF model and integrate with Cannon.js for physics
    loadGLTFModel(path) {
        const loader = new THREE.GLTFLoader();
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0); // Ensure model is positioned correctly
            this.renderer.scene.add(model);

            model.traverse((child) => {
                if (child.isMesh) {
                    try {
                        const cannonShape = this.createCannonShape(child);
                        if (cannonShape) {
                            // Calculate world position of the mesh
                            const worldPosition = new THREE.Vector3();
                            child.getWorldPosition(worldPosition);

                            // Create Cannon.js body
                            const body = new CANNON.Body({
                                mass: 0,
                                position: new CANNON.Vec3(worldPosition.x, worldPosition.y, worldPosition.z),
                            });

                            // Set the quaternion rotation for the Cannon.js body
                            const quaternion = new CANNON.Quaternion();
                            body.quaternion.copy(quaternion);

                            body.addShape(cannonShape);
                            this.world.addBody(body);

                            // Create wireframe and add to the scene
                            const wireframe = this.createWireframe(child.geometry); // Pass Three.js geometry
                            wireframe.position.copy(worldPosition); // Position wireframe at the same position as the mesh
                            wireframe.quaternion.copy(child.quaternion); // Apply mesh's quaternion rotation
                            this.renderer.scene.add(wireframe);

                            // Store reference to the mesh and Cannon.js body for later use
                            this.renderer.objects.push({
                                mesh: child,
                                body: body,
                                wireframe: wireframe, // Store wireframe for later manipulation or removal
                            });
                        } else {
                            console.warn('Unable to create Cannon.js shape for mesh:', child);
                        }
                    } catch (error) {
                        console.error('Error creating Cannon.js shape:', error);
                    }
                }
            });
        }, undefined, (error) => {
            console.error('Error loading model:', error);
        });
    }




// Function to create a Cannon.js shape from a Three.js mesh
    createCannonShape(threeMesh) {
        if (!threeMesh.geometry || !threeMesh.geometry.isBufferGeometry) {
            console.error('Invalid or undefined BufferGeometry:', threeMesh.geometry);
            return null;
        }

        const geom = threeMesh.geometry;

        // Ensure geometry has indices
        if (!geom.index) {
            console.warn('Geometry does not have indices. Computing faces assuming triangle strips or other primitive types.');
            const position = geom.attributes.position;
            const indices = [];

            // Create indices assuming triangle strips or other primitive types
            for (let i = 0; i < position.count; i++) {
                indices.push(i);
            }

            geom.setIndex(indices);
        }

        // Compute bounding box if not available
        if (!geom.boundingBox) {
            geom.computeBoundingBox();
        }

        const boundingBox = geom.boundingBox;
        if (!boundingBox) {
            console.warn('Bounding box not properly defined for geometry:', geom);
            return null;
        }

        const min = boundingBox.min;
        const max = boundingBox.max;

        // Ensure bounding box values are defined
        if (!min || !max) {
            console.warn('Bounding box min or max not properly defined for geometry:', geom);
            return null;
        }

        const halfExtents = max.clone().sub(min).multiplyScalar(0.5);
        const center = min.clone().add(halfExtents);

        try {
            const vertices = geom.attributes.position.array;
            const indices = geom.index.array;

            // Create Cannon.js Trimesh
            const cannonShape = new CANNON.Trimesh(vertices, indices);

            return cannonShape;

        } catch (error) {
            console.error('Error creating Cannon.js shape:', error);
            return null;
        }
    }

// Function to create wireframe representation for Cannon.js shape
    createWireframe(cannonShape, color = 0x00ff00) {
        const wireframe = new THREE.WireframeGeometry(this.convertCannonShapeToBufferGeometry(cannonShape));
        const line = new THREE.LineSegments(wireframe);
        line.material.color.set(color);
        return line;
    }

    convertCannonShapeToBufferGeometry(cannonShape) {
        const vertices = [];
        const indices = [];

        if (cannonShape instanceof CANNON.Box) {
            const halfExtents = cannonShape.halfExtents;
            const verticesArray = [
                [-halfExtents.x, -halfExtents.y, -halfExtents.z],
                [halfExtents.x, -halfExtents.y, -halfExtents.z],
                [halfExtents.x, halfExtents.y, -halfExtents.z],
                [-halfExtents.x, halfExtents.y, -halfExtents.z],
                [-halfExtents.x, -halfExtents.y, halfExtents.z],
                [halfExtents.x, -halfExtents.y, halfExtents.z],
                [halfExtents.x, halfExtents.y, halfExtents.z],
                [-halfExtents.x, halfExtents.y, halfExtents.z],
            ];

            const indicesArray = [
                [0, 1, 2, 3],
                [4, 5, 6, 7],
                [0, 4, 5, 1],
                [1, 5, 6, 2],
                [2, 6, 7, 3],
                [3, 7, 4, 0],
            ];

            verticesArray.forEach((vertex) => {
                vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
            });

            indicesArray.forEach((index) => {
                indices.push(index[0], index[1], index[2]);
                indices.push(index[2], index[3], index[0]);
            });
        } else if (cannonShape instanceof CANNON.ConvexPolyhedron) {
            const faceNormals = cannonShape.faceNormals;
            const faces = cannonShape.faces;
            const verticesArray = cannonShape.vertices;

            verticesArray.forEach((vertex) => {
                vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
            });

            faces.forEach((face) => {
                const edge = [face[0], face[1], face[2], face[3]];

                indices.push(edge[0], edge[1]);
                indices.push(edge[1], edge[2]);
                indices.push(edge[2], edge[3]);
                indices.push(edge[3], edge[0]);
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(vertices);
        geometry.setIndex(indices);

        return geometry;
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

