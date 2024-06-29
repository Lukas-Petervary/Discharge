export class Player {
    constructor() {
        // Player Body Mesh
        this.playerBody = world.addCapsule(0.5, this.standingHeight, {x: 0, y: 0, z: 0});
        this.sensitivity = 3;

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

            const camOffset = this.firstPerson ? new CANNON.Vec3(0,0,0) : new CANNON.Vec3(0,1,2);
            renderer.camera.position.copy(this.getCameraFrustum(world.world, this.playerBody.body.position.clone(), camOffset));
        };

        this.playerBody.angularDamping = 1;

        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    getCameraFrustum(world, startPos, cameraOffset) {
        const desiredCameraPos = new CANNON.Vec3(
            startPos.x + cameraOffset.x,
            startPos.y + cameraOffset.y,
            startPos.z + cameraOffset.z
        );

        const to = desiredCameraPos;
        const result = new CANNON.RaycastResult();
        const ray = new CANNON.Ray(startPos, to);
        ray.intersectWorld(world, {
            collisionFilterMask: ~0,
            collisionFilterGroup: -1,
        }, result);

        if (result.hasHit) {
            const hitPoint = result.hitPointWorld;

            const hitNormal = result.hitNormalWorld;
            const adjustedCameraPos = new CANNON.Vec3(
                hitPoint.x - hitNormal.x * 0.1,
                hitPoint.y - hitNormal.y * 0.1,
                hitPoint.z - hitNormal.z * 0.1
            );

            return new THREE.Vector3(adjustedCameraPos.x, adjustedCameraPos.y, adjustedCameraPos.z);
        }
        return new THREE.Vector3(desiredCameraPos.x, desiredCameraPos.y, desiredCameraPos.z);
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

    movement() {
        const targetRotation = new CANNON.Quaternion();

        targetRotation.setFromEuler(0, 1 - (this.sensitivity * cursor.position.x/window.innerWidth * 2), 0, 'YXZ');
        this.playerBody.body.quaternion.copy(targetRotation);

        const cameraTargetRotation = new CANNON.Quaternion();

        const min = -Math.PI/2.2, max = Math.PI/2.2;
        let yVal = 1 - (this.sensitivity*cursor.position.y/window.innerHeight * 2);
        yVal = yVal < min ? min : yVal > max ? max : yVal;
        cursor.position.y = (1-yVal) / 2 * window.innerHeight / this.sensitivity;

        cameraTargetRotation.setFromEuler(yVal, 0, 0, 'YXZ');
        renderer.camera.quaternion.copy(cameraTargetRotation);

        this.handlePlayerMovement();
        this.handleJump();
        //this.handleCrouch();
    }
}