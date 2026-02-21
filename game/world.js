import * as THREE from 'three';

export const WORLD_SIZE = 100;

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
    renderer.toneMappingExposure = 0.85;

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02030a);
    scene.fog = new THREE.FogExp2(0x02030a, 0.016);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Scene Setup ---
    const lights = buildLighting(scene);
    const floor = buildCircuitFloor(scene);
    const walls = buildBoundaryWalls(scene);
    const skyline = buildCitySkyline(scene);
    const roads = buildNeonRoads(scene);
    const lamps = buildStreetLamps(scene);
    const particles = buildParticles(scene);
    const spawnPlatform = buildSpawnPlatform(scene);
    buildDecorativeArches(scene);

    return { renderer, scene, camera, walls, particles, lights, lamps };
}

// ── Lighting ──────────────────────────────────────────────────────────────────
function buildLighting(scene) {
    const ambient = new THREE.AmbientLight(0x0a0a1f, 2.0);
    scene.add(ambient);

    const moon = new THREE.DirectionalLight(0x2233aa, 0.4);
    moon.position.set(-30, 60, 10);
    moon.castShadow = true;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 200;
    moon.shadow.camera.left = -70;
    moon.shadow.camera.right = 70;
    moon.shadow.camera.top = 70;
    moon.shadow.camera.bottom = -70;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.bias = -0.001;
    scene.add(moon);

    const addPL = (color, intensity, x, y, z, dist = 35) => {
        const l = new THREE.PointLight(color, intensity, dist);
        l.position.set(x, y, z);
        scene.add(l);
        return l;
    };

    const lights = [
        addPL(0x7c3aed, 6, -26, 8, -18),   // about — purple
        addPL(0xf59e0b, 6, 0, 8, -28),   // projects — amber
        addPL(0x06b6d4, 6, 26, 8, -18),   // skills — cyan
        addPL(0x10b981, 6, 0, 8, 26),    // contact — green
        addPL(0xec4899, 3, 0, 6, 0),     // spawn — pink
        addPL(0x4f46e5, 2, -30, 4, 0),     // west accent
        addPL(0x4f46e5, 2, 30, 4, 0),     // east accent
    ];
    return lights;
}

// ── Circuit Board Floor ───────────────────────────────────────────────────────
function buildCircuitFloor(scene) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base dark colour
    ctx.fillStyle = '#04060f';
    ctx.fillRect(0, 0, size, size);

    // Large grid
    ctx.strokeStyle = '#0d1f3c';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i += 32) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Fine circuit traces
    ctx.strokeStyle = '#1a2f5a';
    ctx.lineWidth = 0.8;
    const traceCount = 60;
    for (let t = 0; t < traceCount; t++) {
        let x = Math.floor(Math.random() * 16) * 32;
        let y = Math.floor(Math.random() * 16) * 32;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
            const dir = Math.floor(Math.random() * 4);
            const steps = (Math.floor(Math.random() * 3) + 1) * 32;
            if (dir === 0) x += steps;
            else if (dir === 1) x -= steps;
            else if (dir === 2) y += steps;
            else y -= steps;
            x = Math.max(0, Math.min(size, x));
            y = Math.max(0, Math.min(size, y));
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Glowing node dots
    const nodeCols = ['#4f46e5', '#7c3aed', '#06b6d4', '#ec4899'];
    for (let n = 0; n < 80; n++) {
        const nx = Math.floor(Math.random() * 16) * 32;
        const ny = Math.floor(Math.random() * 16) * 32;
        const col = nodeCols[Math.floor(Math.random() * nodeCols.length)];
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(nx, ny, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);

    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.6,
        metalness: 0.3,
        color: 0xffffff,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Thin bright grid overlay
    const grid = new THREE.GridHelper(WORLD_SIZE, 50, 0x1a2a4a, 0x0a1020);
    grid.position.y = 0.02;
    scene.add(grid);

    return floor;
}

// ── Boundary Walls ────────────────────────────────────────────────────────────
function buildBoundaryWalls(scene) {
    const half = WORLD_SIZE / 2;
    const defs = [
        { pos: [0, 3, -half], size: [WORLD_SIZE, 6, 0.5] },
        { pos: [0, 3, half], size: [WORLD_SIZE, 6, 0.5] },
        { pos: [-half, 3, 0], size: [0.5, 6, WORLD_SIZE] },
        { pos: [half, 3, 0], size: [0.5, 6, WORLD_SIZE] },
    ];

    const mat = new THREE.MeshStandardMaterial({
        color: 0x0d1a30,
        emissive: 0x0a1228,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.9,
    });
    const meshes = [];
    defs.forEach(w => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(...w.size), mat);
        m.position.set(...w.pos); m.castShadow = true;
        scene.add(m);
        meshes.push({ pos: new THREE.Vector3(...w.pos), size: new THREE.Vector3(...w.size) });
    });

    // Neon wall top edges
    const edgeDefs = [
        [[-half, 0.05, -half], [half, 0.05, -half]],
        [[-half, 0.05, half], [half, 0.05, half]],
        [[-half, 0.05, -half], [-half, 0.05, half]],
        [[half, 0.05, -half], [half, 0.05, half]],
    ];
    edgeDefs.forEach(([a, b]) => {
        const pts = [new THREE.Vector3(...a), new THREE.Vector3(...b)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x4f46e5 }));
        scene.add(line);
    });

    return meshes;
}

