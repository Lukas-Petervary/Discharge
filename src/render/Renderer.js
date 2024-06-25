export class Renderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

export { Shape, Cube, Sphere, Cylinder, Capsule };

// Shape class - Parent class
class Shape {
    constructor(position) {
        this.position = position || new THREE.Vector3(); // Default position
        this.textureLocation = null; // Default texture location (none)
    }

    // Method to set texture location
    setTexture(textureLocation) {
        this.textureLocation = textureLocation;
    }

    // Method to add shape to scene (abstract method to be overridden by child classes)
    addToScene(scene) {
        throw new Error('Method not implemented');
    }
}

// Cube class - Inherits from Shape
class Cube extends Shape {
    constructor(size, position) {
        super(position);
        this.size = size || 1; // Default size
    }

    // Method to create and add cube to scene
    addToScene(scene) {
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        let material;

        if (this.textureLocation) {
            const texture = new THREE.TextureLoader().load(this.textureLocation);
            material = new THREE.MeshBasicMaterial({ map: texture });
        } else {
            material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        }

        const cube = new THREE.Mesh(geometry, material);
        cube.position.copy(this.position);
        scene.add(cube);
    }
}

// Sphere class - Inherits from Shape
class Sphere extends Shape {
    constructor(radius, position) {
        super(position);
        this.radius = radius || 1; // Default radius
    }

    // Method to create and add sphere to scene
    addToScene(scene) {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        let material;

        if (this.textureLocation) {
            const texture = new THREE.TextureLoader().load(this.textureLocation);
            material = new THREE.MeshBasicMaterial({ map: texture });
        } else {
            material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        }

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(this.position);
        scene.add(sphere);
    }
}

// Cylinder class - Inherits from Shape
class Cylinder extends Shape {
    constructor(radiusTop, radiusBottom, height, radialSegments, heightSegments, position) {
        super(position);
        this.radiusTop = radiusTop || 0.5; // Default top radius
        this.radiusBottom = radiusBottom || 0.5; // Default bottom radius
        this.height = height || 1; // Default height
        this.radialSegments = radialSegments || 32; // Default radial segments
        this.heightSegments = heightSegments || 1; // Default height segments
    }

    // Method to create and add cylinder to scene
    addToScene(scene) {
        const geometry = new THREE.CylinderGeometry(this.radiusTop, this.radiusBottom, this.height, this.radialSegments, this.heightSegments);
        let material;

        if (this.textureLocation) {
            const texture = new THREE.TextureLoader().load(this.textureLocation);
            material = new THREE.MeshBasicMaterial({ map: texture });
        } else {
            material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        }

        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.copy(this.position);
        scene.add(cylinder);
    }
}

// Capsule class - Inherits from Sphere and Cylinder
class Capsule extends Shape {
    constructor(radiusTop, radiusBottom, height, radialSegments, heightSegments, position) {
        super(position);

        this.radiusTop = radiusTop || 0.5; // Default top radius
        this.radiusBottom = radiusBottom || 0.5; // Default bottom radius
        this.height = height || 1; // Default height
        this.radialSegments = radialSegments || 32; // Default radial segments
        this.heightSegments = heightSegments || 1; // Default height segments

        this.createCapsule();
    }

    // Method to create capsule geometry and material
    createCapsule() {
        // Create sphere geometry and material
        const sphereGeometry = new THREE.SphereGeometry(this.radiusTop, this.radialSegments, this.heightSegments);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        // Create cylinder geometry and material
        const cylinderGeometry = new THREE.CylinderGeometry(this.radiusTop, this.radiusBottom, this.height, this.radialSegments, this.heightSegments);
        const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        // Position the sphere and cylinder relative to the capsule's position
        sphereGeometry.translate(0, this.height / 2 + this.radiusTop, 0); // Place sphere on top
        cylinderGeometry.translate(0, this.height / 2, 0); // Place cylinder in the middle

        // Merge geometries
        const capsuleGeometry = new THREE.Geometry();
        capsuleGeometry.merge(sphereGeometry);
        capsuleGeometry.merge(cylinderGeometry);

        // Create mesh with the combined geometry and material
        this.mesh = new THREE.Mesh(capsuleGeometry, [sphereMaterial, cylinderMaterial]);
        this.mesh.position.copy(this.position);
    }

    // Method to set texture for both sphere and cylinder parts of capsule
    setTexture(textureLocation) {
        const texture = new THREE.TextureLoader().load(textureLocation);
        this.mesh.material.forEach(material => {
            material.map = texture;
            material.needsUpdate = true;
        });
    }

    // Method to add capsule to scene
    addToScene(scene) {
        scene.add(this.mesh);
    }
}
