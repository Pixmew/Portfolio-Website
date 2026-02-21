import * as THREE from 'three';

export const WORLD_SIZE = 100;

export function createWorld() {
    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // sky blue
    scene.fog = new THREE.Fog(0xc9e8f5, 60, 130);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Build world ---
    const lights = buildLighting(scene);
    const floor = buildGrassFloor(scene);
    const walls = buildBoundaryWalls(scene);
    const trees = buildTrees(scene);
    const paths = buildStonePaths(scene);
    const particles = buildParticles(scene);  // fireflies + petals
    buildMountains(scene);
    buildSpawnClearning(scene);

    return { renderer, scene, camera, walls, particles, lights, lamps: [] };
}

// ── Lighting ──────────────────────────────────────────────────────────────────
function buildLighting(scene) {
    // Bright ambient (daytime sky)
    const ambient = new THREE.AmbientLight(0xfff5e0, 2.0);
    scene.add(ambient);

    // Main sun - warm, bright, angled
    const sun = new THREE.DirectionalLight(0xfff2cc, 3.5);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Fill light (softer, cooler - sky bounce)
    const fill = new THREE.DirectionalLight(0xb0d4f1, 0.8);
    fill.position.set(-20, 30, -15);
    scene.add(fill);

    // Zone accent lights - soft, warm tones
    const addPL = (color, intensity, x, y, z, dist = 30) => {
        const l = new THREE.PointLight(color, intensity, dist);
        l.position.set(x, y, z);
        scene.add(l);
        return l;
    };
    const lights = [
        addPL(0xffe8a0, 3, -26, 5, -18),   // about — golden
        addPL(0xffd580, 3, 0, 5, -30),     // projects — warm amber
        addPL(0xa8d8a8, 3, 26, 5, -18),    // skills — green glow
        addPL(0xffc5b0, 3, 0, 5, 26),      // contact — rose tint
    ];
    return lights;
}

// ── Grass Floor ───────────────────────────────────────────────────────────────
function buildGrassFloor(scene) {
    // Canvas grass texture
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base green
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(0, 0, size, size);

    // Variation patches
    const patches = [
        '#5a8f4a', '#3d6e34', '#52854a', '#4e8042', '#3a6930'
    ];
    for (let i = 0; i < 400; i++) {
        ctx.fillStyle = patches[Math.floor(Math.random() * patches.length)];
        const pw = 10 + Math.random() * 40;
        const ph = 8 + Math.random() * 30;
        ctx.fillRect(Math.random() * size, Math.random() * size, pw, ph);
    }

    // Fine grass blades
    for (let g = 0; g < 1500; g++) {
        ctx.strokeStyle = `rgba(${30 + Math.random() * 60},${80 + Math.random() * 60},${20 + Math.random() * 30},0.4)`;
        ctx.lineWidth = 1;
        const gx = Math.random() * size;
        const gy = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (Math.random() - 0.5) * 4, gy - 6 - Math.random() * 6);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);

    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    return floor;
}

// ── Boundary Hedge Walls ──────────────────────────────────────────────────────
function buildBoundaryWalls(scene) {
    const half = WORLD_SIZE / 2;
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1b, roughness: 1, metalness: 0 });
    const defs = [
        { pos: [0, 1.5, -half], size: [WORLD_SIZE, 3, 2] },
        { pos: [0, 1.5, half], size: [WORLD_SIZE, 3, 2] },
        { pos: [-half, 1.5, 0], size: [2, 3, WORLD_SIZE] },
        { pos: [half, 1.5, 0], size: [2, 3, WORLD_SIZE] },
    ];
    const walls = [];
    defs.forEach(w => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(...w.size), hedgeMat);
        m.position.set(...w.pos);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        walls.push({ pos: new THREE.Vector3(...w.pos), size: new THREE.Vector3(...w.size) });
    });
    return walls;
}

