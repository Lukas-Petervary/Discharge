import * as THREE from 'three';

export class Renderer {
    constructor() {
        this.clock = new THREE.Clock();
        this.time = {
            subTickTime: 0,
            deltaTime: 0,
            lastTick: 0
        };
        this.scene = new THREE.Scene();
        this.audioListener = new THREE.AudioListener();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.sceneRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });

        this.skybox = null;

        this.init();
    };

    init() {
        this.sceneRenderer.outputEncoding = THREE.sRGBEncoding;
        this.sceneRenderer.gammaFactor = 2.2;
        this.sceneRenderer.shadowMap.enabled = true;
        this.sceneRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.sceneRenderer.setPixelRatio(window.devicePixelRatio);
        this.sceneRenderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.sceneRenderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.sceneRenderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
        this.skyBox('SkySkybox.png');
    }

    skyBox(name){
        const skyGeometry = new THREE.SphereGeometry(1000, 25, 25);
        skyGeometry.scale(-1,1,1);

        const texture = new THREE.TextureLoader().load('assets/terrain/Skyboxes/' + name);

        const skyMaterial = new THREE.MeshPhongMaterial({
            map: texture
        });

        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skybox);
    }

    updateSkyboxPosition() {
      if(this.skybox)
          this.skybox.position.copy(this.camera.position);
    }



    render(dt) {
        this.updateSkyboxPosition();
        g_world.objects.forEach(obj => obj.render(dt, this.time.subTickTime / g_world.TICK_RATE));
        this.sceneRenderer.render(this.scene, this.camera);
    }
}