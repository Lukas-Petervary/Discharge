import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.listener = this.audioContext.listener;
        this.sounds = {};
    }

    async init() {
        await this.loadSound('walk', 'assets/sounds/step.mp3');
        await this.loadSound('jump', 'assets/sounds/boing.mp3');
    }

    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[name] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
        }
    }

    playSound(name, settings = {}) {
        if (!this.sounds[name]) {
            console.error(`Sound ${name} not found!`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.loop = settings.loop || false;
        source.playbackRate.value = settings.playbackRate || 1;
        source.detune.value = settings.detune || 0;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = settings.volume || 1;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(settings.startTime || 0);
    }

    playDirectionalSound(name, position, settings = {}) {
        if (!this.sounds[name]) {
            console.error(`Sound ${name} not found!`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.loop = settings.loop || false;
        source.playbackRate.value = settings.playbackRate || 1;
        source.detune.value = settings.detune || 0;

        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = settings.refDistance || 1;
        panner.maxDistance = settings.maxDistance || 10000;
        panner.rolloffFactor = settings.rolloffFactor || 1;
        panner.coneInnerAngle = settings.coneInnerAngle || 360;
        panner.coneOuterAngle = settings.coneOuterAngle || 0;
        panner.coneOuterGain = settings.coneOuterGain || 0;

        panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
        panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
        panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = settings.volume || 1;

        source.connect(panner);
        panner.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(settings.startTime || 0);
    }

    setListenerPosition(position, quaternion) {
        this.listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
        this.listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
        this.listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);

        // Convert quaternion to Euler angles using THREE.js
        const euler = new THREE.Euler();
        const quat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        euler.setFromQuaternion(quat);

        // Web Audio API uses forward and up vectors, not Euler angles directly
        this.listener.forwardX.setValueAtTime(Math.sin(euler.y), this.audioContext.currentTime);
        this.listener.forwardY.setValueAtTime(-Math.sin(euler.x), this.audioContext.currentTime);
        this.listener.forwardZ.setValueAtTime(-Math.cos(euler.y), this.audioContext.currentTime);

        this.listener.upX.setValueAtTime(Math.cos(euler.x), this.audioContext.currentTime);
        this.listener.upY.setValueAtTime(Math.sin(euler.x), this.audioContext.currentTime);
        this.listener.upZ.setValueAtTime(0, this.audioContext.currentTime); // Assuming the up vector is along the Y-axis
    }

    pushPlayerPosition() {
        const playerPosition = g_Client.playerBody.body.position.clone();
        const playerQuaternion = g_Client.playerBody.body.quaternion.clone();

        // Convert Cannon.js position and quaternion to suitable format
        const position = {
            x: playerPosition.x,
            y: playerPosition.y,
            z: playerPosition.z
        };

        const quaternion = {
            x: playerQuaternion.x,
            y: playerQuaternion.y,
            z: playerQuaternion.z,
            w: playerQuaternion.w
        };

        g_AudioManager.setListenerPosition(position, quaternion);
    }
}