import * as THREE from 'three';
import Logger from '../../../shared/Logger.js';

//////////////////////
// ParticleSchema
//////////////////////

export class ParticleSchema {
    /**
     * @param {Object} instanceAttributes - Map attributeName => {arrayType: (primitive array class), size: (int # of bytes)}
     * @param {Object} bufferAttributes - Map attributeName => {value: {}, size: (int)}
     * @param {Object} uniforms - Map uniformName => {value: ...} (Three.js uniforms)
     */
    constructor(instanceAttributes = {}, bufferAttributes = {}, uniforms = {}) {
        this.instanceAttributes = {
            age: {arrayType: Uint16Array, size: 1}, // increase byte size of age value if necessary
            alive: {arrayType: Uint8Array, size: 1},
            ...instanceAttributes
        };
        this.bufferAttributes = bufferAttributes;
        this.uniforms = uniforms;
    }

    createInstanceBuffers(count) {
        const attributes = {};
        for (const [name, attrib] of Object.entries(this.instanceAttributes)) {
            const ArrayType = attrib.arrayType ?? Float32Array;
            attributes[name] = new THREE.InstancedBufferAttribute( new ArrayType(count * attrib.size), attrib.size );
        }
        return attributes;
    }

    createBufferAttributes() {
        const attributes = {};
        for (const [name, attrib] of Object.entries(this.bufferAttributes))
            attributes[name] = new THREE.BufferAttribute(attrib.value, attrib.size);
        return attributes;
    }
}

//////////////////////
// ParticleSystem
//////////////////////

export class ParticleSystem {
    constructor({
                    name = "particles",
                    geometry,
                    material,
                    maxCount = 1000,
                    schema = new ParticleSchema(),
                    onSpawn = () => {},
                    onUpdate = () => {},
                    onInstanceUpdate = () => {},
                    onDestroy = () => {},
                    meshOptions = {}
                }) {
        this.name = name;
        this.geometry = geometry;
        this.material = material;
        this.maxCount = maxCount;
        this.schema = schema;

        this.mesh = new THREE.InstancedMesh(geometry, material, maxCount);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        if (meshOptions) Object.assign(this.mesh, meshOptions);

        this.onSpawn = onSpawn;
        this.onUpdate = onUpdate;
        this.onInstanceUpdate = onInstanceUpdate;
        this.onDestroy = onDestroy;

        this.aliveCount = 0;

        this.mesh.material.uniforms = schema.uniforms;
        this.attributes = {
            ...this.schema.createInstanceBuffers(maxCount),
            ...this.schema.createBufferAttributes(),
        };
        if (material.uniforms && this.schema.uniforms)
            Object.assign(this.mesh.material.uniforms, this.schema.uniforms);
        Object.assign(this.mesh.geometry.attributes, this.attributes);

        this.iParticle = new Proxy({ index: 0 }, {
            get: (target, prop) => {
                const attr = this.attributes[prop];
                const uniform = this.mesh.material.uniforms[prop];
                if (attr) {
                    const i = target.index;
                    const size = this.schema.instanceAttributes[prop]?.size ?? 1;

                    if (size === 1) return attr.array[i];
                    else            return attr.array.subarray(i * size, i * size + size);
                } else if (uniform) return uniform;
                else                return target[prop];
            },
            set: (target, prop, value) => {
                if (prop === 'index') {
                    target.index = value;
                } if (prop in this.attributes) {
                    const attr = this.attributes[prop];

                    const i = target.index;
                    const size = this.schema.instanceAttributes[prop]?.size ?? 1;

                    if (Array.isArray(value)) {
                        for (let j = 0; j < size; j++)
                            attr.array[i * size + j] = value[j];
                    } else {
                        attr.array[i * size] = value;
                    }
                    attr.needsUpdate = true;
                    return true;
                } else if (prop in this.schema.uniforms) {
                    this.schema.uniforms[prop].value = value;
                    return true;
                } else {
                    target[prop] = value;
                    return true;
                }
            }
        });
    }

    emit(count = 1, options = {}) {
        let emitted = 0;
        for (let i = 0; i < this.maxCount && emitted < count; i++) {
            if (!this.attributes.alive.array[i]) {
                this.iParticle.index = i;
                this.attributes.alive.array[i] = true;
                this.attributes.age.array[i] = 0;

                this.onSpawn(i, options, this);

                emitted++;
                this.aliveCount++;
            }
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        return emitted;
    }

    emitAt(position, count = 1, options = {}) {
        options.position = position;
        return this.emit(count, options);
    }

    emitInBox(box3, count = 1, options = {}) {
        for (let i = 0; i < count; i++) {
            const pos = new THREE.Vector3(
                THREE.MathUtils.lerp(box3.min.x, box3.max.x, Math.random()),
                THREE.MathUtils.lerp(box3.min.y, box3.max.y, Math.random()),
                THREE.MathUtils.lerp(box3.min.z, box3.max.z, Math.random())
            );
            this.emitAt(pos, 1, options);
        }
    }

    update(dt) {
        let matrixNeedsUpdate = false;
        this.onUpdate(this);
        for (let i = 0; i < this.maxCount; i++) {
            if (!this.attributes.alive.array[i]) continue;
            this.iParticle.index = i;

            this.attributes.age.array[i] += dt;

            this.onInstanceUpdate(dt, i, this);

            if (!this.attributes.alive.array[i]) {
                this.onDestroy(i, this);
                this.aliveCount--;
            }
        }

        if (matrixNeedsUpdate) this.mesh.instanceMatrix.needsUpdate = true;
    }

    getMesh() {
        return this.mesh;
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh.dispose();
    }
}

//////////////////////
// ParticleManager
//////////////////////

export class ParticleManager {
    constructor() {
        this.systems = new Map();
    }

    register(particleSystem) {
        if (this.systems.has(particleSystem.name))
            return Logger.error(`ParticleSystem with name "${particleSystem.name}" already registered.`);

        this.systems.set(particleSystem.name, particleSystem);
        g_renderer.scene.add(particleSystem.getMesh());

        return particleSystem;
    }

    getMeshList() {
        return Array.from(this.systems.values()).map(sys => sys.getMesh());
    }

    emit(systemName, count = 1, options = {}) {
        const sys = this.systems.get(systemName);
        if (!sys) {
            Logger.error(`ParticleSystem "${systemName}" not found.`);
            return -1;
        }
        return sys.emit(count, options);
    }

    emitAt(systemName, position, count = 1, options = {}) {
        const sys = this.systems.get(systemName);
        if (!sys) {
            Logger.error(`ParticleSystem "${systemName}" not found.`);
            return -1;
        }
        return sys.emitAt(position, count, options);
    }

    emitInBox(systemName, box3, count = 1, options = {}) {
        const sys = this.systems.get(systemName);
        if (!sys) {
            Logger.error(`ParticleSystem "${systemName}" not found.`);
            return -1;
        }
        sys.emitInBox(box3, count, options);
    }

    update(dt) {
        for (const sys of this.systems.values()) {
            sys.update(dt);
        }
    }

    dispose() {
        for (const sys of this.systems.values()) {
            sys.dispose();
        }
        this.systems.clear();
    }
}