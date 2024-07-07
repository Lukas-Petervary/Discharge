import { PlayerBody } from "./PlayerBody.js";

const maxWalkSpeed = 5;
const maxSprintSpeed = 10;
const acceleration = 2;
const jumpSpeed = 10;

export class Player {
    constructor() {
        // Player Body Mesh
        this.playerBody = new PlayerBody();
        this.sensitivity = 3;

        // Player look direction
        this.pitch = 0;
        this.yaw = 0;

        // Movement variables
        this.firstPerson = true;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.isSprinting = false;
        this.canJump = true;

        this.init();
    }

    init() {
        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    onKeyDown(event) {
        switch (event.keyCode) {
            case 87: // W
                this.moveForward = true;
                break;
            case 83: // S
                this.moveBackward = true;
                break;
            case 65: // A
                this.moveLeft = true;
                break;
            case 68: // D
                this.moveRight = true;
                break;
            case 32: // Spacebar (jump)
                if (this.canJump)
                    this.isJumping = true;
                break;
            case 16: // Shift (sprint)
                this.isSprinting = true;
                break;
            case 67: // C (crouch)
                this.isCrouching = true;
                break;
            case 115: // F4 (third person)
                this.firstPerson = !this.firstPerson;
        }
    }

    onKeyUp(event) {
        switch (event.keyCode) {
            case 87: // W
                this.moveForward = false;
                break;
            case 83: // S
                this.moveBackward = false;
                break;
            case 65: // A
                this.moveLeft = false;
                break;
            case 68: // D
                this.moveRight = false;
                break;
            case 32: // Spacebar (jump)
                this.isJumping = false;
                break;
            case 16: // Shift (sprint)
                this.isSprinting = false;
                break;
            case 67: // C (crouch)
                this.isCrouching = false;
                break;
        }
    }

    handleJump() {
        if (this.isJumping && this.canJump) {
            const jumpImpulse = new Ammo.btVector3(0, jumpSpeed, 0);
            this.playerBody.physicsMesh.body.applyCentralImpulse(jumpImpulse);

            this.canJump = false;
        }
    }

    /*handleCrouch() {
        if (this.isCrouching) {
            playerBody.scale.y = 0.5; // Scale down playerBody height
            playerBody.position.y = crouchingHeight / 2; // Adjust position when crouching
        } else {
            playerBody.scale.y = 1; // Reset to full height
            playerBody.position.y = standingHeight / 2; // Adjust position when standing
        }
    }*/
    handlePlayerMovement() {
        const moveDirection = new Ammo.btVector3(0, 0, 0);

        moveDirection.setZ(this.moveForward ? -1 : this.moveBackward ? 1 : 0);
        moveDirection.setX(this.moveLeft ? -1 : this.moveRight ? 1 : 0);
        if (moveDirection.length() > 0) moveDirection.normalize();

        const rotatedMovement = this.playerBody.physicsMesh.body.getWorldTransform().getRotation().op_mul(moveDirection);

        const speed = this.isSprinting ? maxSprintSpeed : maxWalkSpeed;
        const desiredVelocity = rotatedMovement.op_mul(speed);

        const currentVelocity = this.playerBody.physicsMesh.body.getLinearVelocity();
        const dV = desiredVelocity.op_sub(currentVelocity);
        const force = dV.op_mul(this.playerBody.physicsMesh.body.getInvMass() * acceleration);
        force.setY(0.1);

        this.playerBody.physicsMesh.body.applyCentralForce(force);
    }

    updateCameraRotation() {
        // clamp camera pitch
        const min = -Math.PI / 2.2, max = Math.PI / 2.2;
        this.pitch = this.sensitivity * (1 - cursor.position.y / window.innerHeight * 2);
        this.pitch = this.pitch < min ? min : this.pitch > max ? max : this.pitch;
        cursor.position.y = (1 - this.pitch / this.sensitivity) * window.innerHeight / 2;

        this.yaw = this.sensitivity * (1 - cursor.position.x / window.innerWidth * 2);

        // apply pitch and yaw to camera
        const lookVec = new Ammo.btQuaternion();
        lookVec.setEulerZYX(0, this.yaw, 0);
        this.playerBody.physicsMesh.body.getWorldTransform().setRotation(lookVec);
        lookVec.setEulerZYX(this.pitch, this.yaw, 0);
        g_Renderer.camera.quaternion.copy(new THREE.Quaternion(lookVec.x(), lookVec.y(), lookVec.z(), lookVec.w()));
    }

    updateCameraFrustum(camOffset) {
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);

        const combinedQuaternion = this.playerBody.mesh.quaternion.clone().multiply(pitchQuaternion);
        const offset = camOffset.clone().applyQuaternion(combinedQuaternion);
        const desiredCamPos = new THREE.Vector3().copy(this.playerBody.mesh.position).add(offset);

        // raytracing not working ?? ty ammo
        const ray = new Ammo.btCollisionWorld.ClosestRayResultCallback(
            new Ammo.btVector3(this.playerBody.physicsMesh.body.getWorldTransform().getOrigin()),
            new Ammo.btVector3(desiredCamPos.x, desiredCamPos.y, desiredCamPos.z)
        );
        g_World.physicsWorld.rayTest(ray.m_rayFromWorld, ray.m_rayToWorld, ray);

        const finalPos = ray.hasHit() ? ray.m_hitPointWorld : desiredCamPos;

        g_Renderer.camera.position.copy(finalPos);
        g_Renderer.camera.lookAt(this.playerBody.mesh.position);
    }

    movement() {
        this.updateCameraRotation();
        if (this.firstPerson)
            g_Renderer.camera.position.copy(this.playerBody.mesh.position);
        else
            this.updateCameraFrustum(new THREE.Vector3(0, 0, 5));

        this.handlePlayerMovement();
        this.handleJump();
        //this.handleCrouch();
    }
}