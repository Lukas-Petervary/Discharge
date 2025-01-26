import * as CANNON from 'cannon';
import * as THREE from 'three';
import {AnimatedMesh} from "../render/mesh/AnimatedMesh.js";

const anm = ['idle', 'crouch', 'forward run', 'forward', 'backward run', 'backward', 'left run', 'left', 'right run', 'right'];

const height = 2;
const radius = 0.75;
const crouchHeight = 1;

export class PlayerBody extends AnimatedMesh {
    constructor(name) {
        super(PlayerBody.Body_(), null, {});
        this.mesh = new THREE.Group();

        const model = g_FBXDelivery.getMesh('dance');
        model.scale.copy(new THREE.Vector3(-0.01, 0.01, -0.01));
        model.castShadow = model.receiveShadow = true;
        model.traverse(child => {
            if (child.isMesh) child.castShadow = child.receiveShadow = true;
        });

        this.mesh.add(model);
        this.mesh.mixer = model.mixer;
        this.mesh.actions = model.actions;
        this.mesh.currentActions = [];
        this.bakeAnimations();

        model.position.add(new THREE.Vector3(0, height/-2, 0));

        const nametag = name ? PlayerBody.Nametag_(name) : null;

        if (nametag) {
            nametag.position.copy(this.mesh.position);
            nametag.position.y += height;
            this.mesh.add(nametag);
        }

        const contactNormal = new CANNON.Vec3();
        const upAxis = new CANNON.Vec3(0, 1, 0);
        this.body.collisionFilterGroup = g_world.collisionGroups['player'];
        this.body.addEventListener("collide", (e) => {
            let contact = e.contact;

            contact.bi.id === this.body.id ? contact.ni.negate(contactNormal) : contactNormal.copy(contact.ni);

            if (contactNormal.dot(upAxis) > 0.5) {
                g_Client.canJump = true;
            }
        });

        this.add();
    }

    /**
     * SHIT TO DO!!
     * - rotate body towards movement direction
     * - fix first-person perspective
     * - add proximity chat
     * - add custom map
     */

    animate(x, z) {
        const _s = g_Controls.sprint.isPressed();
        const _c = g_Controls.crouch.isPressed();

        if (x === 0 && z === 0) {
            const a = _c ? anm[1] : anm[0];
            this.blendAnimation(a);
            this.stopAnimations(anm.filter(str => str !== a));
            return;
        }

        let x_motion = '', z_motion = '';
        if (z !== 0) {
            const f = _s ? anm[2] : anm[3];
            const b = _s ? anm[4] : anm[5];
            z_motion = z < 0 ? f : b;
            this.blendAnimation(z_motion, 0.5);
        }
        if (x !== 0) {
            const l = _s ? anm[6] : anm[7];
            const r = _s ? anm[8] : anm[9];
            x_motion = x < 0 ? l : r;
            this.blendAnimation(x_motion);
        }
        this.stopAnimations(anm.filter(str => str !== x_motion && str !== z_motion));
        console.log(this.mesh.currentActions);
    }

    // this code is cooked, put the player model in a THREE Group to position relative to player
    // physical position, so all animations are attributed to the model child in the group, so
    // the actions are forwarded to the THREE Group using the mixer from the model
    bakeAnimations() {
        this.mesh.actions['dance'] = this.mesh.actions['mixamo.com'];
        delete this.mesh.actions['mixamo.com'];

        this.mesh.actions['idle'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('idle').animations[0]);
        this.mesh.actions['jump'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('jump').animations[0]);
        this.mesh.actions['forward'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('forward').animations[0]);
        this.mesh.actions['forward run'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('forward run').animations[0]);
        this.mesh.actions['backward'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('backward').animations[0]);
        this.mesh.actions['backward run'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('backward run').animations[0]);
        this.mesh.actions['left'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('left').animations[0]);
        this.mesh.actions['left run'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('left run').animations[0]);
        this.mesh.actions['right'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('right').animations[0]);
        this.mesh.actions['right run'] = this.mesh.mixer.clipAction(g_FBXDelivery.staticAnimation('right run').animations[0]);

        Object.keys(this.mesh.actions).forEach(k => this.mesh.actions[k].name = k);
    }

    look(quat) {
        this.body.quaternion = new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w);
    }

    static Body_() {
        const capsuleBody = new CANNON.Body({
            mass: 1,
            material: g_world.playerMaterial,
            fixedRotation: true,
        });

        const cylinder = new CANNON.Cylinder(radius, radius, height - 2 * radius, 8);
        const cylinderQuaternion = new CANNON.Quaternion();
        cylinderQuaternion.setFromEuler(Math.PI / 2, 0, 0);  // Rotate so it's vertical
        capsuleBody.addShape(cylinder, new CANNON.Vec3(0, 0, 0), cylinderQuaternion);

        const B_sphereTop = new CANNON.Sphere(radius);
        capsuleBody.addShape(B_sphereTop, new CANNON.Vec3(0, height / 2 - radius, 0));

        const B_sphereBottom = new CANNON.Sphere(radius);
        capsuleBody.addShape(B_sphereBottom, new CANNON.Vec3(0, -height / 2 + radius, 0));

        return capsuleBody;
    }

    static Nametag_(name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const fontSize = 200;

        canvas.width = name.length * fontSize + 20;
        canvas.height = fontSize + 20;
        context.font = `${fontSize}px 'JetBrains Mono', monospace`;

        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        const aspectRatio = canvas.width / canvas.height;
        sprite.scale.set(aspectRatio / 2, 0.5, 1);

        return sprite;
    }
}