// ── City Skyline ──────────────────────────────────────────────────────────────
function buildCitySkyline(scene) {
    const half = WORLD_SIZE / 2;
    const group = new THREE.Group();
    const rng = (a, b) => a + Math.random() * (b - a);
    const bColors = [0x0d1a30, 0x081428, 0x0a1020, 0x071525];
    const winColors = [0x1a3a6a, 0x7c3aed, 0x06b6d4, 0xec4899, 0xf59e0b];

    const sides = [
        { count: 22, zOff: -half - 4, zDepth: 12, xRange: WORLD_SIZE * 0.95 },
        { count: 18, zOff: half + 4, zDepth: 12, xRange: WORLD_SIZE * 0.9 },
        { count: 18, xOff: -half - 4, xDepth: 12, zRange: WORLD_SIZE * 0.9 },
        { count: 18, xOff: half + 4, xDepth: 12, zRange: WORLD_SIZE * 0.9 },
    ];

    sides.forEach(side => {
        for (let i = 0; i < side.count; i++) {
            const w = rng(3, 9);
            const h = rng(8, 40);
            const d = rng(3, 9);
            const geo = new THREE.BoxGeometry(w, h, d);
            const mat = new THREE.MeshStandardMaterial({
                color: bColors[Math.floor(Math.random() * bColors.length)],
                roughness: 0.4, metalness: 0.7,
                emissive: 0x050a14, emissiveIntensity: 0.5,
            });
            const m = new THREE.Mesh(geo, mat);

            if (side.zOff !== undefined) {
                m.position.set(rng(-side.xRange / 2, side.xRange / 2), h / 2, side.zOff + rng(-side.zDepth, side.zDepth));
            } else {
                m.position.set(side.xOff + rng(-side.xDepth, side.xDepth), h / 2, rng(-side.zRange / 2, side.zRange / 2));
            }
            m.castShadow = true;
            group.add(m);

            // Windows — small emissive planes dotting the building
            const rows = Math.floor(h / 3);
            const cols = Math.floor(w / 2);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() < 0.4) {
                        const wGeo = new THREE.PlaneGeometry(0.4, 0.4);
                        const wCol = winColors[Math.floor(Math.random() * winColors.length)];
                        const wMat = new THREE.MeshBasicMaterial({ color: wCol });
                        const wm = new THREE.Mesh(wGeo, wMat);
                        wm.position.set(
                            m.position.x - w / 2 + 1 + c * 2,
                            1 + r * 2.5,
                            side.zOff !== undefined ? m.position.z + (side.zOff < 0 ? d / 2 + 0.01 : -d / 2 - 0.01)
                                : m.position.z + 0.01
                        );
                        if (side.xOff !== undefined) {
                            wm.rotation.y = Math.PI / 2;
                            wm.position.x = side.xOff < 0 ? m.position.x + d / 2 + 0.01 : m.position.x - d / 2 - 0.01;
                            wm.position.z = m.position.z - w / 2 + 1 + c * 2;
                        }
                        group.add(wm);
                    }
                }
            }

            // Rooftop antenna
            if (Math.random() < 0.5) {
                const ant = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, rng(1.5, 5), 4),
                    new THREE.MeshBasicMaterial({ color: 0xff4444 })
                );
                ant.position.set(m.position.x, h + rng(0.8, 2.5), m.position.z);
                group.add(ant);
            }
        }
    });

    scene.add(group);
    return group;
}

