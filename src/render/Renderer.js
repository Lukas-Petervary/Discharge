export class Renderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1, 0);
        this.sceneRenderer = new THREE.WebGLRenderer({ antialias: true });

        this.objects = [];

        this.init();
    };

    init() {
        this.sceneRenderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.sceneRenderer.domElement);
        this.handleResize();
        this.skyBox('SkySkybox.png');
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.sceneRenderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Create Skybox
    skyBox(name){
        //makes the sky Sphere
        const skyGeometry = new THREE.SphereGeometry(1000, 25, 25);

        // Load the texture
        const texture = new THREE.TextureLoader().load('../../assets/terrain/Skyboxes/' + name);

        // Create a Phong material for the skybox with the loaded texture
        const skyMaterial = new THREE.MeshPhongMaterial({
            map: texture
        });

        // Create the skybox mesh
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);

        // Ensure the skybox is rendered on the inside of the sphere
        skybox.material.side = THREE.BackSide;
    }

    render() {
        this.sceneRenderer.render(this.scene, this.camera);
    }
}