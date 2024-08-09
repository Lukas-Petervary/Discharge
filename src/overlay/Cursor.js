export class CustomCursor {
    constructor() {
        this.cursorElement = document.getElementById('custom-cursor');
        this.position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.delta = { dx: 0, dy: 0 };

        this.isLocked = false;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
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

    onPointerLockChange() {
        if (document.pointerLockElement === document.documentElement) {
            this.isLocked = true;
            this.cursorElement.style.backgroundColor = 'blue';
            g_MenuRegistry.hideAllMenus();
        } else {
            this.isLocked = false;
            this.cursorElement.style.backgroundColor = 'red';
            if (!g_MenuRegistry.isMenuOpen && !console.isOpen) {
                g_MenuRegistry.toggleMenu('pause-menu');
            }
        }
    }

    lock() {
        document.documentElement.requestPointerLock = document.documentElement.requestPointerLock || document.documentElement.mozRequestPointerLock || document.documentElement.webkitRequestPointerLock;
        document.documentElement.requestPointerLock();
    }

    unlock() {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        document.exitPointerLock();
    }
}