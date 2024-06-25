import { Renderer, Capsule } from "../render/Renderer.js";

// Initialize Three.js variables and constants
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// Movement variables
const jumpSpeed = 2;
const sprintMultiplier = 2;
const moveSpeed = 0.1;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isJumping = false;
let isCrouching = false;
let isSprinting = false;
let canJump = true;
let standingHeight = 1.8; // Standing height of the capsule
let crouchingHeight = .5;

export function createChar() {
    // Quaternion to manage camera rotation
    const cameraQuaternion = new THREE.Quaternion();

    Renderer.camera.position.set(0, standingHeight - .2, 0); // Initial position (adjust height for eye level)

    var playerBody = new Capsule();
    playerBody.addToScene(renderer.scene);
    playerBody.add(camera);

// Hide mouse cursor and lock it within the viewport
    document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

    document.addEventListener('click', () => {
        if (document.body.requestPointerLock) {
            document.body.requestPointerLock();
        }
    });

    // Handle mouse movement to control camera
    document.addEventListener('mousemove', onMouseMove, false);

    // Handle keyboard movement controls
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);
}

export function movement() {
    // Smoothly interpolate rotation towards target angles
    const deltaRotationQuaternion = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(targetY, -1 * targetX, 0, 'YXZ'))
        .multiply(cameraQuaternion);

    capsule.quaternion.rotateTowards(deltaRotationQuaternion, 0.05); // Adjust rotation speed here

    // Update capsule position based on keyboard movement
    const moveDirection = new THREE.Vector3();
    if (moveForward) moveDirection.z = -1;
    if (moveBackward) moveDirection.z = 1;
    if (moveLeft) moveDirection.x = -1;
    if (moveRight) moveDirection.x = 1;

    moveDirection.applyQuaternion(capsule.quaternion);
    if (isSprinting) {
        moveDirection.multiplyScalar(moveSpeed * sprintMultiplier);
    } else {
        moveDirection.multiplyScalar(moveSpeed);
    }
    capsule.position.add(moveDirection);

    // Limit camera rotation vertically
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

    // Handle jumping and gravity
    handleJump();

    // Adjust capsule height and position based on crouching
    handleCrouch();
}

function onMouseMove(event) {
    mouseX += event.movementX * 0.002;
    mouseY += event.movementY * 0.002;

    targetY = Math.PI / 2 - mouseY;
    targetX = -Math.PI + mouseX;
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 87: // W
            moveForward = true;
            break;
        case 83: // S
            moveBackward = true;
            break;
        case 65: // A
            moveLeft = true;
            break;
        case 68: // D
            moveRight = true;
            break;
        case 32: // Spacebar (jump)
            if (canJump) isJumping = true;
            break;
        case 16: // Shift (sprint)
            isSprinting = true;
            break;
        case 67: // C (crouch)
            isCrouching = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.keyCode) {
        case 87: // W
            moveForward = false;
            break;
        case 83: // S
            moveBackward = false;
            break;
        case 65: // A
            moveLeft = false;
            break;
        case 68: // D
            moveRight = false;
            break;
        case 32: // Spacebar (jump)
            isJumping = false;
            break;
        case 16: // Shift (sprint)
            isSprinting = false;
            break;
        case 67: // Ctrl (crouch)
            isCrouching = false;
            break;
    }
}

function onWindowResize() {
    // Adjust aspect ratio on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleJump() {
    if (isJumping && canJump) {
        capsule.position.y += jumpSpeed;
        canJump = false;
    } else {
        const gravity = -0.01;
        capsule.position.y += gravity;
    }
    if (capsule.position.y <= 0) {
        capsule.position.y = 0; // Snap to ground level
        canJump = true;
    }
}

function handleCrouch() {
    if (isCrouching) {
        capsule.scale.y = 0.5; // Scale down capsule height
        capsule.position.y = crouchingHeight / 2; // Adjust position when crouching
    } else {
        capsule.scale.y = 1; // Reset to full height
        capsule.position.y = standingHeight / 2; // Adjust position when standing
    }
}
