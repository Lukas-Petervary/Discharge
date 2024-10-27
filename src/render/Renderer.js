export class Renderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.sceneRenderer = new THREE.WebGLRenderer({ antialias: true });

        this.objects = [];
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

    // Create Skybox
    skyBox(name){
        //makes the sky Sphere
        const skyGeometry = new THREE.SphereGeometry(1000, 25, 25);
        skyGeometry.scale(-1,1,1);
        
        // Load the texture
        const texture = new THREE.TextureLoader().load('assets/terrain/Skyboxes/' + name);

        // Create a Phong material for the skybox with the loaded texture
        const skyMaterial = new THREE.MeshPhongMaterial({
            map: texture
        });

        // Create the skybox mesh
        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);

        // Ensure the skybox is rendered on the inside of the sphere
      
        this.scene.add(this.skybox);
    }

    updateSkyboxPosition() {
      if(this.skybox)
        this.skybox.position.copy(this.camera.position);
    }
  
    render() {
        this.updateSkyboxPosition();
        this.sceneRenderer.render(this.scene, this.camera);
    }
}
