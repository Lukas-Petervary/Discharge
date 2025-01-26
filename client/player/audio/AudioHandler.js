import * as THREE from 'three';

class SoundProperties {
    constructor({ volume = 1, loop = false, refDistance = 10, distance = 10 } = {}) {
        this.volume = volume;
        this.loop = loop;
        this.refDistance = refDistance;
        this.distance = distance;
    }
}

class AudioNode extends THREE.Object3D {
    constructor(audio, autoRemove = true) {
        super();
        this.audio = audio;
        this.add(audio);

        if (autoRemove) {
            this.audio.source.onended = () => {
                if (this.parent) {
                    this.parent.remove(this);
                }
            };
        }
    }

    play() {
        this.audio.play();
    }

    stop() {
        this.audio.stop();
        if (this.parent) {
            this.parent.remove(this);
        }
    }
}

class AudioHandler {
    constructor(camera, listener = new THREE.AudioListener()) {
        // Attach the listener to the camera
        this.camera = camera;
        this.listener = listener;
        this.camera.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();

        // Store audio buffers
        this.audioBuffers = {};
        this.audioStreams = new Map(); // Store active audio streams
    }

    async init() {
        await Promise.all([
            this.loadAudio('boing', 'assets/sounds/boing.mp3')
        ]);
    }

    // Load an audio file and store it in the audioBuffers object
    async loadAudio(name, url) {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                url,
                (buffer) => {
                    this.audioBuffers[name] = buffer;
                    resolve(buffer);
                },
                xhr => {
                    console.log(`Loading ${url}: ${Math.floor(100 * xhr.loaded / xhr.total)}%`);
                },
                (err) => reject(err)
            );
        });
    }

    // Play a sound effect without distance (non-directional)
    playSoundEffect(name, options = new SoundProperties()) {
        if (this.audioBuffers[name]) {
            const sound = new THREE.Audio(this.listener);
            sound.setBuffer(this.audioBuffers[name]);
            sound.setVolume(options.volume);
            sound.setLoop(options.loop);

            const node = new AudioNode(sound);
            node.play();
            return node;
        } else {
            console.warn(`Audio buffer '${name}' not found.`);
        }
    }

    // Play a sound effect with directional audio
    playDirectionalSound(name, position, options = new SoundProperties()) {
        if (this.audioBuffers[name]) {
            const sound = new THREE.PositionalAudio(this.listener);
            sound.setBuffer(this.audioBuffers[name]);
            sound.setVolume(options.volume);
            sound.setRefDistance(options.refDistance);
            sound.setLoop(options.loop);

            const node = new AudioNode(sound);
            node.position.copy(position);
            node.play();
            return node;
        } else {
            console.warn(`Audio buffer '${name}' not found.`);
        }
    }

    // Play looping background music
    playMusic(name, options = new SoundProperties()) {
        if (this.audioBuffers[name]) {
            const music = new THREE.Audio(this.listener);
            music.setBuffer(this.audioBuffers[name]);
            music.setVolume(options.volume);
            music.setLoop(options.loop);

            const node = new AudioNode(music, false); // Do not auto-remove music
            node.play();
            return node;
        } else {
            console.warn(`Audio buffer '${name}' not found.`);
        }
    }

    // Add an audio stream for real-time audio (e.g., voice chat)
    addAudioStream(peerId, stream, position, options = new SoundProperties()) {
        if (this.audioStreams.has(peerId)) {
            console.warn(`Audio stream for peer '${peerId}' already exists.`);
            return;
        }

        const positionalAudio = new THREE.PositionalAudio(this.listener);
        positionalAudio.setMediaStreamSource(stream);
        positionalAudio.setVolume(options.volume);
        positionalAudio.setRefDistance(options.refDistance);

        const node = new AudioNode(positionalAudio, false);
        node.position.copy(position);
        this.audioStreams.set(peerId, node);

        return node;
    }

    // Remove an audio stream
    removeAudioStream(peerId) {
        const node = this.audioStreams.get(peerId);
        if (node && node.parent) {
            node.parent.remove(node);
        }
        this.audioStreams.delete(peerId);
    }

    // Update position of an audio stream (e.g., moving peers)
    updateAudioStreamPosition(peerId, position) {
        const node = this.audioStreams.get(peerId);
        if (node) {
            node.position.copy(position);
        }
    }
}

// Integration with PeerJS for Proximity Chat
function setupProximityChat(peer, audioHandler, localStream) {
    peer.on('call', (call) => {
        // Answer the incoming call with the local stream
        call.answer(localStream);

        call.on('stream', (remoteStream) => {
            // Add the remote stream to the audio handler
            const initialPosition = new THREE.Vector3(0, 0, 0); // Replace with actual position logic
            audioHandler.addAudioStream(call.peer, remoteStream, initialPosition);
        });

        call.on('close', () => {
            // Remove the audio stream when the call ends
            audioHandler.removeAudioStream(call.peer);
        });
    });
}

export { AudioHandler, SoundProperties, AudioNode, setupProximityChat };