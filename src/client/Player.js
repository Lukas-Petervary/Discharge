//import {CustomCursor} from "../terminal/Cursor";

export class Player {
    constructor() {
        // Player Body Mesh
        this.playerBody = world.addCapsule(0.5, this.standingHeight, {x: 0, y: 0, z: 0});

        // Movement variables
        this.jumpSpeed = 2;
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
        window.renderer.camera.position.set(this.playerBody.body.position.x, this.playerBody.body.position.y, this.playerBody.body.position.z);
        this.playerBody.mesh.add(renderer.camera);


        document.addEventListener('keydown', this.onKeyDown, false);
        document.addEventListener('keyup', this.onKeyUp, false);
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

    movement() {
        // Smoothly interpolate rotation towards target angles
        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(window.cursor.position.y, -1 * window.cursor.position.x, 0, 'YXZ'))
            .multiply(renderer.camera.quaternion);

        let playerBodyThreeQuat = Player.quatCto3(this.playerBody.body.quaternion);
        playerBodyThreeQuat.rotateTowards(deltaRotationQuaternion, 0.05); // Adjust rotation speed here
        this.playerBody.body.quaternion = Player.quat3toC(playerBodyThreeQuat);

        // Update playerBody position based on keyboard movement
        const moveDirection = new THREE.Vector3();
        if (this.moveForward) moveDirection.z = -1;
        if (this.moveBackward) moveDirection.z = 1;
        if (this.moveLeft) moveDirection.x = -1;
        if (this.moveRight) moveDirection.x = 1;

        moveDirection.applyQuaternion(this.playerBody.body.quaternion);
        moveDirection.multiplyScalar(this.moveSpeed * (this.isSprinting ? this.sprintMultiplier : 1));

        this.playerBody.body.position.vadd(moveDirection);

        // Limit camera rotation vertically
        window.renderer.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, window.renderer.camera.rotation.x));

        // Handle jumping and gravity
        this.handleJump();

        // Adjust playerBody height and position based on crouching
        //this.handleCrouch();
    }

    static quat3toC(threeQuaternion) {
        return new CANNON.Quaternion(threeQuaternion.x, threeQuaternion.y, threeQuaternion.z, threeQuaternion.w);
    }
    static quatCto3(cannonQuaternion) {
        return new THREE.Quaternion(cannonQuaternion.x, cannonQuaternion.y, cannonQuaternion.z, cannonQuaternion.w);
    }
}