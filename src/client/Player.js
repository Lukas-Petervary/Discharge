import {PlayerBody} from "./PlayerBody.js";

const maxWalkSpeed = 5;
const maxSprintSpeed = 10;
const acceleration = 2;

export class Player {
    constructor() {
        // Player Body Mesh
        this.playerBody = new PlayerBody();
        this.sensitivity = 3;

        // Player state
        this.pitch = 0;
        this.yaw = 0;

        // Movement variables
        this.jumpSpeed = 2;
        this.firstPerson = true;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.isSprinting = false;
        this.canJump = true;
        this.standingHeight = 1.8; // Standing height of the playerBody
        this.crouchingHeight = .5;

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
        this.playerBody.physicsMesh.body.position.set(0,0,0);
        if (this.isJumping && this.canJump) {
            // Apply jump force (example using applyImpulse)
            const jumpImpulse = new CANNON.Vec3(0, this.jumpSpeed, 0);
            this.playerBody.physicsMesh.body.applyImpulse(jumpImpulse, this.playerBody.physicsMesh.body.position);

            // Prevent jumping until the player lands again
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
        const moveDirection = new CANNON.Vec3(0, 0, 0);

        moveDirection.z = this.moveForward ? -1 : this.moveBackward ? 1 : 0;
        moveDirection.x = this.moveLeft ? -1 : this.moveRight ? 1 : 0;
        if (moveDirection.length() > 0) moveDirection.normalize();

        const rotatedMovement = this.playerBody.physicsMesh.body.quaternion.vmult(moveDirection);

        const speed = this.isSprinting ? maxSprintSpeed : maxWalkSpeed;
        const desiredVelocity = rotatedMovement.scale(speed);
        desiredVelocity.y = this.playerBody.physicsMesh.body.velocity.y;

        const dV = desiredVelocity.vsub(this.playerBody.physicsMesh.body.velocity);
        const force = dV.scale(this.playerBody.physicsMesh.body.mass * acceleration);

        this.playerBody.physicsMesh.body.applyForce(force, this.playerBody.physicsMesh.body.position);
    }

    updateCameraRotation() {
        // clamp camera pitch
        const min = -Math.PI/2.2, max = Math.PI/2.2;
        this.pitch = this.sensitivity * (1 - cursor.position.y/window.innerHeight*2);
        this.pitch = this.pitch < min ? min : this.pitch > max ? max : this.pitch;
        cursor.position.y = (1 - this.pitch/this.sensitivity) * window.innerHeight / 2;

        this.yaw = this.sensitivity * (1 - cursor.position.x/window.innerWidth*2);

        // apply pitch and yaw to camera
        const lookVec = new CANNON.Quaternion();
        lookVec.setFromEuler(0, this.yaw, 0, 'YXZ');
        this.playerBody.physicsMesh.body.quaternion.copy(lookVec);
        lookVec.setFromEuler(this.pitch, this.yaw, 0, 'YXZ');
        renderer.camera.quaternion.copy(lookVec);
    }

    updateCameraFrustum(camOffset) {
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);

        const combinedQuaternion = this.playerBody.physicsMesh.mesh.quaternion.clone().multiply(pitchQuaternion);
        const offset = camOffset.clone().applyQuaternion(combinedQuaternion);
        const desiredCamPos = new CANNON.Vec3().copy(this.playerBody.physicsMesh.mesh.position).vadd(offset);

        // raytracing not working ?? ty cannon
        const ray = new CANNON.Ray(this.playerBody.physicsMesh.body.position, new CANNON.Vec3().copy(desiredCamPos));
        ray._updateDirection();
        const result = new CANNON.RaycastResult();

        const collision = ray.intersectBodies(world.world.bodies, result);
        const finalPos = collision ? result.hitPointWorld : desiredCamPos;

        renderer.camera.position.copy(finalPos);
        renderer.camera.lookAt(this.playerBody.physicsMesh.mesh.position);
    }

    movement() {
        this.updateCameraRotation();
        if (this.firstPerson)
            renderer.camera.position.copy(this.playerBody.physicsMesh.mesh.position);
        else
            this.updateCameraFrustum(new THREE.Vector3(0,0,5));

        this.handlePlayerMovement();
        this.handleJump();
        //this.handleCrouch();
    }
}