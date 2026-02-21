import * as THREE from 'three';

const INTERACT_DIST = 7.0;

// Zone definitions with unique architecture per zone
const ZONE_DEFS = [
    {
        id: 'about',
        label: 'About Terminal',
        color: 0x7c3aed,
        emissive: 0x4c1d95,
        glowColor: '#7c3aed',
        pos: [-26, 0, -18],
        size: [12, 0, 9],
        icon: '📟',
        buildFn: 'buildAboutZone',
    },
    {
        id: 'projects',
        label: 'Projects Gallery',
        color: 0xf59e0b,
        emissive: 0x92400e,
        glowColor: '#f59e0b',
        pos: [0, 0, -30],
        size: [18, 0, 9],
        icon: '🎮',
        buildFn: 'buildProjectsZone',
    },
    {
        id: 'skills',
        label: 'Skills Vault',
        color: 0x06b6d4,
        emissive: 0x164e63,
        glowColor: '#06b6d4',
        pos: [26, 0, -18],
        size: [12, 0, 9],
        icon: '⚡',
        buildFn: 'buildSkillsZone',
    },
    {
        id: 'contact',
        label: 'Contact Station',
        color: 0x10b981,
        emissive: 0x064e3b,
        glowColor: '#10b981',
        pos: [0, 0, 28],
        size: [12, 0, 9],
        icon: '📡',
        buildFn: 'buildContactZone',
    },
];

export function createZones(scene) {
    const zones = [];
    const colliders = [];

    ZONE_DEFS.forEach(def => {
        const group = new THREE.Group();
        group.position.set(...def.pos);

        // Build zone-specific architecture
        const builders = { buildAboutZone, buildProjectsZone, buildSkillsZone, buildContactZone };
        const elements = builders[def.buildFn](group, def);

        // Floating holographic label sprite
        const sprite = makeLabelSprite(def.icon + '  ' + def.label, def.color);
        sprite.position.set(0, elements.labelY || 8, 0);
        sprite.scale.set(9, 2.2, 1);
        group.add(sprite);

        // Zone ambient point light
        const zoneLight = new THREE.PointLight(def.color, 6, 25);
        zoneLight.position.set(0, 5, 0);
        group.add(zoneLight);

        scene.add(group);
        zones.push({ id: def.id, label: def.label, icon: def.icon, color: def.color, group, zoneLight, sprite, pos: new THREE.Vector3(...def.pos), interactDist: INTERACT_DIST, elements });
        colliders.push({ id: def.id, x: def.pos[0], z: def.pos[2], halfSize: new THREE.Vector3(def.size[0] / 2 + 0.5, 0, def.size[2] / 2 + 0.5) });
    });

    return { zones, colliders };
}

// ── ABOUT ZONE — Cyberpunk Terminal Tower ─────────────────────────────────────
function buildAboutZone(group, def) {
    const col = def.color;
    const emissiveMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.9 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0e1a, roughness: 0.5, metalness: 0.8 });

    // Platform slab
    addSlab(group, 12, 0.3, 9, 0x0d1030, def.emissive, 0.4);

    // Central terminal tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 1.2), new THREE.MeshStandardMaterial({ color: 0x0a0e1a, roughness: 0.3, metalness: 0.9, emissive: 0x050810, emissiveIntensity: 0.6 }));
    tower.position.set(0, 3.15, 0);
    tower.castShadow = true;
    group.add(tower);

    // Screen panel (front face)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.15 }));
    screen.position.set(0, 3.15, 0.62);
    group.add(screen);

    // Screen glow scanlines
    for (let i = 0; i < 14; i++) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.04), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25 }));
        line.position.set(0, 0.85 + i * 0.35, 0.63);
        group.add(line);
    }

    // Corner pillars
    [[-5.5, 0, -3.5], [5.5, 0, -3.5], [-5.5, 0, 3.5], [5.5, 0, 3.5]].forEach(([px, , pz]) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.9 }));
        pillar.position.set(px, 3.5, pz);
        pillar.castShadow = true;
        group.add(pillar);
    });

    // Floating data orbs
    for (let i = 0; i < 5; i++) {
        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2 })
        );
        orb.position.set(-4 + i * 2, 0.6, -3);
        group.add(orb);
    }

    // Platform border neon frame
    addNeonBorder(group, 12, 9, col);

    return { labelY: 9 };
}