// ── Trees ─────────────────────────────────────────────────────────────────────
function buildTrees(scene) {
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9, metalness: 0 });
    const leafColors = [0x2d7a2d, 0x3a8f3a, 0x228b22, 0x4caf50, 0x1e7e1e];

    const positions = [
        // Border trees
        ...Array.from({ length: 14 }, (_, i) => [-48 + i * 7, 0, -48]),
        ...Array.from({ length: 14 }, (_, i) => [-48 + i * 7, 0, 48]),
        ...Array.from({ length: 12 }, (_, i) => [-48, 0, -42 + i * 7]),
        ...Array.from({ length: 12 }, (_, i) => [48, 0, -42 + i * 7]),
        // Scattered interior
        [-35, 0, 10], [-32, 0, -5], [35, 0, 8], [33, 0, -6],
        [-38, 0, 20], [38, 0, 22], [-15, 0, 35], [15, 0, 35],
        [-35, 0, -32], [35, 0, -32],
    ];

    positions.forEach(([tx, , tz]) => {
        const h = 4 + Math.random() * 5;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, h, 7),
            trunkMat
        );
        trunk.position.set(tx, h / 2, tz);
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Layered foliage (2-3 cones)
        const leafLayers = 2 + Math.floor(Math.random() * 2);
        const leafCol = leafColors[Math.floor(Math.random() * leafColors.length)];
        const leafMat = new THREE.MeshStandardMaterial({ color: leafCol, roughness: 0.9, metalness: 0 });
        for (let l = 0; l < leafLayers; l++) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(2.2 - l * 0.4, 2.5 + l * 0.5, 8),
                leafMat
            );
            cone.position.set(tx, h + 1.2 + l * 1.5, tz);
            cone.castShadow = true;
            treeGroup.add(cone);
        }
    });

    scene.add(treeGroup);
    return treeGroup;
}

// ── Stone Paths ───────────────────────────────────────────────────────────────
function buildStonePaths(scene) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.95, metalness: 0 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 1, metalness: 0 });

    // Cross-shaped paths
    const pathDefs = [
        { from: [0, 0, 8], to: [0, 0, -22], w: 3.5 },
        { from: [0, 0, 8], to: [0, 0, 22], w: 3.5 },
        { from: [0, 0, 0], to: [-20, 0, -10], w: 3.5 },
        { from: [0, 0, 0], to: [20, 0, -10], w: 3.5 },
    ];

    pathDefs.forEach(r => {
        const from = new THREE.Vector3(...r.from);
        const to = new THREE.Vector3(...r.to);
        const len = from.distanceTo(to);
        const mid = from.clone().lerp(to, 0.5);
        const angle = Math.atan2(to.x - from.x, to.z - from.z);

        // Stone base slab
        const slab = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.08, len), stoneMat);
        slab.position.set(mid.x, 0.04, mid.z);
        slab.rotation.y = angle;
        slab.receiveShadow = true;
        scene.add(slab);

        // Individual stepping stones on path
        const steps = Math.floor(len / 1.5);
        for (let s = 0; s < steps; s++) {
            const t = (s + 0.5) / steps;
            const sp = from.clone().lerp(to, t);
            const offset = (Math.random() - 0.5) * (r.w * 0.5);
            const stone = new THREE.Mesh(
                new THREE.BoxGeometry(0.7 + Math.random() * 0.5, 0.06, 0.7 + Math.random() * 0.4),
                edgeMat
            );
            stone.position.set(sp.x + Math.cos(angle + Math.PI / 2) * offset, 0.07, sp.z + Math.sin(angle + Math.PI / 2) * offset);
            stone.rotation.y = angle + (Math.random() - 0.5) * 0.5;
            stone.receiveShadow = true;
            scene.add(stone);
        }
    });
}

