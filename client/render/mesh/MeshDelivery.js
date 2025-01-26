import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";
import {AnimationMixer} from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js"

export class MeshDelivery {
    constructor() {
        this.loader = new FBXLoader();
        this.meshes = {};
        this.animations = {};
    }

    async init() {
        await Promise.all([
            this.m_load('dance', 'assets/models/animations/Silly Dancing.fbx'),
            this.a_load('sit_laugh', 'assets/models/animations/Sitting Laughing.fbx'),

            this.a_load('idle', 'assets/models/animations/idle.fbx'),
            this.a_load('jump', 'assets/models/animations/jump.fbx'),
            this.a_load('forward', 'assets/models/animations/Walking.fbx'),
            this.a_load('forward run', 'assets/models/animations/Running.fbx'),
            this.a_load('backward', 'assets/models/animations/Walking Backwards.fbx'),
            this.a_load('backward run', 'assets/models/animations/Jog Backward.fbx'),
            this.a_load('left', 'assets/models/animations/Left Strafe Walking.fbx'),
            this.a_load('left run', 'assets/models/animations/Jog Strafe Left.fbx'),
            this.a_load('right', 'assets/models/animations/Right Strafe Walk.fbx'),
            this.a_load('right run', 'assets/models/animations/Jog Strafe Right.fbx'),

        ]);
    }

    async m_load(name, url) {
        if (this.meshes[name]) {
            console.error(`Mesh with name "${name}" already exists`);
            return;
        }

        this.meshes[name] = await this._loadFBX(url);
    }

    async a_load(name, url) {
        if (this.animations[name]) {
            console.error(`Animation with name "${name}" already exists`);
            return;
        }

        this.animations[name] = await this._loadFBX(url);
    }

    _loadFBX(url) {
        return new Promise((resolve, reject) => {
            this.loader.load( url, (obj) => {
                resolve(obj);
            }, xhr => {
                console.log(`Loading ${url}: ${Math.floor(100 * xhr.loaded / xhr.total)}%`);
            }, e => reject(e) );
        });
    }

    getMesh(name) {
        const m = this.meshes[name];
        if (!m) {
            return console.error(`Mesh with name "${name}" not found`);
        }
        const _m = SkeletonUtils.clone(m);
        _m.mixer = new AnimationMixer(_m);
        _m.actions = {};
        _m.currentActions = [];
        _m.animations.forEach(clip => _m.actions[clip.name] = _m.mixer.clipAction(clip))
        return _m;
    }

    staticMesh(name) {
        const m = this.meshes[name];
        if (!m) return console.error(`Mesh with name "${name}" not found`);
        return m;
    }

    getAnimation(name) {
        const a = this.animations[name];
        if (!a) {
            return console.error(`Animation with name "${name}" not found`);
        }
        const _a = SkeletonUtils.clone(a);
        _a.mixer = new AnimationMixer(_a);
        _a.actions = {};
        _a.currentActions = [];
        _a.animations.forEach(clip => _a.actions[clip.name] = _a.mixer.clipAction(clip))
        return _a;
    }

    staticAnimation(name) {
        const a = this.animations[name];
        if (!a) return console.error(`Animation with name "${name}" not found`);
        return a;
    }
}