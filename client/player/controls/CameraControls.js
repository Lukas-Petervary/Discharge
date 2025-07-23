import * as THREE from 'three';
import Logger from "../../../shared/Logger.js";

export class CameraControls {
    constructor() {
        this.lockElement = document.getElementById('game-canvas');

        this.isLocked = false;
        this.onCooldown = false;
        this.isEnabled = false;

        this.onLookEvent = [];

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
        this.lock().then(_ => this.isEnabled = true);
    }
    disable() {
        this.unlock().then(_ => this.isEnabled = false);
    }

    async lock() {
        if (this.onCooldown) {
            Logger.debug('PointerLock API on cooldown');
            g_Menu.showMenu('pause-menu');
            this.isEnabled = false;
            return;
        }

        if (document.pointerLockElement === this.lockElement) {
            Logger.debug('Cursor already locked')
        } else {
            try {await this.lockElement.requestPointerLock({ unadjustedMovement: true });}
            catch (e) {Logger.error(e);}
        }
    }

    async unlock() {
        if (document.pointerLockElement === null) {
            Logger.debug('Cursor already unlocked')
        } else {
            try {await document.exitPointerLock();}
            catch (e) {Logger.error(e);}
        }
    }

    _pointerLockChangeEvent() {
        this.isLocked = document.pointerLockElement === this.lockElement;
        if (!this.isLocked) {
            this.onCooldown = true;
            setTimeout(() => {
                this.onCooldown = false;
                Logger.debug('Cursor able to lock again')
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
        Logger.debug(`PointerLock Error:`, err);
    }

    _onmousemove(event) {
        if (!this.isEnabled) return;

        this.pitch -= event.movementY * 0.002 * g_Client.clientSettings.sensitivity;
        this.yaw -= event.movementX * 0.002 * g_Client.clientSettings.sensitivity;

        const MAX_THETA = Math.PI / 2 - 0.1;
        this.pitch = Math.min(MAX_THETA, Math.max(-MAX_THETA, this.pitch));

        this.lookVec = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');

        for(const callback of this.onLookEvent) {
            callback(this.pitch, this.yaw, this.lookVec);
        }
    }
}