// ── Mountains (distant backdrop) ──────────────────────────────────────────────
function buildMountains(scene) {
    const mtMat = new THREE.MeshStandardMaterial({ color: 0x7aab6e, roughness: 1, metalness: 0 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xeef5ee, roughness: 1, metalness: 0 });

    const peaks = [
        [-70, 0, -80], [-45, 0, -90], [-20, 0, -85], [10, 0, -90],
        [40, 0, -85], [65, 0, -80], [80, 0, -70],
        [-80, 0, 0], [80, 0, 10],
    ];
    peaks.forEach(([mx, , mz]) => {
        const h = 25 + Math.random() * 30;
        const r = 15 + Math.random() * 15;
        const mt = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mtMat);
        mt.position.set(mx, h / 2 - 2, mz);
        scene.add(mt);
        // Snow cap
        const snow = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, h * 0.28, 8), snowMat);
        snow.position.set(mx, h * 0.72 + h / 2 - 2, mz);
        scene.add(snow);
    });
}

// ── Spawn Clearing ────────────────────────────────────────────────────────────
function buildSpawnClearning(scene) {
    // Circular wooden platform at spawn
    const platformMat = new THREE.MeshStandardMaterial({ color: 0xa0704a, roughness: 0.8, metalness: 0 });
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.2, 20), platformMat);
    platform.position.y = 0.1;
    platform.receiveShadow = true;
    scene.add(platform);

    // Wooden plank lines
    for (let i = 0; i < 7; i++) {
        const plank = new THREE.Mesh(
            new THREE.BoxGeometry(6.8, 0.04, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x8a5c35, roughness: 0.9, metalness: 0 })
        );
        plank.position.set(0, 0.21, -3 + i);
        scene.add(plank);
    }

    // Ring of flowers around platform
    for (let f = 0; f < 18; f++) {
        const a = (f / 18) * Math.PI * 2;
        const flowerMat = new THREE.MeshStandardMaterial({
            color: [0xff6b6b, 0xffd93d, 0xffa07a, 0xff8c69, 0xffb347][f % 5],
            roughness: 0.8
        });
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), flowerMat);
        flower.position.set(Math.cos(a) * 4.2, 0.35, Math.sin(a) * 4.2);
        scene.add(flower);
    }

    // Sign post at spawn
    const postMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.5, 8), postMat);
    post.position.set(0, 1.25, 3.8);
    scene.add(post);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.12), new THREE.MeshStandardMaterial({ color: 0xd4a56a, roughness: 0.8 }));
    sign.position.set(0, 2.6, 3.8);
    scene.add(sign);
}

// ── Particles (fireflies + petals) ────────────────────────────────────────────
function buildParticles(scene) {
    const makeParticles = (count, color, size, yRange, opacity) => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
            pos[i * 3 + 1] = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
            pos[i * 3 + 2] = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true }));
        scene.add(pts);
        return pts;
    };
    const p1 = makeParticles(200, 0xffff88, 0.18, [0.2, 5], 0.85); // fireflies (yellow)
    const p2 = makeParticles(150, 0xffb6c1, 0.13, [0.1, 3], 0.7);  // flower petals (pink)
    const p3 = makeParticles(100, 0xffffff, 0.10, [1, 10], 0.4);   // light motes
    return { p1, p2, p3 };
}

// ── Animate ───────────────────────────────────────────────────────────────────
export function animateWorld(particles, lights, lamps, t) {
    // Fireflies drift and sway
    const drift = (pts, speed, amp, limit) => {
        const pos = pts.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += Math.sin(t * 0.7 + i) * amp;
            pos[i + 1] += speed;
            pos[i + 2] += Math.cos(t * 0.5 + i) * amp;
            if (pos[i + 1] > limit) pos[i + 1] = 0.2;
        }
        pts.geometry.attributes.position.needsUpdate = true;
    };
    drift(particles.p1, 0.005, 0.008, 5);  // fireflies - slow drift
    drift(particles.p2, 0.012, 0.004, 3);  // petals - float down
    drift(particles.p3, 0.003, 0.002, 10);

    // Twinkle fireflies intensity
    particles.p1.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;

    // Gently pulse zone lights
    lights.forEach((light, i) => {
        light.intensity = 2.5 + Math.sin(t * 0.8 + i * 1.5) * 0.5;
    });
}
