import * as THREE from 'three';
import { WORLD_SIZE } from './world.js';

const SPEED = 0.14;
const TURN_SPEED = 8;
const CAMERA_HEIGHT = 16;
const CAMERA_DIST = 18;
const CAMERA_LERP = 0.08;
const BOUNDARY = WORLD_SIZE / 2 - 1.2;

export function createPlayer(scene) {
    const group = new THREE.Group();

    // Body — glowing capsule
    const bodyGeo = new THREE.CapsuleGeometry(0.45, 1.0, 6, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x4f46e5,
        emissiveIntensity: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.05;
    body.castShadow = true;
    group.add(body);

    // Helmet visor — cyan glowing sphere
    const visorGeo = new THREE.SphereGeometry(0.28, 12, 8);
    const visorMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.85,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 1.9;
    visor.position.z = 0.22;
    group.add(visor);

    // Glow light attached to player
    const playerLight = new THREE.PointLight(0x4f46e5, 3, 5);
    playerLight.position.y = 1.5;
    group.add(playerLight);

    // Shadow circle on floor
    const shadowGeo = new THREE.CircleGeometry(0.55, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadowCircle = new THREE.Mesh(shadowGeo, shadowMat);
    shadowCircle.rotation.x = -Math.PI / 2;
    shadowCircle.position.y = 0.02;
    group.add(shadowCircle);

    group.position.set(0, 0, 8); // spawn near center
    scene.add(group);

    return { group, body, visor, playerLight };
}

// --- Input State ---
const keys = {};
let touchInput = { x: 0, z: 0 };

export function setupInput() {
    window.addEventListener('keydown', e => { keys[e.code] = true; });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    // Touch / virtual joystick (set by hud.js)
    window.setTouchInput = (x, z) => { touchInput.x = x; touchInput.z = z; };
}

let currentAngle = 0;
let bobTime = 0;
let isMoving = false;

export function updatePlayer(player, camera, zoneColliders, dt) {
    const { group, body, visor, playerLight } = player;

    // Compute move vector
    let dx = 0, dz = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dz += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Add touch input
    dx += touchInput.x;
    dz += touchInput.z;

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 1) { dx /= len; dz /= len; }

    isMoving = len > 0.01;

    if (isMoving) {
        // Target angle
        const targetAngle = Math.atan2(dx, dz) + Math.PI;
        // Shortest path rotation lerp
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        currentAngle += diff * Math.min(TURN_SPEED * dt, 1);

        group.rotation.y = currentAngle;

        // Proposed new position
        const nx = group.position.x + dx * SPEED;
        const nz = group.position.z + dz * SPEED;

        // Boundary check
        const bx = Math.max(-BOUNDARY, Math.min(BOUNDARY, nx));
        const bz = Math.max(-BOUNDARY, Math.min(BOUNDARY, nz));

        // Zone collider check
        let blocked = false;
        for (const col of zoneColliders) {
            const half = col.halfSize;
            if (
                bx > col.x - half.x && bx < col.x + half.x &&
                bz > col.z - half.z && bz < col.z + half.z
            ) {
                blocked = true;
                break;
            }
        }

        if (!blocked) {
            group.position.x = bx;
            group.position.z = bz;
        }
    }

    // Bob animation
    bobTime += dt * (isMoving ? 6 : 1);
    body.position.y = 1.05 + Math.sin(bobTime) * (isMoving ? 0.06 : 0.02);
    visor.position.y = 1.9 + Math.sin(bobTime) * (isMoving ? 0.06 : 0.02);

    // Visor pulse
    visor.material.emissiveIntensity = 1.5 + Math.sin(bobTime * 2) * 0.4;
    playerLight.intensity = 2.5 + Math.sin(bobTime * 2) * 0.8;

    // Smooth camera follow
    const targetCamX = group.position.x;
    const targetCamZ = group.position.z + CAMERA_DIST;
    camera.position.x += (targetCamX - camera.position.x) * CAMERA_LERP;
    camera.position.y += (CAMERA_HEIGHT - camera.position.y) * CAMERA_LERP;
    camera.position.z += (targetCamZ - camera.position.z) * CAMERA_LERP;
    camera.lookAt(group.position.x, 1.5, group.position.z);

    return { isMoving };
}

export function getPlayerPosition(player) {
    return player.group.position;
}
