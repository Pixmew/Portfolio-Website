import * as THREE from 'three';

const INTERACT_DIST = 7.0;

const ZONE_DEFS = [
    { id: 'about', label: 'About Me', icon: '🌿', color: 0xd4a017, pos: [-26, 0, -18], size: [13, 0, 10] },
    { id: 'projects', label: 'My Projects', icon: '🎮', color: 0xe07b39, pos: [0, 0, -30], size: [20, 0, 10] },
    { id: 'skills', label: 'My Skills', icon: '⭐', color: 0x4caf50, pos: [26, 0, -18], size: [13, 0, 10] },
    { id: 'contact', label: 'Contact Me', icon: '📬', color: 0xe74c3c, pos: [0, 0, 26], size: [13, 0, 10] },
];

export function createZones(scene) {
    const zones = [], colliders = [];

    ZONE_DEFS.forEach(def => {
        const group = new THREE.Group();
        group.position.set(...def.pos);

        let elements;
        if (def.id === 'about') elements = buildAboutZone(group, def);
        if (def.id === 'projects') elements = buildProjectsZone(group, def);
        if (def.id === 'skills') elements = buildSkillsZone(group, def);
        if (def.id === 'contact') elements = buildContactZone(group, def);

        const sprite = makeLabelSprite(def.icon + '  ' + def.label, def.color);
        sprite.position.set(0, elements.labelY || 8, 0);
        sprite.scale.set(9, 2.2, 1);
        group.add(sprite);

        const zoneLight = new THREE.PointLight(def.color, 2.0, 22);
        zoneLight.position.set(0, 4, 0);
        group.add(zoneLight);

        scene.add(group);
        zones.push({ id: def.id, label: def.label, icon: def.icon, color: def.color, group, zoneLight, sprite, pos: new THREE.Vector3(...def.pos), interactDist: INTERACT_DIST, elements });
        colliders.push({ id: def.id, x: def.pos[0], z: def.pos[2], halfSize: new THREE.Vector3(def.size[0] / 2 + 0.5, 0, def.size[2] / 2 + 0.5) });
    });

    return { zones, colliders };
}

// ── Shared materials ──────────────────────────────────────────────────────────
const woodMat = () => new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9, metalness: 0 });
const darkWood = () => new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9, metalness: 0 });
const stoneMat = () => new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.95, metalness: 0 });
const roofMat = () => new THREE.MeshStandardMaterial({ color: 0x8b2222, roughness: 0.9, metalness: 0 });
const whiteMat = () => new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.7, metalness: 0 });

// ── ABOUT — Cosy Wooden Cabin ─────────────────────────────────────────────────
function buildAboutZone(group, def) {
    // Stone foundation slab
    const slab = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 9), new THREE.MeshStandardMaterial({ color: 0x999080, roughness: 1 }));
    slab.position.y = 0.15; slab.receiveShadow = true;
    group.add(slab);

    // Cabin walls
    const wall = new THREE.Mesh(new THREE.BoxGeometry(7, 3.5, 5.5), whiteMat());
    wall.position.set(0, 2.0, 0); wall.castShadow = true; wall.receiveShadow = true;
    group.add(wall);

    // Roof (prism shape via CylinderGeometry triangular)
    const roofGeo = new THREE.CylinderGeometry(0, 5.0, 2.5, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat());
    roof.position.set(0, 4.5, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), stoneMat());
    chimney.position.set(2.2, 4.8, -1); chimney.castShadow = true;
    group.add(chimney);

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.1), darkWood());
    door.position.set(0, 1.2, 2.8);
    group.add(door);

    // Windows with bright yellow glow (lit from inside)
    [[-2.5, 2.0, 2.8], [2.5, 2.0, 2.8]].forEach(([wx, wy, wz]) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0xffe680, emissive: 0xffe680, emissiveIntensity: 0.8 }));
        win.position.set(wx, wy, wz);
        group.add(win);
    });

    // Porch posts
    [[-3.2, 0, 3.2], [3.2, 0, 3.2]].forEach(([px, , pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 3.5, 8), woodMat());
        post.position.set(px, 1.75, pz); post.castShadow = true;
        group.add(post);
    });
    const porchRail = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 0.1), woodMat());
    porchRail.position.set(0, 3.2, 3.2);
    group.add(porchRail);

    // Garden flowers in front
    const flowerCols = [0xff6b6b, 0xffd93d, 0xff85a1, 0xffb347];
    for (let f = 0; f < 12; f++) {
        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 6, 6),
            new THREE.MeshStandardMaterial({ color: flowerCols[f % 4], roughness: 0.8 })
        );
        flower.position.set(-5 + (f % 6) * 2, 0.5, 3.8 + Math.floor(f / 6) * 0.8);
        group.add(flower);
        // Stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 4), new THREE.MeshStandardMaterial({ color: 0x2d8a2d }));
        stem.position.set(flower.position.x, 0.28, flower.position.z);
        group.add(stem);
    }

    // Info board near cabin
    addInfoBoard(group, 'ABOUT ME', def.color, [-5, 0, -3]);

    return { labelY: 7.2 };
}