// ── Neon Roads ────────────────────────────────────────────────────────────────
function buildNeonRoads(scene) {
    // Cross-shaped roads connecting spawn to all 4 zones
    const roadDefs = [
        { from: [0, 0.03, 8], to: [0, 0.03, -22], w: 4 },   // north
        { from: [0, 0.03, 8], to: [0, 0.03, 22], w: 4 },   // south
        { from: [0, 0.03, 0], to: [-20, 0.03, -10], w: 4 },   // NW
        { from: [0, 0.03, 0], to: [20, 0.03, -10], w: 4 },   // NE
    ];

    roadDefs.forEach(r => {
        const from = new THREE.Vector3(...r.from);
        const to = new THREE.Vector3(...r.to);
        const dir = new THREE.Vector3().subVectors(to, from);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

        const geo = new THREE.PlaneGeometry(r.w, len);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x060c1a,
            roughness: 0.8,
            emissive: 0x0a0f20,
            emissiveIntensity: 1,
        });
        const road = new THREE.Mesh(geo, mat);
        road.rotation.x = -Math.PI / 2;
        road.position.copy(mid);
        road.rotation.z = -Math.atan2(dir.z, dir.x) + Math.PI / 2;
        road.rotation.order = 'YXZ';
        road.rotation.x = -Math.PI / 2;
        const angle = Math.atan2(to.x - from.x, to.z - from.z);
        road.rotation.y = angle;
        scene.add(road);

        // Neon edge lines along road
        [-r.w / 2, r.w / 2].forEach(offset => {
            const perp = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle)).multiplyScalar(offset);
            const p1 = from.clone().add(perp);
            const p2 = to.clone().add(perp);
            p1.y = 0.06; p2.y = 0.06;
            const pts = [p1, p2];
            const lg = new THREE.BufferGeometry().setFromPoints(pts);
            scene.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x4f46e5 })));
        });

        // Dashed yellow center line
        for (let t = 0.1; t < 0.9; t += 0.12) {
            const p1 = from.clone().lerp(to, t);
            const p2 = from.clone().lerp(to, t + 0.06);
            p1.y = 0.07; p2.y = 0.07;
            const lg = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            scene.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xf59e0b })));
        }
    });
}

// ── Street Lamps ──────────────────────────────────────────────────────────────
function buildStreetLamps(scene) {
    const lampPositions = [
        // Along north road
        [-2.5, 0, -8], [2.5, 0, -8],
        [-2.5, 0, -15], [2.5, 0, -15],
        // Along south road
        [-2.5, 0, 14], [2.5, 0, 14],
        // Along NW road
        [-9, 0, -4], [-14, 0, -7],
        // Along NE road
        [9, 0, -4], [14, 0, -7],
        // Extras around zones
        [-22, 0, -12], [-22, 0, -24],
        [22, 0, -12], [22, 0, -24],
        [-8, 0, -26], [8, 0, -26],
    ];

    const lamps = [];
    lampPositions.forEach(([lx, , lz]) => {
        const group = new THREE.Group();

        // Pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 5, 6),
            new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.9, roughness: 0.3 })
        );
        pole.position.y = 2.5;
        group.add(pole);

        // Arm
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.07, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.9, roughness: 0.3 })
        );
        arm.position.set(0, 5.1, -0.6);
        group.add(arm);

        // Globe
        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0x7c3aed,
                emissive: 0x7c3aed,
                emissiveIntensity: 3,
            })
        );
        globe.position.set(0, 5.1, -1.2);
        group.add(globe);

        // Point light from globe
        const pl = new THREE.PointLight(0x7c3aed, 2.5, 12);
        pl.position.copy(globe.position);
        group.add(pl);

        group.position.set(lx, 0, lz);
        scene.add(group);
        lamps.push({ group, globe, pl });
    });
    return lamps;
}

