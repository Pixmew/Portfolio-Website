// --- HUD: Minimap, Zone label, Controls, Walk prompt ---

const MINIMAP_SIZE = 140;
const WORLD_HALF = 40;

let minimapCanvas, minimapCtx;
let zoneLabelEl, promptEl, controlsEl, hudEl;

const ZONE_COLORS = {
    about: '#7c3aed',
    projects: '#f59e0b',
    skills: '#06b6d4',
    contact: '#10b981',
};

const ZONE_POSITIONS = [
    { id: 'about', label: 'About', x: -26, z: -18, icon: '📟' },
    { id: 'projects', label: 'Projects', x: 0, z: -28, icon: '🎮' },
    { id: 'skills', label: 'Skills', x: 26, z: -18, icon: '⚡' },
    { id: 'contact', label: 'Contact', x: 0, z: 26, icon: '📡' },
];

export function createHUD() {
    hudEl = document.getElementById('hud');

    // Minimap
    minimapCanvas = document.getElementById('minimap');
    minimapCanvas.width = MINIMAP_SIZE;
    minimapCanvas.height = MINIMAP_SIZE;
    minimapCtx = minimapCanvas.getContext('2d');

    // Zone label
    zoneLabelEl = document.getElementById('zone-label');

    // Interact prompt
    promptEl = document.getElementById('interact-prompt');

    // Controls overlay
    controlsEl = document.getElementById('controls-overlay');
    const dismissBtn = document.getElementById('dismiss-controls');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            controlsEl.classList.add('hidden');
        });
    }
    window.addEventListener('keydown', e => {
        if (e.code === 'KeyE' || e.code === 'Space') {
            controlsEl.classList.add('hidden');
        }
    });

    // Virtual joystick (mobile)
    setupVirtualJoystick();
}

function worldToMinimap(wx, wz) {
    const nx = (wx / WORLD_HALF) * 0.5 + 0.5;
    const nz = (wz / WORLD_HALF) * 0.5 + 0.5;
    return [nx * MINIMAP_SIZE, nz * MINIMAP_SIZE];
}

export function updateHUD(playerPos, nearestZone) {
    // --- Minimap ---
    minimapCtx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Background
    minimapCtx.fillStyle = 'rgba(4,5,10,0.88)';
    minimapCtx.beginPath();
    minimapCtx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2 - 1, 0, Math.PI * 2);
    minimapCtx.fill();

    // Border
    minimapCtx.strokeStyle = '#4f46e5';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2 - 1, 0, Math.PI * 2);
    minimapCtx.stroke();

    // Grid lines
    minimapCtx.strokeStyle = 'rgba(79,70,229,0.15)';
    minimapCtx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const p = (MINIMAP_SIZE / 4) * i;
        minimapCtx.beginPath(); minimapCtx.moveTo(p, 0); minimapCtx.lineTo(p, MINIMAP_SIZE); minimapCtx.stroke();
        minimapCtx.beginPath(); minimapCtx.moveTo(0, p); minimapCtx.lineTo(MINIMAP_SIZE, p); minimapCtx.stroke();
    }

    // Zone dots
    ZONE_POSITIONS.forEach(z => {
        const [mx, mz] = worldToMinimap(z.x, z.z);
        const col = ZONE_COLORS[z.id] || '#fff';
        minimapCtx.fillStyle = col;
        minimapCtx.shadowColor = col;
        minimapCtx.shadowBlur = 8;
        minimapCtx.beginPath();
        minimapCtx.arc(mx, mz, 5, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
    });

    // Player dot
    const [px, pz] = worldToMinimap(playerPos.x, playerPos.z);
    minimapCtx.fillStyle = '#ffffff';
    minimapCtx.shadowColor = '#ec4899';
    minimapCtx.shadowBlur = 10;
    minimapCtx.beginPath();
    minimapCtx.arc(px, pz, 4, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;

    // --- Zone label ---
    if (nearestZone) {
        zoneLabelEl.textContent = nearestZone.icon + ' ' + nearestZone.label;
        zoneLabelEl.style.color = '#' + nearestZone.color.toString(16).padStart(6, '0');
        zoneLabelEl.classList.remove('hidden');
        zoneLabelEl.classList.add('visible');
        promptEl.classList.remove('hidden');
        promptEl.classList.add('visible');
    } else {
        zoneLabelEl.classList.remove('visible');
        zoneLabelEl.classList.add('hidden');
        promptEl.classList.remove('visible');
        promptEl.classList.add('hidden');
    }
}

function setupVirtualJoystick() {
    const joystick = document.getElementById('virtual-joystick');
    if (!joystick) return;

    const btns = joystick.querySelectorAll('.vj-btn');
    const inputMap = {
        'vj-up': [0, -1],
        'vj-down': [0, 1],
        'vj-left': [-1, 0],
        'vj-right': [1, 0],
    };

    const active = new Set();

    function updateTouch() {
        let x = 0, z = 0;
        active.forEach(id => {
            if (inputMap[id]) { x += inputMap[id][0]; z += inputMap[id][1]; }
        });
        if (window.setTouchInput) window.setTouchInput(x, z);
    }

    btns.forEach(btn => {
        btn.addEventListener('touchstart', e => { e.preventDefault(); active.add(btn.id); updateTouch(); }, { passive: false });
        btn.addEventListener('touchend', e => { e.preventDefault(); active.delete(btn.id); updateTouch(); }, { passive: false });
        btn.addEventListener('mousedown', () => { active.add(btn.id); updateTouch(); });
        btn.addEventListener('mouseup', () => { active.delete(btn.id); updateTouch(); });
    });
}
