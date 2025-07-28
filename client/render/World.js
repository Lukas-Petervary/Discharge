import * as CANNON from 'cannon';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Sky} from 'three/examples/jsm/objects/Sky.js'
import {Water} from 'three/examples/jsm/objects/Water.js'
import {PhysicsMesh} from './mesh/PhysicsMesh.js';
import {LightMesh} from "./mesh/LightMesh.js";
import Logger from "../../shared/Logger.js";
import {ParticleSchema, ParticleSystem} from "./particles/ParticleManager.js";

export class World {
    constructor() {
        this.TICK_RATE = 1.0 / 60.0;

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

    async loadShader(url) {
        const res = await fetch(url);
        if (!res.ok) return Logger.critical(`Failed to load shader: ${url}`);
        return await res.text();
    }

    async createGrassParticleSystem() {
        const blade_width = 0.1, blade_height = 0.8;
        const positions = new Float32Array([
            -blade_width / 2, 0, 0,
            blade_width / 2, 0, 0,
            0, blade_height, 0
        ]);
        const uvs = new Float32Array([
            0, 0,
            1, 0,
            0.5, 1
        ]);

        const geometry = new THREE.BufferGeometry();
        const _t = new THREE.TextureLoader();
        const _gN = _t.load("/assets/textures/images/grass_noise_map.png");
        const _wN = _t.load("/assets/textures/images/wind_noise_map.jpg");
        const _c = _t.load("assets/textures/images/cloud_overlay.jpg");
        _gN.wrapS = _gN.wrapT = _wN.wrapS = _wN.wrapT = _c.wrapS = _c.wrapT = THREE.RepeatWrapping;

        const material = new THREE.ShaderMaterial({
            vertexShader: await this.loadShader("/assets/shaders/grass.vert"),
            fragmentShader: await this.loadShader("/assets/shaders/grass.frag"),
            side: THREE.DoubleSide,
            shadowSide: THREE.DoubleSide,
        });

        const schema = new ParticleSchema({}, {
            position: {value: positions, size: 3},
            uv: {value: uvs, size: 2},
        }, {
            time: { value: 0 },
            grassNoise: { value: _gN },
            windNoise: { value: _wN },
            cloudShadow: { value: _c }
        });

        const _dummy = new THREE.Object3D();
        return new ParticleSystem({
            name: "grass",
            geometry,
            material,
            maxCount: 2 << 17, // 131072
            schema,
            meshOptions: {
                castShadow: true,
                receiveShadow: true,
                frustumCulled: false,
            },
            onSpawn(i, opts, system) {
                const r = (Math.random() - 0.5) * 2 * 25;
                const theta = Math.random() * Math.PI * 2;
                const position = (opts.position ?? new THREE.Vector3()).add(
                    new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta))
                );

                const scale = opts.scale ?? 0.5*Math.random() + 0.1;
                const rotationY = opts.rotation?.y ?? Math.random() * 2 * Math.PI;

                _dummy.position.copy(position);
                _dummy.scale.setScalar(scale);
                _dummy.rotation.set(0, rotationY, 0);
                _dummy.updateMatrix();

                system.mesh.setMatrixAt(i, _dummy.matrix);
            },
            onUpdate(system) {
                system.mesh.material.uniforms.time.value += g_renderer.time.deltaTime;
            },
        });
    }

    addBasicScene() {
        // lighting
        g_renderer.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const addCallback = (light) => {
            light.castShadow = true;
            light.position.set(5, 5, 5);
        }
        this.directionalLight = new LightMesh(new THREE.DirectionalLight(0xffffff, 3), {addCallback}).add();
        const _floor_width = 25, _floor_height = 2, _floor_segments = 64;

        // floor
        const floor_body = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Cylinder(_floor_width, _floor_width, _floor_height, _floor_segments),
            material: this.groundMaterial,
        });
        floor_body.quaternion.setFromEuler(0, Math.PI / 2, 0);
        floor_body.position.set(0, -1, 0);

        const floor_mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(_floor_width, _floor_width, _floor_height, _floor_segments),
            new THREE.MeshStandardMaterial({ color: 0x336406, flatShading: false })
        );
        floor_mesh.receiveShadow = true;
        floor_mesh.position.set(0, -1, 0);

        this.floor = new PhysicsMesh(floor_body, floor_mesh).add();

        // particles
        this.createGrassParticleSystem().then(system => {
            g_ParticleManager.register(system);
            g_ParticleManager.emit("grass",2<<17);
        });

        // sky box
        const sky = new Sky();
        sky.scale.setScalar(450_000);

        Object.assign(sky.material.uniforms, {
            turbidity: { value: 10 },
            rayleigh: { value: 0.75 },
            mieCoefficient: { value: 0.05 },
            mieDirectionalG: { value: 0.7 },
            azimuth: { value: 180 },
            sunPosition: { value: new THREE.Vector3().setFromSphericalCoords(1, Math.PI/2, 0) },
        });

        this.sky_box = new PhysicsMesh(undefined, sky).add();

        // water
        const _water_geom = new THREE.PlaneGeometry(10_000, 10_000);

        const water = new Water(
            _water_geom,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('/assets/textures/images/water_normals.jpg', _ => _.wrapS = _.wrapT = THREE.RepeatWrapping),
                sunDirection: new THREE.Vector3().setFromSphericalCoords(1, Math.PI/2 - 0.01, 0),
                sunColor: 0xFFE484,
                distortionScale: 3.7
            }
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.1;

        this.water_plane = new PhysicsMesh(undefined, water,
            undefined,
            undefined,
            (dt, body, mesh) => mesh.material.uniforms.time.value += g_renderer.time.deltaTime / 2.0
        ).add();
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
        const loader = new GLTFLoader();
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
                            // g_world.objects.push({
                            //     mesh: child,
                            //     body: body,
                            // });
                        } else {
                            Logger.warn('Unable to create Cannon.js shape for mesh:', child);
                        }
                    } catch (error) {
                        Logger.error('Error creating Cannon.js shape:', error);
                    }
                }
            });
        }, undefined, (error) => {
            Logger.error('Error loading model:', error);
        });
    }

    // Function to create a Cannon.js shape from a Three.js mesh
    createCannonShape(threeMesh) {
        if (!threeMesh.geometry || !threeMesh.geometry.isBufferGeometry) {
            Logger.error('Invalid or undefined BufferGeometry:', threeMesh.geometry);
            return null;
        }

        const geom = threeMesh.geometry;

        // Ensure geometry has indices
        if (!geom.index) {
            Logger.warn('Geometry does not have indices. Computing faces assuming triangle strips or other primitive types.');
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
            Logger.warn('Bounding box not properly defined for geometry:', geom);
            return null;
        }

        const min = boundingBox.min;
        const max = boundingBox.max;

        // Ensure bounding box values are defined
        if (!min || !max) {
            Logger.warn('Bounding box min or max not properly defined for geometry:', geom);
            return null;
        }

        const halfExtents = max.clone().sub(min).multiplyScalar(0.5);

        try {
            const vertices = geom.attributes.position.array;
            const indices = geom.index.array;

            // Create Cannon.js Trimesh
            return new CANNON.Trimesh(vertices, indices);

        } catch (error) {
            Logger.error('Error creating Cannon.js shape:', error);
            return null;
        }
    }

    toggleWireframes() {
        PhysicsMesh.SHOW_WIREFRAMES = !PhysicsMesh.SHOW_WIREFRAMES;
        this.objects.forEach(object => {
            if (!object.body) return;
            object.debugMesh.visible = PhysicsMesh.SHOW_WIREFRAMES;
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
