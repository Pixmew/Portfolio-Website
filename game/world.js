import * as THREE from 'three';

export const WORLD_SIZE = 80;

export function createWorld() {
    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04050a);
    scene.fog = new THREE.FogExp2(0x04050a, 0.022);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 16, 18);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Lights ---
    const ambient = new THREE.AmbientLight(0x1a0a2e, 1.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0x7c3aed, 0.6);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    // Colored point lights for atmosphere
    const addPointLight = (color, intensity, x, y, z) => {
        const light = new THREE.PointLight(color, intensity, 30);
        light.position.set(x, y, z);
        scene.add(light);
        return light;
    };
    const lights = [
        addPointLight(0x7c3aed, 4, -30, 5, -25),   // purple — about zone
        addPointLight(0x06b6d4, 4, 30, 5, -25),    // cyan — skills zone
        addPointLight(0xf59e0b, 4, 0, 5, -35),     // amber — projects zone
        addPointLight(0x10b981, 4, 0, 5, 30),      // green — contact
        addPointLight(0xec4899, 2, 0, 8, 0),       // pink — center
    ];

    // --- Floor ---
    const floorGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x080b14,
        roughness: 0.8,
        metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid lines on floor
    const gridHelper = new THREE.GridHelper(WORLD_SIZE, 40, 0x1e1b4b, 0x0d1117);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // --- Boundary Walls (invisible collision) ---
    const walls = buildBoundaryWalls(scene);

    // --- Particles ---
    const particles = buildParticles(scene);

    // --- Glow Rings (decorative) ---
    buildDecorativeRings(scene);

    return { renderer, scene, camera, walls, particles, lights };
}

function buildBoundaryWalls(scene) {
    const half = WORLD_SIZE / 2;
    const wallDefs = [
        { pos: [0, 2, -half], size: [WORLD_SIZE, 4, 0.5] },   // north
        { pos: [0, 2, half],  size: [WORLD_SIZE, 4, 0.5] },   // south
        { pos: [-half, 2, 0], size: [0.5, 4, WORLD_SIZE] },   // west
        { pos: [half, 2, 0],  size: [0.5, 4, WORLD_SIZE] },   // east
    ];

    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        roughness: 0.5,
        metalness: 0.8,
        emissive: 0x140e35,
        emissiveIntensity: 0.4,
    });

    const wallMeshes = [];
    wallDefs.forEach(w => {
        const geo = new THREE.BoxGeometry(...w.size);
        const mesh = new THREE.Mesh(geo, wallMat);
        mesh.position.set(...w.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        wallMeshes.push({ mesh, pos: new THREE.Vector3(...w.pos), size: new THREE.Vector3(...w.size) });
    });

    // Glowing wall edges (neon trim)
    const edgePositions = [
        { from: [-half, 0.1, -half], to: [half, 0.1, -half] },
        { from: [-half, 0.1, half],  to: [half, 0.1, half] },
        { from: [-half, 0.1, -half], to: [-half, 0.1, half] },
        { from: [half, 0.1, -half],  to: [half, 0.1, half] },
    ];
    edgePositions.forEach(({ from, to }) => {
        const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x4f46e5, linewidth: 2 });
        scene.add(new THREE.Line(geo, mat));
    });

    return wallMeshes;
}

function buildParticles(scene) {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const half = WORLD_SIZE / 2 - 2;
    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
        positions[i * 3 + 1] = Math.random() * 10 + 0.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0x7c3aed,
        size: 0.12,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
    return particles;
}

function buildDecorativeRings(scene) {
    const ringMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, side: THREE.DoubleSide });

    // Central spawn ring
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.5, 3.0, 64),
        ringMat(0xec4899)
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    scene.add(ring);

    const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(1.0, 1.4, 64),
        ringMat(0x7c3aed)
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.05;
    scene.add(innerRing);
}

export function animateWorld(particles, lights, t) {
    // Drift particles slowly upward and loop
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.008;
        if (positions[i + 1] > 12) positions[i + 1] = 0.2;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.0002;

    // Pulse point lights
    lights.forEach((light, idx) => {
        light.intensity = 3 + Math.sin(t * 1.2 + idx * 1.5) * 1.2;
    });
}