// ── PROJECTS — Outdoor Gallery with Boards ────────────────────────────────────
function buildProjectsZone(group, def) {
    // Wide grass platform with stone border
    const base = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x5a8040, roughness: 1 }));
    base.position.y = 0.1; base.receiveShadow = true;
    group.add(base);

    // Stone path down center
    const path = new THREE.Mesh(new THREE.BoxGeometry(3, 0.09, 10), new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 1 }));
    path.position.y = 0.15;
    group.add(path);

    // 4 display boards/frames (like an art fair)
    const boardPositions = [[-7.5, 0, -2], [-2.5, 0, -2], [2.5, 0, -2], [7.5, 0, -2]];
    const boardColors = [0x3498db, 0xe74c3c, 0x9b59b6, 0x27ae60];

    boardPositions.forEach(([bx, , bz], i) => {
        // Post supports
        [[-0.8, 0], [0.8, 0]].forEach(([px]) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.5, 8), woodMat());
            post.position.set(bx + px, 2.25, bz); post.castShadow = true;
            group.add(post);
        });

        // Display board (bright background)
        const board = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 2.0, 0.12),
            new THREE.MeshStandardMaterial({ color: 0xfffde7, roughness: 0.5 })
        );
        board.position.set(bx, 3.0, bz + 0.06); board.castShadow = true;
        group.add(board);

        // Coloured header bar on board
        const header = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.4, 0.14),
            new THREE.MeshStandardMaterial({ color: boardColors[i], roughness: 0.5 })
        );
        header.position.set(bx, 3.85, bz + 0.07);
        group.add(header);

        // Frame border
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 2.2, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.8 })
        );
        frame.position.set(bx, 3.0, bz - 0.01);
        group.add(frame);

        // Connecting top bar between posts
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.15), woodMat());
        topBar.position.set(bx, 4.5, bz);
        group.add(topBar);
    });

    // Decorative bunting / banner between posts
    for (let b = -8.5; b < 9; b += 1.2) {
        const flag = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.04),
            new THREE.MeshStandardMaterial({ color: [0xe74c3c, 0xf39c12, 0x3498db, 0x2ecc71][Math.floor(Math.random() * 4)], roughness: 0.7 })
        );
        flag.position.set(b, 4.8 + Math.sin(b * 0.7) * 0.3, -3.5);
        flag.rotation.z = (Math.random() - 0.5) * 0.5;
        group.add(flag);
    }

    // Border fence
    for (let fx = -9.5; fx <= 9.5; fx += 2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6), woodMat());
        post.position.set(fx, 0.6, 4.5); group.add(post);
    }
    const fence = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 0.1), woodMat());
    fence.position.set(0, 1.1, 4.5); group.add(fence);

    // Large "PROJECTS" sign arch
    [[-9, 0, 0], [9, 0, 0]].forEach(([px, , pz]) => {
        const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 6, 8), woodMat());
        arch.position.set(px, 3, pz); group.add(arch);
    });
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.3, 0.3), woodMat());
    archTop.position.set(0, 6.1, 0); group.add(archTop);

    addInfoBoard(group, 'PROJECTS', def.color, [8, 0, 3.5]);

    return { labelY: 8 };
}

