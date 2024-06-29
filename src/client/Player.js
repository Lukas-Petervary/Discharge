export class Player {
    constructor() {
        // Player Body Mesh
        this.playerBody = world.addCapsule(0.5, this.standingHeight, {x: 0, y: 0, z: 0});
        this.sensitivity = 3;

        // Player look direction
        this.pitch = 0;
        this.yaw = 0;

        // Movement variables
        this.jumpSpeed = 2;
        this.firstPerson = true;
        this.sprintMultiplier = 2;
        this.moveSpeed = 0.1;
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
        this.playerBody.updateCallback = (body, mesh) => {
            const q = body.quaternion;
            const yaw = Math.atan2(2 * (q.w * q.y + q.z * q.x), 1 - 2 * (q.y * q.y + q.x * q.x));

            const newQuaternion = new CANNON.Quaternion();
            newQuaternion.setFromEuler(0, yaw, 0, 'YXZ');

            body.quaternion.copy(newQuaternion);
            body.angularVelocity.set(0,0,0);
        };

        //this.playerBody.angularDamping = 1;

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
            this.playerBody.body.position.y += this.jumpSpeed;
            this.canJump = false;
        }
        if (this.playerBody.body.position.y <= 0) {
            this.canJump = true;
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
        const moveDirection = new THREE.Vector3();

        if (this.moveForward) moveDirection.z = -1;
        if (this.moveBackward) moveDirection.z = 1;
        if (this.moveLeft) moveDirection.x = -1;
        if (this.moveRight) moveDirection.x = 1;

        moveDirection.applyQuaternion(this.playerBody.body.quaternion);
        moveDirection.normalize(); // Normalize the direction vector to avoid faster diagonal movement

        const speed = this.moveSpeed * (this.isSprinting ? this.sprintMultiplier : 1);
        moveDirection.multiplyScalar(speed);

        // Apply force to the player body
        const force = new CANNON.Vec3(moveDirection.x, 0, moveDirection.z);
        this.playerBody.body.position.x += force.x;
        this.playerBody.body.position.z += force.z;
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
        this.playerBody.body.quaternion.copy(lookVec);
        lookVec.setFromEuler(this.pitch, this.yaw, 0, 'YXZ');
        renderer.camera.quaternion.copy(lookVec);
    }

    updateCameraFrustum(camOffset) {
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);

        const combinedQuaternion = this.playerBody.mesh.quaternion.clone().multiply(pitchQuaternion);
        const offset = camOffset.clone().applyQuaternion(combinedQuaternion);
        const desiredCamPos = new CANNON.Vec3().copy(this.playerBody.mesh.position).vadd(offset);

        // raytracing not working ?? ty cannon
        const ray = new CANNON.Ray(this.playerBody.body.position, new CANNON.Vec3().copy(desiredCamPos));
        ray._updateDirection();
        const result = new CANNON.RaycastResult();

        const collision = ray.intersectBodies(world.world.bodies, result);
        const finalPos = collision ? result.hitPointWorld : desiredCamPos;

        renderer.camera.position.copy(finalPos);
        renderer.camera.lookAt(this.playerBody.mesh.position);
    }

    movement() {
        this.updateCameraRotation();
        if (this.firstPerson)
            renderer.camera.position.copy(this.playerBody.mesh.position);
        else
            this.updateCameraFrustum(new THREE.Vector3(0,0,5));

        this.handlePlayerMovement();
        this.handleJump();
        //this.handleCrouch();
    }
}