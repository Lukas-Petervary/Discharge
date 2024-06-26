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
        this.cursorElement.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    }

    onMouseMove(e) {
        if (this.isLocked) {
            this.delta.dx = e.movementX;
            this.delta.dy = e.movementY;

            this.position.x += this.delta.dx;
            this.position.y += this.delta.dy;
        } else {
            this.position.x = e.clientX;
            this.position.y = e.clientY;
        }
        this.cursorElement.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
        this.isLocked ? this.lock() : this.unlock();
        debugTerminal.log(`Cursor ${this.isLocked ? 'locked' : 'unlocked'}`)
    }

    lock() {
        this.cursorElement.style.backgroundColor = 'blue';
        document.documentElement.requestPointerLock = document.documentElement.requestPointerLock || document.documentElement.mozRequestPointerLock || document.documentElement.webkitRequestPointerLock;
        document.documentElement.requestPointerLock();
    }

    unlock() {
        this.cursorElement.style.backgroundColor = 'red';
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        document.exitPointerLock();
    }
}