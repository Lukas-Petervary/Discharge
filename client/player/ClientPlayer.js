import * as CANNON from 'cannon';
import * as THREE from 'three';
import { PlayerBody } from "./PlayerBody.js";
import {PositionPacket} from "/PacketService.js";

const maxWalkSpeed = 5;
const maxSprintSpeed = 10;
const acceleration = 8;
const jumpSpeed = 10;

export class ClientPlayer {
    constructor() {
        this.clientSettings = {
            name: "",
            sensitivity: 1,
        };


        this.playerBody = new PlayerBody();
        this.playerBody.body.collisionFilterGroup = g_world.collisionGroups['client'];
        this.playerBody.tickCallback = () => g_ClientConnection.sendPacket(
            new PositionPacket(
                this.playerBody.body.position,
                this.playerBody.body.velocity,
                this.playerBody.body.quaternion
            )
        );

        // Movement variables
        this.firstPerson = true;
        this.canJump = true;
    }

    handleJump() {
        if (g_Controls.jump.keybind.isPressed && this.canJump) {
            this.playerBody.body.velocity.y = jumpSpeed;
            this.canJump = false;
        }
    }



    handlePlayerMovement() {
        const moveDirection = new CANNON.Vec3(0, 0, 0);
        moveDirection.z = g_Controls.forward.keybind.isPressed ? -1 : g_Controls.backward.keybind.isPressed ? 1 : 0;
        moveDirection.x = g_Controls.left.keybind.isPressed ? -1 : g_Controls.right.keybind.isPressed ? 1 : 0;

        g_Client.playerBody.animate(moveDirection.x, moveDirection.z);

        const _p1 = this.playerBody.body.position.clone(), _p2 = _p1.vsub(new CANNON.Vec3(0, 1, 0));
        const ray = new CANNON.Ray(_p1, _p2);
        ray.intersectWorld(g_world.world, {mode: CANNON.Ray.ALL, collisionFilterMask: -3});
        const groundNormal = ray.result.hitNormalWorld;

        const alignedDir = moveDirection.vsub(groundNormal.scale(moveDirection.dot(groundNormal)));
        const rotatedMovement = this.playerBody.body.quaternion.clone().vmult(alignedDir);
        if (!moveDirection.isZero()) {
            rotatedMovement.unit(rotatedMovement);
        }

        const desiredVelocity = rotatedMovement.scale(g_Controls.sprint.keybind.isPressed ? maxSprintSpeed : maxWalkSpeed);

        const dV = desiredVelocity.vsub(this.playerBody.body.velocity);
        const force = dV.scale(this.playerBody.body.mass * acceleration);
        force.y = 0;

        this.playerBody.body.applyForce(force, this.playerBody.body.position);
    }

    rayCastCamera(camPos) {
        const _p = this.playerBody.mesh.position.clone(), _c = new CANNON.Vec3(_p.x, _p.y, _p.z);
        const ray = new CANNON.Ray(_c, new CANNON.Vec3(camPos.x,camPos.y,camPos.z));
        ray.intersectWorld(g_world.world, {mode: CANNON.Ray.ALL, collisionFilterMask: ~g_world.collisionGroups['client']});
        if (ray.result.hasHit) {
            const v = ray.result.hitPointWorld.vadd(ray.direction.scale(-1));
            return new THREE.Vector3(v.x, v.y, v.z);
        }
        return camPos;
    }

    updateCameraOffset(camOffset) {
        camOffset.applyEuler(g_Controls.cameraControls.lookVec);
        const camPos = this.playerBody.mesh.position.clone().add(camOffset);

        const conCam = camOffset.lengthSq() === 0 ? camPos : this.rayCastCamera(camPos);
        g_renderer.camera.position.copy(conCam);
        g_renderer.camera.quaternion.setFromEuler(g_Controls.cameraControls.lookVec);
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
