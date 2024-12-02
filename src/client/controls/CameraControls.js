import * as THREE from 'three';

export class CameraControls {
    constructor() {
        this.lockElement = document.getElementById('game-canvas');

        this.isLocked = false;
        this.onCooldown = false;
        this.isEnabled = false;

        this.pitch = 0;
        this.yaw = 0;
        this.lookVec = new THREE.Euler(0, 0, 0);

        this.init();
    }

    init() {
        document.addEventListener("pointerlockchange", this._pointerLockChangeEvent.bind(this));
        document.addEventListener("pointerlockerror", this._pointerLockErrorEvent.bind(this));
        document.addEventListener("mousemove", this._onmousemove.bind(this));
    }

    enable() {
        this.isEnabled = true;
        this.lock();
    }
    disable() {
        this.isEnabled = false;
        this.unlock();
    }

    lock() {
        if (this.onCooldown) {
            console.warn('PointerLock API on cooldown');
            g_Menu.showMenu('pause-menu');
            this.isEnabled = false;
            return;
        }

        if (document.pointerLockElement === this.lockElement) {
            console.warn('Cursor already locked')
        } else {
            this.lockElement.requestPointerLock({ unadjustedMovement: true })
        }
    }

    unlock() {
        if (document.pointerLockElement === null) {
            console.warn('Cursor already unlocked')
        } else {
            document.exitPointerLock();
        }
    }

    _pointerLockChangeEvent() {
        this.isLocked = document.pointerLockElement === this.lockElement;
        if (!this.isLocked) {
            this.onCooldown = true;
            setTimeout(() => {
                this.onCooldown = false;
                console.log('Cursor able to lock again')
            }, 1000);
            if (g_Menu.menuStack.length === 0) {
                g_Menu.showMenu('pause-menu');
            }
        }

        if (this.isEnabled && !this.isLocked)
            this.isEnabled = false;
    }

    _pointerLockErrorEvent(err) {
        if (this.isEnabled && !this.isLocked) {
            this.isEnabled = false;
            g_Menu.showMenu('pause-menu');
        }
        console.trace(`PointerLock Error: ${err}`);
    }

    _onmousemove(event) {
        if (!this.isEnabled) return;

        this.pitch -= event.movementY * 0.002 * g_Client.clientSettings.sensitivity;
        this.yaw -= event.movementX * 0.002 * g_Client.clientSettings.sensitivity;

        const MAX_THETA = Math.PI / 2 - 0.1;
        this.pitch = Math.min(MAX_THETA, Math.max(-MAX_THETA, this.pitch));

        this.lookVec = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    }
}