// ── SKILLS — Stone Circle Garden ──────────────────────────────────────────────
function buildSkillsZone(group, def) {
    // Green garden base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.3, 0.25, 24), new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 1 }));
    base.position.y = 0.125; base.receiveShadow = true;
    group.add(base);

    // Inner raised circle (lighter stone)
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.95 }));
    inner.position.y = 0.25;
    group.add(inner);

    // Standing stones (circle of 8)
    for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        const stone = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 2.5 + Math.random() * 1.2, 0.45),
            new THREE.MeshStandardMaterial({ color: 0x9e9080, roughness: 1, metalness: 0 })
        );
        stone.position.set(Math.cos(a) * 5.5, 0.3 + stone.geometry.parameters.height / 2, Math.sin(a) * 5.5);
        stone.rotation.y = a + (Math.random() - 0.5) * 0.3;
        stone.castShadow = true;
        group.add(stone);
    }

    // Cross-posts on top (lintel stones)
    for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI * 2 + Math.PI / 8;
        const lintel = new THREE.Mesh(
            new THREE.BoxGeometry(2.8, 0.4, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x9e9080, roughness: 1 })
        );
        lintel.position.set(Math.cos(a) * 5.5, 3.2, Math.sin(a) * 5.5);
        lintel.rotation.y = a;
        lintel.castShadow = true;
        group.add(lintel);
    }

    // Central glowing crystal / gem
    const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.9),
        new THREE.MeshStandardMaterial({ color: 0x7fffd4, emissive: 0x3dffb9, emissiveIntensity: 0.7, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    crystal.position.y = 1.5;
    group.add(crystal);

    // Skill category totems (3 wooden signs)
    const signs = [
        { label: 'ENGINES', angle: 0, dist: 3.5 },
        { label: 'CODE', angle: 2.1, dist: 3.5 },
        { label: 'DESIGN', angle: 4.2, dist: 3.5 },
    ];
    signs.forEach(({ angle, dist }) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.2, 6), woodMat());
        post.position.set(Math.cos(angle) * dist, 1.1, Math.sin(angle) * dist);
        group.add(post);
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.1), new THREE.MeshStandardMaterial({ color: 0xffe8a0, roughness: 0.7 }));
        signBoard.position.set(Math.cos(angle) * dist, 2.3, Math.sin(angle) * dist);
        signBoard.rotation.y = Math.PI - angle;
        group.add(signBoard);
    });

    // Flower ring around edge
    for (let f = 0; f < 20; f++) {
        const a = (f / 20) * Math.PI * 2;
        const col = [0xff6b6b, 0xffd93d, 0xff85a1, 0xffffff, 0x90ee90][f % 5];
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
        flower.position.set(Math.cos(a) * 6.8, 0.35, Math.sin(a) * 6.8);
        group.add(flower);
    }

    addInfoBoard(group, 'SKILLS', def.color, [5.5, 0, 3]);

    return { labelY: 7 };
}

