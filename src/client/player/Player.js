import { PlayerBody } from "./PlayerBody.js";

const maxWalkSpeed = 5;
const maxSprintSpeed = 10;
const acceleration = 8;
const jumpSpeed = 10;

let playSound = false;

setInterval(() => {
    if (playSound) g_AudioManager.playSound('walk', {volume: 0.25, playbackRate: 2, detune: -1200});
}, 250)

export class Player {
    constructor() {
        // Player Body Mesh
        this.playerBody = new PlayerBody()
        this.sensitivity = 3;

        // Player look direction
        this.pitch = 0;
        this.yaw = 0;

        // Movement variables
        this.firstPerson = true;
        this.canJump = true;

        this.init();
    }

    init() {
        /*this.playerBody.updateCallback = (body, mesh) => {
            const q = body.quaternion;
            const yaw = Math.atan2(2 * (q.w * q.y + q.z * q.x), 1 - 2 * (q.y * q.y + q.x * q.x));

            const newQuaternion = new CANNON.Quaternion();
            newQuaternion.setFromEuler(0, yaw, 0, 'YXZ');

            body.quaternion.copy(newQuaternion);
            body.angularVelocity.set(0,0,0);
        };*/

        g_Controls.of('key.camera.third_person').onPress(() => {this.firstPerson = !this.firstPerson;});
    }

    handleJump() {
        if (g_Controls.of('key.movement.jump').isPressed && this.canJump) {
            this.playerBody.body.velocity.y = jumpSpeed;
            g_AudioManager.playSound('jump', {volume: 2});
            this.canJump = false;
        }
    }

    handlePlayerMovement() {
        const moveDirection = new CANNON.Vec3(0, 0, 0);

        moveDirection.z = g_Controls.of('key.movement.forward').isPressed ? -1 : g_Controls.of('key.movement.backward').isPressed ? 1 : 0;
        moveDirection.x = g_Controls.of('key.movement.left').isPressed ? -1 : g_Controls.of('key.movement.right').isPressed ? 1 : 0;
        if (playSound = (moveDirection.length() > 0)) {
            moveDirection.normalize();
        }

        const rotatedMovement = this.playerBody.body.quaternion.vmult(moveDirection);

        const speed = g_Controls.of('key.movement.sprint').isPressed ? maxSprintSpeed : maxWalkSpeed;
        const desiredVelocity = rotatedMovement.scale(speed);

        const dV = desiredVelocity.vsub(this.playerBody.body.velocity);
        const force = dV.scale(this.playerBody.body.mass * acceleration);
        force.y = 0;

        this.playerBody.body.applyForce(force, this.playerBody.body.position);
    }

    updateCameraRotation() {
        // clamp camera pitch
        const min = -Math.PI/2.2, max = Math.PI/2.2;
        this.pitch -= g_Cursor.delta.dy / window.innerHeight * this.sensitivity;
        this.pitch = this.pitch < min ? min : this.pitch > max ? max : this.pitch;
        this.yaw -= g_Cursor.delta.dx / window.innerWidth * this.sensitivity;

        // apply pitch and yaw to camera
        const lookVec = new CANNON.Quaternion();
        lookVec.setFromEuler(0, this.yaw, 0, 'YXZ');
        this.playerBody.body.quaternion.copy(lookVec);
        lookVec.setFromEuler(this.pitch, this.yaw, 0, 'YXZ');
        g_renderer.camera.quaternion.copy(lookVec);
    }

    updateCameraOffset(camOffset) {
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);

        const combinedQuaternion = this.playerBody.mesh.quaternion.clone().multiply(pitchQuaternion);
        const offset = camOffset.clone().applyQuaternion(combinedQuaternion);
        const desiredCamPos = new CANNON.Vec3().copy(this.playerBody.mesh.position).vadd(offset);

        // raytracing not working ?? ty cannon
        const ray = new CANNON.Ray(this.playerBody.body.position, new CANNON.Vec3().copy(desiredCamPos));
        ray._updateDirection();
        const result = new CANNON.RaycastResult();

        const collision = ray.intersectBodies(g_world.world.bodies, result);
        const finalPos = collision ? result.hitPointWorld : desiredCamPos;

        g_renderer.camera.position.copy(finalPos);
        g_renderer.camera.lookAt(this.playerBody.mesh.position);
    }

    moveCamera() {
        if (g_Cursor.isLocked)
            this.updateCameraRotation();
        if (this.firstPerson)
            g_renderer.camera.position.copy(this.playerBody.mesh.position);
        else
            this.updateCameraOffset(new THREE.Vector3(0,0,5));
    }

    move() {
        this.handlePlayerMovement();
        this.handleJump();
        //this.handleCrouch();
    }
}
