import * as CANNON from 'cannon';
import * as THREE from 'three';
import {PhysicsMesh} from './mesh/PhysicsMesh.js';
import {AnimatedMesh} from "./mesh/AnimatedMesh.js";
import {LightMesh} from "./mesh/LightMesh.js";

export class World {
    constructor() {
        this.TICK_RATE = 1/60;

        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.objects = [];

        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        this.initMaterials();
    }

    initMaterials() {
        this.defaultMaterial = new CANNON.Material('default');
        this.playerMaterial = new CANNON.Material('player');
        this.groundMaterial = new CANNON.Material('groundMaterial');

        this.world.addContactMaterial(
            new CANNON.ContactMaterial(this.playerMaterial, this.groundMaterial, {
                friction: 0,
                restitution: 0
            })
        );
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(this.defaultMaterial, this.groundMaterial, {
                friction: 1,
                restitution: 0.5,
            })
        );

        this.collisionGroups = {};
        this.collisionGroups['client'] = 1<<1;
        this.collisionGroups['player'] = 1<<2;
    }

    addSphere(radius, position = {x:0,y:0,z:0}) {
        // Cannon.js sphere
        const sphereShape = new CANNON.Sphere(radius);
        const sphereBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: sphereShape,
            material: this.defaultMaterial,
        });

        // Three.js sphere
        const sphereMesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        sphereMesh.castShadow = sphereMesh.receiveShadow = true;

        // Create PhysicsObject
        const physicsObject = new PhysicsMesh(sphereBody, sphereMesh);
        physicsObject.add();
        return physicsObject;
    }

    addModel(name, position = {x: 0, y: 1, z: 0}) {
        const sphereShape = new CANNON.Sphere(1);
        const sphereBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: sphereShape,
            material: this.defaultMaterial,
        });

        const init = (body, mesh) => {
            mesh.position.set(position.x, position.y, position.z);
            mesh.scale.copy(new THREE.Vector3(0.01, 0.01, 0.01));
        }

        const physMesh = new AnimatedMesh(sphereBody, 'dance', {addCallback: init});
        physMesh.add();
        return physMesh;
    }

    addPlane(pos = new CANNON.Vec3(0,0,0)) {
        const planeMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: 0x999999, side: THREE.DoubleSide })
        );
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.receiveShadow = true;

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
                            g_world.objects.push({
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
            return new CANNON.Trimesh(vertices, indices);

        } catch (error) {
            console.error('Error creating Cannon.js shape:', error);
            return null;
        }
    }

    toggleWireframes() {
        PhysicsMesh.SHOW_WIREFRAMES = !PhysicsMesh.SHOW_WIREFRAMES;
        this.objects.forEach(object => {
            if (!object.body) return;
            object.body.debugMesh.visible = PhysicsMesh.SHOW_WIREFRAMES;
        })
    }

    toggleLightDebug() {
        LightMesh.DEBUG_LIGHTS = !LightMesh.DEBUG_LIGHTS;
        this.objects.forEach(object => {
            if (object instanceof LightMesh)
                object.mesh.debugVisual.visible = LightMesh.DEBUG_LIGHTS;
        })
    }

    step(dt) {
        this.objects.forEach((obj) => {
            if (!obj.body) return;
            obj.body.previousPosition = obj.body.position.clone();
            obj.body.previousQuaternion = obj.body.quaternion.clone();
        });
        this.world.step(dt);
        this.objects.forEach(obj => obj.update());
    }
}