// ── Atmospheric Particles ─────────────────────────────────────────────────────
function buildParticles(scene) {
    // Layer 1: floating dust (purple)
    const makeParticles = (count, color, sizeRange, yRange, opacity) => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
            positions[i * 3 + 1] = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
            positions[i * 3 + 2] = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
            sizes[i] = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color, size: sizeRange[0], transparent: true, opacity, sizeAttenuation: true });
        const pts = new THREE.Points(geo, mat);
        scene.add(pts);
        return pts;
    };

    const p1 = makeParticles(600, 0x7c3aed, [0.08, 0.18], [0.1, 12], 0.5);
    const p2 = makeParticles(300, 0x06b6d4, [0.06, 0.14], [3, 20], 0.4);
    const p3 = makeParticles(150, 0xec4899, [0.10, 0.20], [0.1, 6], 0.6);

    return { p1, p2, p3 };
}

// ── Spawn Platform ────────────────────────────────────────────────────────────
function buildSpawnPlatform(scene) {
    // Hexagonal base
    for (let ring = 0; ring < 3; ring++) {
        const r = 2.2 + ring * 1.8;
        const geo = new THREE.RingGeometry(r, r + 0.08, 64);
        const mat = new THREE.MeshBasicMaterial({
            color: ring === 0 ? 0xec4899 : ring === 1 ? 0x7c3aed : 0x4f46e5,
            transparent: true, opacity: 0.6 - ring * 0.15,
            side: THREE.DoubleSide,
        });
        const ring3d = new THREE.Mesh(geo, mat);
        ring3d.rotation.x = -Math.PI / 2;
        ring3d.position.y = 0.04 + ring * 0.01;
        scene.add(ring3d);
    }

    // Central glowing disk
    const diskGeo = new THREE.CircleGeometry(1.8, 64);
    const diskMat = new THREE.MeshBasicMaterial({ color: 0x1a0030, transparent: true, opacity: 0.7 });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.03;
    scene.add(disk);

    // Holographic pillar (thin tall cylinder at origin)
    const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.15 })
    );
    pillar.position.set(0, 6, 0);
    scene.add(pillar);

    // Diamond top marker
    const oct = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.4),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 3 })
    );
    oct.position.set(0, 12.5, 0);
    scene.add(oct);

    return { disk, pillar, oct };
}

// ── Decorative Arch Gates ─────────────────────────────────────────────────────
function buildDecorativeArches(scene) {
    // Arch gates at road entries to zones
    const archPositions = [
        { pos: [0, 0, -4], rotY: 0 },     // north entry
    ];

    archPositions.forEach(({ pos, rotY }) => {
        const group = new THREE.Group();
        // Left post
        group.add(makePillar([-2.5, 0, 0], 8, 0x4f46e5));
        // Right post
        group.add(makePillar([2.5, 0, 0], 8, 0x4f46e5));
        // Top bar
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 0.25, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x4f46e5, emissive: 0x4f46e5, emissiveIntensity: 2 })
        );
        top.position.y = 8;
        group.add(top);

        group.position.set(...pos);
        group.rotation.y = rotY;
        scene.add(group);
    });
}

function makePillar(pos, height, color) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, height, 0.2),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.9 })
    );
    m.position.set(pos[0], height / 2, pos[2]);
    return m;
}

// ── Animate ───────────────────────────────────────────────────────────────────
export function animateWorld(particles, lights, lamps, t) {
    // Drift particles
    const drift = (pts, speed, limit) => {
        const pos = pts.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i + 1] += speed;
            if (pos[i + 1] > limit) pos[i + 1] = 0.1;
        }
        pts.geometry.attributes.position.needsUpdate = true;
    };
    drift(particles.p1, 0.009, 14);
    drift(particles.p2, 0.006, 22);
    drift(particles.p3, 0.012, 7);
    particles.p1.rotation.y += 0.0001;
    particles.p2.rotation.y -= 0.0002;

    // Pulse zone lights
    lights.forEach((light, i) => {
        light.intensity = 5 + Math.sin(t * 1.5 + i * 1.1) * 2;
    });

    // Flicker street lamps
    lamps.forEach((lamp, i) => {
        const flicker = 2.2 + Math.sin(t * 3 + i * 2.3) * 0.5;
        lamp.pl.intensity = flicker;
        lamp.globe.material.emissiveIntensity = flicker;
    });
}
