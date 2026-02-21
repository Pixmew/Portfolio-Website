import * as THREE from 'three';
import { createWorld, animateWorld } from './game/world.js';
import { createPlayer, setupInput, updatePlayer, getPlayerPosition } from './game/player.js';
import { createZones, updateZones } from './game/zones.js';
import { createHUD, updateHUD } from './game/hud.js';
import { createPanel, openPanel, isPanelOpen } from './game/panels.js';

// --- Audio (8-bit) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function playFootstep() { playTone(120 + Math.random() * 40, 'square', 0.05, 0.025); }
function playZoneEnter() {
    playTone(440, 'sine', 0.15, 0.08);
    setTimeout(() => playTone(660, 'sine', 0.15, 0.06), 100);
}
function playInteract() {
    playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(800, 'square', 0.1, 0.05), 60);
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
    const { renderer, scene, camera, walls, particles, lights, lamps } = createWorld();
    const player = createPlayer(scene);
    const { zones, colliders } = createZones(scene);
    setupInput();
    createHUD();
    createPanel();

    let prevNearestId = null;
    let lastFootstep = 0;
    let lastTime = performance.now();
    let t = 0;

    // E key interaction
    window.addEventListener('keydown', e => {
        if ((e.code === 'KeyE' || e.code === 'Space') && !isPanelOpen()) {
            const playerPos = getPlayerPosition(player);
            let nearest = null;
            let nearestDist = Infinity;
            zones.forEach(z => {
                const dx = playerPos.x - z.pos.x;
                const dz = playerPos.z - z.pos.z;
                const d = Math.sqrt(dx * dx + dz * dz);
                if (d < z.interactDist && d < nearestDist) { nearestDist = d; nearest = z; }
            });
            if (nearest) {
                playInteract();
                openPanel(nearest);
            }
        }
    });

    // Game loop
    function loop(now) {
        requestAnimationFrame(loop);
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        t += dt;

        if (!isPanelOpen()) {
            const { isMoving } = updatePlayer(player, camera, colliders, dt);

            // Footsteps
            if (isMoving && now - lastFootstep > 280) {
                lastFootstep = now;
                playFootstep();
            }

            const playerPos = getPlayerPosition(player);
            const nearest = updateZones(zones, playerPos, t);

            // Zone enter chime
            const nid = nearest ? nearest.id : null;
            if (nid !== prevNearestId) {
                if (nid) playZoneEnter();
                prevNearestId = nid;
            }

            updateHUD(playerPos, nearest);
        }

        animateWorld(particles, lights, lamps, t);
        renderer.render(scene, camera);
    }

    requestAnimationFrame(loop);
});