// ── CONTACT — Lighthouse & Dock ───────────────────────────────────────────────
function buildContactZone(group, def) {
    // Wooden dock platform
    const dock = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 }));
    dock.position.y = 0.15; dock.receiveShadow = true;
    group.add(dock);

    // Dock planks
    for (let p = -4; p <= 4; p++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 }));
        plank.position.set(0, 0.32, p);
        group.add(plank);
    }

    // Lighthouse tower
    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.4, 9, 12),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.6, metalness: 0 })
    );
    tower.position.set(0, 4.65, -2); tower.castShadow = true;
    group.add(tower);

    // Red stripes on lighthouse
    for (let r = 0; r < 4; r++) {
        const stripe = new THREE.Mesh(
            new THREE.CylinderGeometry(1.05 - r * 0.05, 1.15 - r * 0.05, 0.5, 12),
            new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 })
        );
        stripe.position.set(0, 1.5 + r * 2, -2);
        group.add(stripe);
    }

    // Light house lantern room
    const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.0, 1.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.3, metalness: 0.7 })
    );
    lantern.position.set(0, 9.7, -2); group.add(lantern);

    // Bright light at top
    const beam = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffff88, emissiveIntensity: 3 })
    );
    beam.position.set(0, 10.7, -2); group.add(beam);

    const beamLight = new THREE.PointLight(0xffffaa, 5, 30);
    beamLight.position.set(0, 10.7, -2);
    group.add(beamLight);

    // Conical roof
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.5, 12), roofMat());
    cap.position.set(0, 11.4, -2); group.add(cap);

    // Dock post and rope railings
    [[-5.5, 0, -3.5], [5.5, 0, -3.5], [-5.5, 0, 3.5], [5.5, 0, 3.5]].forEach(([px, , pz]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.5, 6), woodMat());
        p.position.set(px, 0.75, pz); group.add(p);
    });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.1, 0.08), woodMat());
    rail1.position.set(0, 1.4, -3.5); group.add(rail1);
    const rail2 = rail1.clone(); rail2.position.z = 3.5; group.add(rail2);

    // Mailbox
    const mailbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.5 }));
    mailbox.position.set(-3, 0.8, 3.8); group.add(mailbox);
    const mbpost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6), woodMat());
    mbpost.position.set(-3, 0.35, 3.8); group.add(mbpost);

    addInfoBoard(group, 'CONTACT', def.color, [4.5, 0, 3.5]);

    return { labelY: 12, beamLight };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function addInfoBoard(group, label, color, [bx, , bz]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.5, 7), woodMat());
    post.position.set(bx, 1.25, bz); group.add(post);

    const board = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.8, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xfffde7, roughness: 0.6 })
    );
    board.position.set(bx, 2.6, bz); group.add(board);

    const banner = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.2, 0.14),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    banner.position.set(bx, 2.95, bz); group.add(banner);
}

function makeLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Warm wooden background
    ctx.fillStyle = '#fff9e6';
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 14);
    ctx.fill();

    // Warm border
    const hex = '#' + color.toString(16).padStart(6, '0');
    ctx.strokeStyle = hex;
    ctx.lineWidth = 5;
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 14);
    ctx.stroke();

    // Dark text (high contrast)
    ctx.fillStyle = '#2c1810';
    ctx.font = 'bold 46px Orbitron, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

// ── Update ────────────────────────────────────────────────────────────────────
export function updateZones(zones, playerPos, t) {
    let nearestZone = null, nearestDist = Infinity;

    zones.forEach(zone => {
        const dx = playerPos.x - zone.pos.x;
        const dz = playerPos.z - zone.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        zone.zoneLight.intensity = 1.8 + Math.sin(t * 0.8 + zone.pos.x * 0.05) * 0.4;
        zone.sprite.position.y = (zone.elements?.labelY || 8) + Math.sin(t * 1.2 + zone.pos.x) * 0.25;

        // Rotate crystal in skills zone
        if (zone.id === 'skills') {
            zone.group.children.forEach(c => {
                if (c.geometry && c.geometry.type === 'OctahedronGeometry') {
                    c.rotation.y += 0.015;
                    c.rotation.x += 0.007;
                }
            });
        }

        // Rotate lighthouse light
        if (zone.id === 'contact' && zone.elements?.beamLight) {
            zone.elements.beamLight.position.x = Math.sin(t * 1.5) * 1.5;
            zone.elements.beamLight.position.z = -2 + Math.cos(t * 1.5) * 0.5;
        }

        if (dist < zone.interactDist && dist < nearestDist) {
            nearestDist = dist; nearestZone = zone;
        }
    });
    return nearestZone;
}