// ── PROJECTS ZONE — Arcade Gallery Hall ───────────────────────────────────────
function buildProjectsZone(group, def) {
    const col = def.color;

    // Wide platform
    addSlab(group, 18, 0.3, 9, 0x140d00, def.emissive, 0.3);

    // Arcade cabinet silhouettes (3 cabinets)
    const cabinetPositions = [[-5, 0, 0], [0, 0, 0], [5, 0, 0]];
    cabinetPositions.forEach(([cx, , cz]) => {
        const cabinet = new THREE.Group();

        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 3.8, 1.0),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.9 })
        );
        body.position.y = 1.9;
        cabinet.add(body);

        // Screen bezel
        const bezel = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 1.2, 0.05),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4, roughness: 0.3 })
        );
        bezel.position.set(0, 2.5, 0.53);
        cabinet.add(bezel);

        // Screen glow
        const scrn = new THREE.Mesh(
            new THREE.PlaneGeometry(1.15, 1.05),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4 })
        );
        scrn.position.set(0, 2.5, 0.56);
        cabinet.add(scrn);

        // Control panel slope
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.6, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.7 })
        );
        panel.position.set(0, 1.15, 0.35);
        panel.rotation.x = -0.35;
        cabinet.add(panel);

        // Joystick
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0xee0000, roughness: 0.3 })
        );
        stick.position.set(-0.3, 1.55, 0.55);
        cabinet.add(stick);

        // Buttons (3 small spheres)
        for (let b = 0; b < 3; b++) {
            const btn = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8),
                new THREE.MeshStandardMaterial({ color: [0xff2222, 0x22ff22, 0x2222ff][b], emissive: [0xff2222, 0x22ff22, 0x2222ff][b], emissiveIntensity: 1 })
            );
            btn.position.set(0.15 + b * 0.2, 1.55, 0.6);
            cabinet.add(btn);
        }

        cabinet.position.set(cx, 0.3, cz);
        group.add(cabinet);
    });

    // Neon sign bar above
    const signBar = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.3, 0.2),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2 })
    );
    signBar.position.set(0, 7.5, -3.5);
    group.add(signBar);

    // Marquee lights along sign
    for (let m = -7; m <= 7; m += 1.5) {
        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 6, 6),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 3 })
        );
        bulb.position.set(m, 7.9, -3.5);
        group.add(bulb);
    }

    // Side pillar frames
    [[-8, 0, 0], [8, 0, 0]].forEach(([px, , pz]) => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 8, 0.35), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1, roughness: 0.2, metalness: 0.9 }));
        p.position.set(px, 4, pz);
        group.add(p);
    });

    addNeonBorder(group, 18, 9, col);
    return { labelY: 10 };
}

// ── SKILLS ZONE — Hexagonal Tech Vault ───────────────────────────────────────
function buildSkillsZone(group, def) {
    const col = def.color;

    // Hexagonal platform
    const hexGeo = new THREE.CylinderGeometry(6, 6, 0.3, 6);
    const hexMat = new THREE.MeshStandardMaterial({ color: 0x051a20, emissive: def.emissive, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.8 });
    const hex = new THREE.Mesh(hexGeo, hexMat);
    hex.position.y = 0.15;
    hex.receiveShadow = true;
    group.add(hex);

    // Hex border line
    const hexPts = [];
    for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        hexPts.push(new THREE.Vector3(Math.cos(a) * 6.05, 0.33, Math.sin(a) * 6.05));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hexPts), new THREE.LineBasicMaterial({ color: col })));

    // Central energy core
    const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 4, 16),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.5, transparent: true, opacity: 0.7, roughness: 0.1 })
    );
    core.position.y = 2.15;
    group.add(core);

    // Rotating rings around core
    for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.5 + r * 0.6, 0.06, 8, 32),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2 })
        );
        ring.position.y = 2 + r * 0.5;
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.z = Math.random() * Math.PI;
        ring.userData.rotAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
        ring.userData.rotSpeed = 0.01 + Math.random() * 0.02;
        group.add(ring);
        group.userData.rings = group.userData.rings || [];
        group.userData.rings.push(ring);
    }

    // Skill orb pedestals (3 per category, arranged around core)
    const skillColors = [0x7c3aed, 0xf59e0b, 0x06b6d4];
    for (let o = 0; o < 6; o++) {
        const angle = (o / 6) * Math.PI * 2 + Math.PI / 6;
        const orbR = 4;
        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x0a1a20, metalness: 0.9, roughness: 0.3 })
        );
        pedestal.position.set(Math.cos(angle) * orbR, 0.6, Math.sin(angle) * orbR);
        group.add(pedestal);

        const orb = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.45, 1),
            new THREE.MeshStandardMaterial({ color: skillColors[o % 3], emissive: skillColors[o % 3], emissiveIntensity: 2, roughness: 0.1, metalness: 0.5 })
        );
        orb.position.set(Math.cos(angle) * orbR, 1.75, Math.sin(angle) * orbR);
        group.add(orb);
    }

    // Outer hex pillar nodes at vertices
    for (let v = 0; v < 6; v++) {
        const a = (v / 6) * Math.PI * 2;
        const pil = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 6.5, 0.3),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.9 })
        );
        pil.position.set(Math.cos(a) * 5.7, 3.25, Math.sin(a) * 5.7);
        group.add(pil);
    }

    return { labelY: 9 };
}

