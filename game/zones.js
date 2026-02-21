import * as THREE from 'three';

// Zone definitions: id, label, color, position, size
const ZONE_DEFS = [
    {
        id: 'about',
        label: 'About Terminal',
        color: 0x7c3aed,
        emissive: 0x4c1d95,
        pos: [-26, 0, -18],
        size: [10, 0, 8],
        icon: '📟',
    },
    {
        id: 'projects',
        label: 'Projects Gallery',
        color: 0xf59e0b,
        emissive: 0x92400e,
        pos: [0, 0, -28],
        size: [16, 0, 8],
        icon: '🎮',
    },
    {
        id: 'skills',
        label: 'Skills Vault',
        color: 0x06b6d4,
        emissive: 0x164e63,
        pos: [26, 0, -18],
        size: [10, 0, 8],
        icon: '⚡',
    },
    {
        id: 'contact',
        label: 'Contact Station',
        color: 0x10b981,
        emissive: 0x064e3b,
        pos: [0, 0, 26],
        size: [10, 0, 8],
        icon: '📡',
    },
];

const INTERACT_DIST = 6.5;

export function createZones(scene) {
    const zones = [];
    const colliders = [];

    ZONE_DEFS.forEach(def => {
        const zone = buildZone(scene, def);
        zones.push(zone);

        // Collision data (half extents + a bit of padding)
        colliders.push({
            id: def.id,
            x: def.pos[0],
            z: def.pos[2],
            halfSize: new THREE.Vector3(def.size[0] / 2 + 0.3, 0, def.size[2] / 2 + 0.3),
        });
    });

    return { zones, colliders };
}

function buildZone(scene, def) {
    const group = new THREE.Group();

    const [px, py, pz] = def.pos;
    const [sw, , sd] = def.size;

    // --- Platform base ---
    const platGeo = new THREE.BoxGeometry(sw, 0.25, sd);
    const platMat = new THREE.MeshStandardMaterial({
        color: 0x0d1117,
        roughness: 0.6,
        metalness: 0.5,
        emissive: def.emissive,
        emissiveIntensity: 0.3,
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(0, 0.125, 0);
    platform.receiveShadow = true;
    group.add(platform);

    // --- Neon border frame ---
    const frameW = sw + 0.1;
    const frameD = sd + 0.1;
    const borderPoints = [
        new THREE.Vector3(-frameW / 2, 0.27, -frameD / 2),
        new THREE.Vector3(frameW / 2, 0.27, -frameD / 2),
        new THREE.Vector3(frameW / 2, 0.27, frameD / 2),
        new THREE.Vector3(-frameW / 2, 0.27, frameD / 2),
        new THREE.Vector3(-frameW / 2, 0.27, -frameD / 2),
    ];
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({ color: def.color, linewidth: 3 });
    group.add(new THREE.Line(borderGeo, borderMat));

    // --- Vertical pillars at corners ---
    const pillarH = 3.5;
    const corners = [
        [-sw / 2, sd / 2],
        [sw / 2, sd / 2],
        [sw / 2, -sd / 2],
        [-sw / 2, -sd / 2],
    ];
    corners.forEach(([cx, cz]) => {
        const pGeo = new THREE.BoxGeometry(0.2, pillarH, 0.2);
        const pMat = new THREE.MeshStandardMaterial({
            color: def.color,
            emissive: def.color,
            emissiveIntensity: 1.0,
            roughness: 0.2,
            metalness: 0.9,
        });
        const pillar = new THREE.Mesh(pGeo, pMat);
        pillar.position.set(cx, pillarH / 2 + 0.27, cz);
        pillar.castShadow = true;
        group.add(pillar);
    });

    // --- Floating holographic label ---
    const sprite = makeLabelSprite(def.icon + ' ' + def.label, def.color);
    sprite.position.set(0, pillarH + 1.4, 0);
    sprite.scale.set(8, 2, 1);
    group.add(sprite);

    // --- Zone point light ---
    const zoneLight = new THREE.PointLight(def.color, 5, 20);
    zoneLight.position.set(0, 4, 0);
    group.add(zoneLight);

    group.position.set(px, py, pz);
    scene.add(group);

    return {
        id: def.id,
        label: def.label,
        icon: def.icon,
        color: def.color,
        group,
        zoneLight,
        sprite,
        pos: new THREE.Vector3(px, py, pz),
        interactDist: INTERACT_DIST,
    };
}

function makeLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(4,5,10,0.82)';
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 12);
    ctx.fill();

    // Neon border
    const hex = '#' + color.toString(16).padStart(6, '0');
    ctx.strokeStyle = hex;
    ctx.lineWidth = 4;
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 12);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    return new THREE.Sprite(mat);
}

export function updateZones(zones, playerPos, t) {
    let nearestZone = null;
    let nearestDist = Infinity;

    zones.forEach(zone => {
        const dx = playerPos.x - zone.pos.x;
        const dz = playerPos.z - zone.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Pulse zone light
        zone.zoneLight.intensity = 4 + Math.sin(t * 2 + zone.pos.x) * 1.5;

        // Hover pillars
        zone.group.children.forEach(child => {
            if (child.isMesh && child.geometry.type === 'BoxGeometry') {
                const scale = 1 + Math.sin(t * 1.5 + zone.pos.z * 0.1) * 0.02;
                child.scale.y = scale;
            }
        });

        if (dist < zone.interactDist && dist < nearestDist) {
            nearestDist = dist;
            nearestZone = zone;
        }
    });

    return nearestZone;
}
