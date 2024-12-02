import * as CANNON from 'cannon';
import * as THREE from 'three';
import { PlayerBody } from "./PlayerBody.js";
import {PositionPacket} from "../../networking/Packets.js";

const maxWalkSpeed = 5;
const maxSprintSpeed = 10;
const acceleration = 8;
const jumpSpeed = 10;

let playSound = false;

// setInterval(() => {
//     if (playSound) g_AudioManager.playSound('walk', {volume: 0.25, playbackRate: 2, detune: -1200});
// }, 250)

export class ClientPlayer {
    constructor() {
        this.clientSettings = {
            name: "",
            sensitivity: 1,
        };


        this.playerBody = new PlayerBody();

        // Movement variables
        this.firstPerson = true;
        this.canJump = true;

        this.init();
    }

    init() {
        this.playerBody.updateCallback = () => {
            const pos = this.playerBody.body.position;
            g_ConnectionManager.broadcastPacket(new PositionPacket(pos.x, pos.y, pos.z));
        }
    }

    handleJump() {
        if (g_Controls.jump.keybind.isPressed && this.canJump) {
            this.playerBody.body.velocity.y = jumpSpeed;
            //g_AudioManager.playSound('jump', {volume: 2});
            this.canJump = false;
        }
    }

    handlePlayerMovement() {
        const moveDirection = new CANNON.Vec3(0, 0, 0);

        moveDirection.z = g_Controls.forward.keybind.isPressed ? -1 : g_Controls.backward.keybind.isPressed ? 1 : 0;
        moveDirection.x = g_Controls.left.keybind.isPressed ? -1 : g_Controls.right.keybind.isPressed ? 1 : 0;
        if (playSound = (moveDirection.length() > 0)) {
            moveDirection.normalize();
        }

        const rotatedMovement = this.playerBody.body.quaternion.vmult(moveDirection);

        const speed = g_Controls.sprint.keybind.isPressed ? maxSprintSpeed : maxWalkSpeed;
        const desiredVelocity = rotatedMovement.scale(speed);

        const dV = desiredVelocity.vsub(this.playerBody.body.velocity);
        const force = dV.scale(this.playerBody.body.mass * acceleration);
        force.y = 0;

        this.playerBody.body.applyForce(force, this.playerBody.body.position);
    }

    rayCastCamera(camPos) {
        const ray = new CANNON.Ray(this.playerBody.body.position, new CANNON.Vec3(camPos.x, camPos.y, camPos.z));

        const hits = [];
        const intersectCallback = (result) => {
            if (result.body !== this.playerBody.body)
                hits.push(result);
        };
        ray.intersectWorld(g_world.world, {mode: CANNON.Ray.ALL, callback: intersectCallback});

        if (hits.length > 0) {
            const pos = hits[0].hitPointWorld;
            return new THREE.Vector3(pos.x, pos.y, pos.z).addScalar(0.1);
        }
        return camPos;
    }

    updateCameraOffset(camOffset) {
        const offsetVec = new THREE.Vector3().copy(camOffset);
        offsetVec.applyEuler(g_Controls.cameraControls.lookVec);
        const camPos = new THREE.Vector3().copy(this.playerBody.mesh.position).add(offsetVec);

        const conCam = this.rayCastCamera(camPos);
        g_renderer.camera.position.copy(conCam);
        if (conCam === camPos) {
            g_renderer.camera.quaternion.setFromEuler(g_Controls.cameraControls.lookVec);
        } else {
            g_renderer.camera.lookAt(this.playerBody.mesh.position);
        }
    }

    moveCamera() {
        const camEuler = g_Controls.cameraControls.lookVec;
        this.playerBody.body.quaternion.setFromEuler(0, camEuler.y, camEuler.z, 'YXZ');

        const shoulderOffset =
            g_Controls['lean left'].isPressed() ? -1 :
            g_Controls['lean right'].isPressed() ? 1 :
                0;
        const camOffset = new THREE.Vector3(shoulderOffset, 0, this.firstPerson ? 0 : 5);
        this.updateCameraOffset(camOffset);
    }

    move() {
        this.handlePlayerMovement();
        this.handleJump();
        //this.handleCrouch();
    }
}
