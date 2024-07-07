import { PhysicsMesh } from './PhysicsMesh.js';

export class World {
    constructor() {
        this.objects = [];

        this.transform = new Ammo.btTransform();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld();
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.810, 0));
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.810, 0));

        Ammo.btGImpactCollisionAlgorithm.prototype.registerAlgorithm(this.physicsWorld.getDispatcher());
        this.transformAux1 = new Ammo.btTransform();
        this.clock = new THREE.Clock();
    }

    createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
        if (pos) {
            object.position.copy(pos);
        } else {
            pos = object.position;
        }
        if (quat) {
            object.quaternion.copy(quat);
        } else {
            quat = object.quaternion;
        }

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        physicsShape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        body.setFriction(0.5);

        if (vel) {
            body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
        }

        if (angVel) {
            body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
        }
        object.userData.physicsBody = body;
        object.userData.collided = false;
        if (mass > 0) {
            this.objects.push(object);
            body.setActivationState(4);
        }
        this.physicsWorld.addRigidBody(body);
        return body;

    }

    // Function to load a GLTF model and integrate with Cannon.js for physics
    loadGLTFModel(path) {
        const loader = new THREE.GLTFLoader();
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0); // Ensure model is positioned correctly

            g_Renderer.scene.add(model);

            model.traverse((child) => {
                if (child.isMesh) {

                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.side = THREE.FrontSide;

                    try {
                        const ammoShape = this.createAmmoShape(child, child.scale);
                        if (ammoShape) {

                            let pos = child.position;
                            let quat = child.quaternion;

                           let body = this.createRigidBody(child, ammoShape, 0, pos, quat);
                           body.setCollisionFlags(body.getCollisionFlags() | 1/* btCollisionObject:: CF_STATIC_OBJECT */);

                            // Store reference to the mesh and Ammo.js body for later use
                            this.objects.push({
                                mesh: child,
                                body: body,
                            });
                        } else {
                            console.warn('Unable to create Ammo.js shape for mesh:', child);
                        }
                    } catch (error) {
                        console.error('Error creating Ammo.js shape:', error);
                    }
                }
            });
        }, undefined, (error) => {
            console.error('Error loading model:', error);
        });
    }

    // Function to create an Ammo.js shape from a Three.js mesh
    createAmmoShape(mesh, scale = { x: 1, y: 1, z: 1 }) {
        // Ensure the mesh is a Mesh object
        if (!mesh.isMesh) {
            console.error("Cannot create mesh shape for non-Mesh object.");
            return null;
        }

        // Extract mesh data
        const index = mesh.geometry.index !== null ? mesh.geometry.index : undefined;
        const attributes = mesh.geometry.attributes;
        const meshScale = mesh.scale;

        if (attributes.position === undefined) {
            console.error('Position attribute required for conversion.');
            return null;
        }

        const position = attributes.position;
        const vertices = [];
        const faces = [];

        for (let i = 0; i < position.count; i++) {
            vertices.push({
                x: meshScale.x * position.getX(i),
                y: meshScale.y * position.getY(i),
                z: meshScale.z * position.getZ(i)
            });
        }

        if (index !== undefined) {
            for (let i = 0; i < index.count; i += 3) {
                faces.push({
                    a: index.getX(i),
                    b: index.getX(i + 1),
                    c: index.getX(i + 2)
                });
            }
        } else {
            for (let i = 0; i < position.count; i += 3) {
                faces.push({
                    a: i,
                    b: i + 1,
                    c: i + 2
                });
            }
        }

        // Check if there are vertices to define the mesh shape
        if (vertices.length === 0) {
            console.error("No vertices to define mesh shape with.");
            return null;
        }

        // Create Ammo.js triangle mesh
        const ammoMesh = new Ammo.btTriangleMesh();
        faces.forEach(face => {
            ammoMesh.addTriangle(
                new Ammo.btVector3(vertices[face.a].x, vertices[face.a].y, vertices[face.a].z),
                new Ammo.btVector3(vertices[face.b].x, vertices[face.b].y, vertices[face.b].z),
                new Ammo.btVector3(vertices[face.c].x, vertices[face.c].y, vertices[face.c].z),
                false
            );
        });

        // Create GImpact mesh shape
        const gImpactShape = new Ammo.btGImpactMeshShape(ammoMesh);
        gImpactShape.setMargin(0.01);
        gImpactShape.setLocalScaling(new Ammo.btVector3(scale.x, scale.y, scale.z));
        gImpactShape.updateBound();

        return gImpactShape;
    }



    step() {
        // Step the physics physicsWorld
        this.physicsWorld.stepSimulation(this.clock.getDelta(), 10);

        // Update rigid bodies
        for (let i = 0; i < this.objects.length; ++i) {

            const objThree = this.objects[i];
            const objPhys = objThree.userData.physicsBody;
            const ms = objPhys.getMotionState();

            if (ms) {
                ms.getWorldTransform(this.transformAux1);
                const p = this.transformAux1.getOrigin();
                const q = this.transformAux1.getRotation();
                objThree.position.set(p.x(), p.y(), p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
                objThree.userData.collided = false;
            }

        }

        // Update Three.js objects based on physics
        this.objects.forEach(obj => {
            obj.update();
        });
    }
}

