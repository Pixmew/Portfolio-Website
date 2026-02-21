import * as THREE from 'three';
import { WORLD_SIZE } from './world.js';

const SPEED = 0.14;
const TURN_SPEED = 9;
const CAMERA_HEIGHT = 18;
const CAMERA_DIST = 20;
const CAMERA_LERP = 0.07;
const BOUNDARY = WORLD_SIZE / 2 - 1.5;

export function createPlayer(scene) {
    const group = new THREE.Group();

    // — Legs —
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.8, metalness: 0 });
    const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 4, 8), pantsMat);
    leftLeg.position.set(-0.22, 0.5, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 4, 8), pantsMat);
    rightLeg.position.set(0.22, 0.5, 0);
    group.add(rightLeg);

    // — Boots —
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.9, metalness: 0 });
    [-0.22, 0.22].forEach(side => {
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.38), bootMat);
        boot.position.set(side, 0.1, 0.07);
        group.add(boot);
    });

    // — Body / Jacket —
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7, metalness: 0 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.6, 5, 10), jacketMat);
    body.position.y = 1.25;
    body.castShadow = true;
    group.add(body);

    // — Backpack —
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8, metalness: 0 });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.25), backpackMat);
    backpack.position.set(0, 1.3, -0.42);
    group.add(backpack);
    // Backpack strap
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.7 }));
    strap.position.set(0, 1.55, -0.18);
    group.add(strap);

    // — Arms —
    const armMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7, metalness: 0 });
    [-0.56, 0.56].forEach(side => {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.45, 4, 8), armMat);
        arm.position.set(side, 1.1, 0);
        group.add(arm);
    });

    // — Head / Face —
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4c88a, roughness: 0.7, metalness: 0 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), skinMat);
    head.position.y = 1.9;
    head.castShadow = true;
    group.add(head);

    // — Hat —
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.8, metalness: 0 });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08, 16), hatMat);
    hatBrim.position.y = 2.17;
    group.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.52, 16), hatMat);
    hatTop.position.y = 2.45;
    group.add(hatTop);

    // — Soft player light (warm sun bounce) —
    const playerLight = new THREE.PointLight(0xffe8a0, 1.2, 5);
    playerLight.position.y = 1.5;
    group.add(playerLight);

    // — Step ring (grass ripple effect) —
    const stepRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.45, 20),
        new THREE.MeshBasicMaterial({ color: 0xadd9a0, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    stepRing.rotation.x = -Math.PI / 2;
    stepRing.position.y = 0.04;
    group.add(stepRing);

    group.position.set(0, 0, 8);
    scene.add(group);

    return { group, body, head, leftLeg, rightLeg, playerLight, stepRing };
}

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
let touchInput = { x: 0, z: 0 };
export function setupInput() {
    window.addEventListener('keydown', e => { keys[e.code] = true; });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.setTouchInput = (x, z) => { touchInput.x = x; touchInput.z = z; };
}

let currentAngle = 0, bobTime = 0, stepFlash = 0;

export function updatePlayer(player, camera, zoneColliders, dt) {
    const { group, body, head, leftLeg, rightLeg, playerLight, stepRing } = player;

    let dx = touchInput.x, dz = touchInput.z;
    if (keys['KeyW'] || keys['ArrowUp']) dz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dz += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 1) { dx /= len; dz /= len; }
    const isMoving = len > 0.01;

    if (isMoving) {
        const target = Math.atan2(dx, dz) + Math.PI;
        let diff = target - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        currentAngle += diff * Math.min(TURN_SPEED * dt, 1);
        group.rotation.y = currentAngle;

        const nx = group.position.x + dx * SPEED;
        const nz = group.position.z + dz * SPEED;
        const bx = Math.max(-BOUNDARY, Math.min(BOUNDARY, nx));
        const bz = Math.max(-BOUNDARY, Math.min(BOUNDARY, nz));
        let blocked = false;
        for (const col of zoneColliders) {
            if (bx > col.x - col.halfSize.x && bx < col.x + col.halfSize.x &&
                bz > col.z - col.halfSize.z && bz < col.z + col.halfSize.z) { blocked = true; break; }
        }
        if (!blocked) { group.position.x = bx; group.position.z = bz; }
    }

    bobTime += dt * (isMoving ? 7.5 : 1);

    // Body & head bob
    const bobY = Math.sin(bobTime) * (isMoving ? 0.065 : 0.02);
    body.position.y = 1.25 + bobY;
    head.position.y = 1.9 + bobY;

    // Leg swing
    leftLeg.rotation.x = Math.sin(bobTime) * (isMoving ? 0.4 : 0.05);
    rightLeg.rotation.x = -Math.sin(bobTime) * (isMoving ? 0.4 : 0.05);

    // Step ring flash
    const halfCycle = bobTime % (Math.PI * 2);
    if (isMoving && halfCycle > 0 && halfCycle < 0.1) stepFlash = 1.0;
    if (stepFlash > 0) {
        stepFlash = Math.max(0, stepFlash - dt * 5);
        stepRing.material.opacity = stepFlash * 0.45;
        const s = 1 + (1 - stepFlash) * 2;
        stepRing.scale.set(s, s, 1);
    }

    // Camera
    camera.position.x += (group.position.x - camera.position.x) * CAMERA_LERP;
    camera.position.y += (CAMERA_HEIGHT - camera.position.y) * CAMERA_LERP;
    camera.position.z += (group.position.z + CAMERA_DIST - camera.position.z) * CAMERA_LERP;
    camera.lookAt(group.position.x, 1.5, group.position.z);

    return { isMoving };
}

export function getPlayerPosition(player) { return player.group.position; }
