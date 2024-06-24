// Initialize Three.js variables
let scene, camera, renderer, capsule;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// Movement variables
const moveSpeed = 0.1;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Call the init function once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 0); // Initial position (adjust height for eye level)

    // Create a WebGL renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2; // Rotate to be horizontal
    scene.add(ground);

    // Create a capsule shape using CylinderGeometry and SphereGeometry
    const capsuleGeometry = new THREE.BufferGeometry();

    const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 32); // Adjust dimensions for character
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 16);

    // Position and merge geometries to create the capsule shape
    cylinderGeometry.translate(0, 0.9, 0); // Adjust position for character
    sphereGeometry.translate(0, 0.5, 0); // Adjust position for character

    capsuleGeometry.merge(cylinderGeometry);
    capsuleGeometry.merge(sphereGeometry);

    // Create a material
    const capsuleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

    // Create a mesh and add it to the scene
    capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
    scene.add(capsule);
    capsule.add(camera);
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

    // Start animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Update camera position based on mouse movement
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    camera.rotation.y += (targetX - camera.rotation.y) * 0.05;
    camera.rotation.x += (-targetY - camera.rotation.x) * 0.05;

    // Update camera position based on keyboard movement
    const moveDirection = new THREE.Vector3();
    if (moveForward) moveDirection.z = -1;
    if (moveBackward) moveDirection.z = 1;
    if (moveLeft) moveDirection.x = -1;
    if (moveRight) moveDirection.x = 1;

    moveDirection.applyQuaternion(capsule.quaternion);
    capsule.position.add(moveDirection.multiplyScalar(moveSpeed));

    // Limit camera rotation vertically

    // Render the scene
    renderer.render(scene, camera);
}

function onMouseMove(event) {
    mouseX -= event.movementX;
    mouseY += event.movementY;
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
    }
}

function onWindowResize() {
    // Adjust aspect ratio on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
