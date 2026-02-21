import * as THREE from 'three';
import { WORLD_SIZE } from './world.js';

const SPEED = 0.15;
const TURN_SPEED = 10;
const CAMERA_HEIGHT = 18;
const CAMERA_DIST = 20;
const CAMERA_LERP = 0.07;
const BOUNDARY = WORLD_SIZE / 2 - 1.5;

export function createPlayer(scene) {
    const group = new THREE.Group();

    // — Body suit (dark blue-gray, slightly emissive seams) —
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0d1525, roughness: 0.35, metalness: 0.85, emissive: 0x1a2a4a, emissiveIntensity: 0.3 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.95, 6, 12), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // — Shoulder armour pads —
    const padMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, emissive: 0x4f46e5, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.95 });
    [-0.52, 0.52].forEach(side => {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.42), padMat);
        pad.position.set(side, 1.5, 0);
        pad.castShadow = true;
        group.add(pad);
    });

    // — Helmet — 
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.25, metalness: 0.95 });
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), helmetMat);
    helmet.position.y = 1.9;
    helmet.castShadow = true;
    group.add(helmet);

    // — Visor (glowing cyan lens) —
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.5, roughness: 0.0, metalness: 0.5, transparent: true, opacity: 0.9 });
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, -0.9, 1.8, 0.45, 1.0), visorMat);
    visor.position.set(0, 1.9, 0.16);
    group.add(visor);

    // — Chest emblem (small glowing square) —
    const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 3 }));
    emblem.position.set(0, 1.1, 0.43);
    group.add(emblem);

    // — Belt trim line —
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.04, 6, 20), new THREE.MeshStandardMaterial({ color: 0x4f46e5, emissive: 0x4f46e5, emissiveIntensity: 1.5 }));
    belt.position.y = 0.72;
    belt.rotation.x = Math.PI / 2;
    group.add(belt);

    // — Glow light (soft player aura) —
    const playerLight = new THREE.PointLight(0x4f46e5, 3.5, 6);
    playerLight.position.y = 1.2;
    group.add(playerLight);

    // — Footstep ring flash (shown when stepping) —
    const stepRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.45, 20),
        new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    stepRing.rotation.x = -Math.PI / 2;
    stepRing.position.y = 0.04;
    group.add(stepRing);

    // — Shadow decal —
    const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    group.position.set(0, 0, 8);
    scene.add(group);

    return { group, body, helmet, visor, emblem, belt, playerLight, stepRing };
}

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
let touchInput = { x: 0, z: 0 };

export function setupInput() {
    window.addEventListener('keydown', e => { keys[e.code] = true; });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.setTouchInput = (x, z) => { touchInput.x = x; touchInput.z = z; };
}

// ── State ─────────────────────────────────────────────────────────────────────
let currentAngle = 0;
let bobTime = 0;
let stepFlash = 0; // 0..1 flash timer

export function updatePlayer(player, camera, zoneColliders, dt) {
    const { group, body, helmet, visor, emblem, belt, playerLight, stepRing } = player;

    // Input
    let dx = touchInput.x, dz = touchInput.z;
    if (keys['KeyW'] || keys['ArrowUp']) dz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dz += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 1) { dx /= len; dz /= len; }
    const isMoving = len > 0.01;

    if (isMoving) {
        // Smooth rotation toward movement direction
        const target = Math.atan2(dx, dz) + Math.PI;
        let diff = target - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        currentAngle += diff * Math.min(TURN_SPEED * dt, 1);
        group.rotation.y = currentAngle;

        // Move + boundary + zone collider check
        const nx = group.position.x + dx * SPEED;
        const nz = group.position.z + dz * SPEED;
        const bx = Math.max(-BOUNDARY, Math.min(BOUNDARY, nx));
        const bz = Math.max(-BOUNDARY, Math.min(BOUNDARY, nz));

        let blocked = false;
        for (const col of zoneColliders) {
            if (bx > col.x - col.halfSize.x && bx < col.x + col.halfSize.x &&
                bz > col.z - col.halfSize.z && bz < col.z + col.halfSize.z) {
                blocked = true; break;
            }
        }
        if (!blocked) { group.position.x = bx; group.position.z = bz; }
    }

    // ── Animations ──
    bobTime += dt * (isMoving ? 7 : 1.2);

    // Body bob
    const bobY = Math.sin(bobTime) * (isMoving ? 0.07 : 0.025);
    body.position.y = 1.0 + bobY;
    helmet.position.y = 1.9 + bobY;
    visor.position.y = 1.9 + bobY;
    emblem.position.y = 1.1 + bobY;
    belt.position.y = 0.72 + bobY;

    // Visor + chest emblem pulse
    visor.material.emissiveIntensity = 2 + Math.sin(bobTime * 2.5) * 0.6;
    emblem.material.emissiveIntensity = 2.5 + Math.sin(bobTime * 3 + 1) * 1.5;

    // Player aura pulse
    playerLight.intensity = 3 + Math.sin(bobTime * 2) * 0.8;

    // Step ring flash
    if (isMoving) {
        const halfCycle = bobTime % (Math.PI * 2);
        if (halfCycle > 0 && halfCycle < 0.1) stepFlash = 1.0;
    }
    if (stepFlash > 0) {
        stepFlash = Math.max(0, stepFlash - dt * 6);
        stepRing.material.opacity = stepFlash * 0.5;
        const s = 1 + (1 - stepFlash) * 1.5;
        stepRing.scale.set(s, s, 1);
    }

    // Camera follow
    camera.position.x += (group.position.x - camera.position.x) * CAMERA_LERP;
    camera.position.y += (CAMERA_HEIGHT - camera.position.y) * CAMERA_LERP;
    camera.position.z += (group.position.z + CAMERA_DIST - camera.position.z) * CAMERA_LERP;
    camera.lookAt(group.position.x, 1.5, group.position.z);

    return { isMoving };
}

export function getPlayerPosition(player) { return player.group.position; }
