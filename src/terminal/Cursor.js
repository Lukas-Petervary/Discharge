export class CustomCursor {
    constructor() {
        this.cursorElement = document.getElementById('custom-cursor');
        this.isLocked = false;
        this.position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.delta = { dx: 0, dy: 0 };

        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onMouseMove(e) {
        if (this.isLocked) {
            this.delta.dx = e.movementX;
            this.delta.dy = e.movementY;

            this.position.x += this.delta.dx;
            this.position.y += this.delta.dy;

            // Ensure the position stays within the window bounds
            this.position.x = Math.max(0, Math.min(window.innerWidth, this.position.x));
            this.position.y = Math.max(0, Math.min(window.innerHeight, this.position.y));

            this.cursorElement.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        } else {
            this.cursorElement.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        }
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
        this.isLocked ? this.lockCursor() : this.unlockCursor();
        window.debugTerminal.log(`Cursor ${this.isLocked ? 'locked' : 'unlocked'}`)
    }

    lockCursor() {
        this.cursorElement.style.backgroundColor = 'blue';
        this.position = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Reset position to center
        this.cursorElement.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        document.documentElement.requestPointerLock = document.documentElement.requestPointerLock || document.documentElement.mozRequestPointerLock || document.documentElement.webkitRequestPointerLock;
        document.documentElement.requestPointerLock();
    }

    unlockCursor() {
        this.cursorElement.style.backgroundColor = 'red';
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        document.exitPointerLock();
    }
}