// ── CONTACT ZONE — Satellite Comms Tower ──────────────────────────────────────
function buildContactZone(group, def) {
    const col = def.color;

    // Platform
    addSlab(group, 12, 0.3, 9, 0x061a10, def.emissive, 0.4);

    // Main tower shaft
    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 9, 8),
        new THREE.MeshStandardMaterial({ color: 0x0a1a10, emissive: 0x061008, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.9 })
    );
    shaft.position.y = 4.65;
    shaft.castShadow = true;
    group.add(shaft);

    // Dish (torus + disk)
    const dishGroup = new THREE.Group();
    const dishRim = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.12, 8, 32),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.9 })
    );
    dishGroup.add(dishRim);
    const dishFace = new THREE.Mesh(
        new THREE.CircleGeometry(2.2, 32),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    dishGroup.add(dishFace);
    // Spokes
    for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, 2.2),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8 })
        );
        spoke.rotation.z = a;
        spoke.position.set(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0);
        dishGroup.add(spoke);
    }
    dishGroup.rotation.x = -Math.PI / 5;
    dishGroup.position.set(0, 9.8, -0.5);
    group.add(dishGroup);

    // Signal emitter at tip
    const emitter = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 12),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 4 })
    );
    emitter.position.set(0, 10.5, 0);
    group.add(emitter);

    // Expanding signal rings (visual only — animated in CSS-like way via scale)
    for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.3 + r * 0.8, 0.36 + r * 0.8, 32),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5 - r * 0.15, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1 + r * 0.01;
        ring.userData.baseScale = 1;
        ring.userData.phase = r * 0.7;
        group.add(ring);
        group.userData.signalRings = group.userData.signalRings || [];
        group.userData.signalRings.push(ring);
    }

    // Corner pillars
    [[-5, 0, -3.5], [5, 0, -3.5], [-5, 0, 3.5], [5, 0, 3.5]].forEach(([px, , pz]) => {
        const p = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 5, 0.3),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1, roughness: 0.2, metalness: 0.9 })
        );
        p.position.set(px, 2.5, pz);
        p.castShadow = true;
        group.add(p);
    });

    addNeonBorder(group, 12, 9, col);
    return { labelY: 12, dishGroup, emitter };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function addSlab(group, w, h, d, color, emissive, emissInt) {
    const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissInt, roughness: 0.5, metalness: 0.7 })
    );
    slab.position.y = h / 2;
    slab.receiveShadow = true;
    group.add(slab);
    return slab;
}

function addNeonBorder(group, w, d, col) {
    const pts = [
        new THREE.Vector3(-w / 2, 0.33, -d / 2),
        new THREE.Vector3(w / 2, 0.33, -d / 2),
        new THREE.Vector3(w / 2, 0.33, d / 2),
        new THREE.Vector3(-w / 2, 0.33, d / 2),
        new THREE.Vector3(-w / 2, 0.33, -d / 2),
    ];
    const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: col })
    );
    group.add(line);
}

function makeLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 130;
    const ctx = canvas.getContext('2d');

    // Glassmorphism BG
    ctx.fillStyle = 'rgba(4,6,16,0.88)';
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 14);
    ctx.fill();

    // Neon border glow
    const hex = '#' + color.toString(16).padStart(6, '0');
    ctx.strokeStyle = hex;
    ctx.lineWidth = 3;
    ctx.shadowColor = hex; ctx.shadowBlur = 20;
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 14);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = hex; ctx.shadowBlur = 12;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

// ── Update each frame ─────────────────────────────────────────────────────────
export function updateZones(zones, playerPos, t) {
    let nearestZone = null;
    let nearestDist = Infinity;

    zones.forEach(zone => {
        const dx = playerPos.x - zone.pos.x;
        const dz = playerPos.z - zone.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Pulse zone light
        zone.zoneLight.intensity = 5 + Math.sin(t * 2 + zone.pos.x * 0.1) * 2;

        // Zone-specific animations
        if (zone.id === 'skills' && zone.group.userData.rings) {
            zone.group.userData.rings.forEach((ring, i) => {
                ring.rotation.x += 0.008 + i * 0.004;
                ring.rotation.z += 0.005 + i * 0.003;
            });
        }

        if (zone.id === 'contact' && zone.group.userData.signalRings) {
            zone.group.userData.signalRings.forEach((ring, i) => {
                const scale = 1 + ((t * 0.5 + ring.userData.phase) % 1) * 3;
                ring.scale.set(scale, scale, 1);
                ring.material.opacity = Math.max(0, 0.5 - ((t * 0.5 + ring.userData.phase) % 1) * 0.5);
            });
        }

        // Label hover float
        zone.sprite.position.y = (zone.elements?.labelY || 9) + Math.sin(t * 1.5 + zone.pos.x) * 0.3;

        if (dist < zone.interactDist && dist < nearestDist) {
            nearestDist = dist;
            nearestZone = zone;
        }
    });

    return nearestZone;
}
