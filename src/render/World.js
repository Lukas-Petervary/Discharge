import * as CANNON from 'cannon';
import * as THREE from 'three';
import { PhysicsMesh } from './PhysicsMesh.js';
import * as NULL_SHADER from '../../assets/textures/shaders/nullTexture.js'

export class World {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.objects = [];
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        // Materials
        this.initMaterials();
    }

    initMaterials() {
        this.defaultMaterial = new CANNON.Material('default');
        this.playerMaterial = new CANNON.Material('player');
        this.groundMaterial = new CANNON.Material('groundMaterial');

        this.world.addContactMaterial(
            new CANNON.ContactMaterial(this.playerMaterial, this.groundMaterial, {
                friction: 0,
                restitution: 0.1
            })
        );
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(this.defaultMaterial, this.groundMaterial, {
                friction: 0,
                restitution: 0,
            })
        );
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
        const sphereMesh = new THREE.Mesh(sphereGeometry, NULL_SHADER.shaderMaterial);
        sphereMesh.castShadow = sphereMesh.receiveShadow = true;

        // Create PhysicsObject
        const physicsObject = new PhysicsMesh(sphereBody, sphereMesh);
        physicsObject.add();
        return physicsObject;
    }

    addPlane(pos = new CANNON.Vec3(0,0,0)) {
        const planeGeometry = new THREE.PlaneGeometry(100, 100);  // 100x100 units
        const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.castShadow = planeMesh.receiveShadow = true;

        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
        });
        const groundShape = new CANNON.Plane();
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

        const physMesh = new PhysicsMesh(groundBody, planeMesh);
        physMesh.add();
        physMesh.body.position = pos;
    }


    // Function to load a GLTF model and integrate with Cannon.js for physics
    async loadGLTFModel(path) {
        const loader = new THREE.GLTFLoader();
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0); // Ensure model is positioned correctly
            g_renderer.scene.add(model);

            model.traverse((child) => {
                if (child.isMesh) {
                    try {
                        const cannonShape = this.createCannonShape(child);
                        if (cannonShape) {
                            // Calculate g_world position of the mesh
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


                            // Store reference to the mesh and Cannon.js body for later use
                            g_renderer.objects.push({
                                mesh: child,
                                body: body,
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

    step() {
        // Step the physics g_world
        this.world.step(1 / 60);

        // Update Three.js objects based on physics
        this.objects.forEach(obj => {
            obj.update();
        });
    }
}

