import * as THREE from 'three';

// ── Auto-animated nature scene (hero background only — no player controls) ──

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    // Set canvas dimensions explicitly before renderer uses it
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x87ceeb, 1); // opaque sky blue fallback
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xc9e8f5, 55, 120);

    const camera = new THREE.PerspectiveCamera(48, canvas.offsetWidth / canvas.offsetHeight, 0.1, 200);
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 0, -5);

    function onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    // Defer initial sizing so DOM layout is fully computed
    requestAnimationFrame(onResize);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff5e0, 2.2));
    const sun = new THREE.DirectionalLight(0xfffbe0, 3.0);
    sun.position.set(25, 55, 18);
    sun.castShadow = true;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 160;
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.001;
    scene.add(sun);
    scene.add(Object.assign(new THREE.DirectionalLight(0xb0d8f8, 0.7), { position: new THREE.Vector3(-15, 25, -10) }));

    // ── Grass floor ───────────────────────────────────────────────────────────
    const grassTex = makeGrassTexture();
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Mountains ─────────────────────────────────────────────────────────────
    [[-65, 0, -80], [-40, 0, -90], [-12, 0, -88], [18, 0, -90], [45, 0, -85], [68, 0, -78], [-80, 0, 10], [80, 0, 5]].forEach(([x, , z]) => {
        const h = 22 + Math.random() * 22;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(14 + Math.random() * 10, h, 8), new THREE.MeshStandardMaterial({ color: 0x7aab6e, roughness: 1 }));
        cone.position.set(x, h / 2 - 2, z); scene.add(cone);
        const snow = new THREE.Mesh(new THREE.ConeGeometry((14 + Math.random() * 8) * 0.32, h * 0.25, 8), new THREE.MeshStandardMaterial({ color: 0xf0f5ee, roughness: 1 }));
        snow.position.set(x, h * 0.7 + h / 2 - 2, z); scene.add(snow);
    });

    // ── Trees ─────────────────────────────────────────────────────────────────
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9, metalness: 0 });
    const leafMats = [0x2d7a2d, 0x3a8f3a, 0x228b22, 0x4caf50].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    const treePositions = [
        ...Array.from({ length: 13 }, (_, i) => [-44 + i * 7, 0, -44]),
        ...Array.from({ length: 13 }, (_, i) => [-44 + i * 7, 0, 44]),
        ...Array.from({ length: 11 }, (_, i) => [-44, 0, -38 + i * 7]),
        ...Array.from({ length: 11 }, (_, i) => [44, 0, -38 + i * 7]),
        [-32, 0, 10], [33, 0, 8], [-36, 0, 20], [37, 0, 22], [-15, 0, 32], [15, 0, 32], [-34, 0, -30], [34, 0, -30],
    ];
    treePositions.forEach(([tx, , tz]) => {
        const h = 4 + Math.random() * 4;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, h, 7), trunkMat);
        trunk.position.set(tx, h / 2, tz); trunk.castShadow = true; scene.add(trunk);
        const layers = 2 + Math.floor(Math.random() * 2);
        const lMat = leafMats[Math.floor(Math.random() * leafMats.length)];
        for (let l = 0; l < layers; l++) {
            const c = new THREE.Mesh(new THREE.ConeGeometry(2.0 - l * 0.35, 2.2 + l * 0.5, 8), lMat);
            c.position.set(tx, h + 1 + l * 1.3, tz); c.castShadow = true; scene.add(c);
        }
    });

    // ── Stone paths ───────────────────────────────────────────────────────────
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb8a898, roughness: 0.95 });
    [[0, 0, 0, 0, -25, 0], [0, 0, 0, 0, 22, 0], [0, 0, 0, -18, -10, 0], [0, 0, 0, 18, -10, 0]].forEach(([fx, , fz, tx, , tz]) => {
        const from = new THREE.Vector3(fx, 0, fz), to = new THREE.Vector3(tx, 0, tz);
        const len = from.distanceTo(to), mid = from.clone().lerp(to, 0.5);
        const ang = Math.atan2(to.x - from.x, to.z - from.z);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, len), stoneMat);
        slab.position.set(mid.x, 0.04, mid.z); slab.rotation.y = ang; slab.receiveShadow = true; scene.add(slab);
        for (let s = 0; s < Math.floor(len / 1.4); s++) {
            const t = (s + 0.5) / Math.floor(len / 1.4), sp = from.clone().lerp(to, t);
            const st = new THREE.Mesh(new THREE.BoxGeometry(0.7 + Math.random() * 0.4, 0.06, 0.65 + Math.random() * 0.3), new THREE.MeshStandardMaterial({ color: 0x9a8878, roughness: 1 }));
            st.position.set(sp.x, 0.06, sp.z); st.rotation.y = ang + (Math.random() - 0.5) * 0.6; st.receiveShadow = true; scene.add(st);
        }
    });

    // ── Spawn platform ────────────────────────────────────────────────────────
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.18, 20), new THREE.MeshStandardMaterial({ color: 0x9b6c3e, roughness: 0.8 }));
    plat.position.y = 0.09; plat.receiveShadow = true; scene.add(plat);
    for (let i = 0; i < 7; i++) {
        const pl = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.04, 0.38), new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 }));
        pl.position.set(0, 0.2, -2.8 + i); scene.add(pl);
    }
    // Flower ring
    [0xff7070, 0xffd93d, 0xff9f7a, 0xffb347, 0xffffff].forEach((col, ci) => {
        for (let f = ci; f < 18; f += 5) {
            const a = (f / 18) * Math.PI * 2;
            const fl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 6, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
            fl.position.set(Math.cos(a) * 4.0, 0.32, Math.sin(a) * 4.0); scene.add(fl);
        }
    });

    // ── Zone buildings ────────────────────────────────────────────────────────
    // About cabin
    buildCabin(scene, -24, 0, -18);
    // Projects gallery
    buildGallery(scene, 0, 0, -28);
    // Skills stone circle
    buildStoneCircle(scene, 24, 0, -18);
    // Contact lighthouse
    buildLighthouse(scene, 0, 0, 24);

    // ── Auto-walking character ────────────────────────────────────────────────
    const character = buildCharacter(scene);

    // ── Fireflies ─────────────────────────────────────────────────────────────
    const ffCount = 180;
    const ffPos = new Float32Array(ffCount * 3);
    for (let i = 0; i < ffCount; i++) {
        ffPos[i * 3] = (Math.random() - 0.5) * 80; ffPos[i * 3 + 1] = 0.3 + Math.random() * 4; ffPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ color: 0xffff55, size: 0.22, transparent: true, opacity: 0.85, sizeAttenuation: true }));
    scene.add(fireflies);

    // ── Nav scroll highlight ──────────────────────────────────────────────────
    const nav = document.getElementById('site-nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ── Project card hover-to-play ────────────────────────────────────────────
    document.querySelectorAll('.project-card[data-vid]').forEach(card => {
        const vid = card.dataset.vid;
        const iframe = card.querySelector('.card-iframe');
        card.addEventListener('mouseenter', () => {
            iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&rel=0`;
        });
        card.addEventListener('mouseleave', () => { iframe.src = ''; });
    });

    // ── Scroll reveal ─────────────────────────────────────────────────────────
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.section, .project-card, .about-card, .skill-group, .clink').forEach(el => {
        el.classList.add('reveal-item');
        observer.observe(el);
    });

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0;
    const waypoints = [
        new THREE.Vector3(0, 0, 5),
        new THREE.Vector3(-22, 0, -16),
        new THREE.Vector3(0, 0, -26),
        new THREE.Vector3(22, 0, -16),
        new THREE.Vector3(0, 0, 22),
        new THREE.Vector3(0, 0, 5),
    ];
    let wpIdx = 0, wpT = 0;
    const WP_SPEED = 0.0018;

    function loop(now) {
        requestAnimationFrame(loop);
        const dt = 0.016;
        t += dt;

        // Auto-walk character along waypoints
        wpT += WP_SPEED;
        if (wpT >= 1) { wpT = 0; wpIdx = (wpIdx + 1) % waypoints.length; }
        const from = waypoints[wpIdx], to = waypoints[(wpIdx + 1) % waypoints.length];
        character.group.position.lerpVectors(from, to, wpT);
        character.group.position.y = 0;
        // Face direction of travel
        const dir = to.clone().sub(from);
        if (dir.length() > 0.01) character.group.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;
        // Leg swing
        const bob = Math.sin(t * 7) * 0.35;
        character.leftLeg.rotation.x = bob;
        character.rightLeg.rotation.x = -bob;
        character.body.position.y = 1.25 + Math.abs(Math.sin(t * 7)) * 0.04;

        // Camera slowly orbits and follows character
        const camTarget = character.group.position.clone().add(new THREE.Vector3(Math.sin(t * 0.08) * 4, 12, Math.cos(t * 0.08) * 4 + 22));
        camera.position.lerp(camTarget, 0.01);
        camera.lookAt(character.group.position.x, 2, character.group.position.z);

        // Firefly drift
        const fp = fireflies.geometry.attributes.position.array;
        for (let i = 0; i < fp.length; i += 3) {
            fp[i] += Math.sin(t * 0.6 + i) * 0.006;
            fp[i + 1] += 0.004;
            fp[i + 2] += Math.cos(t * 0.4 + i) * 0.006;
            if (fp[i + 1] > 5) fp[i + 1] = 0.3;
        }
        fireflies.geometry.attributes.position.needsUpdate = true;
        fireflies.material.opacity = 0.5 + Math.sin(t * 2.5) * 0.35;

        renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
});

// ── Scene builders ────────────────────────────────────────────────────────────
function buildCharacter(scene) {
    const g = new THREE.Group();
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4c88a, roughness: 0.7 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.8 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.9 });
    const backMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 });

    const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 4, 8), pantsMat);
    leftLeg.position.set(-0.22, 0.5, 0); g.add(leftLeg);
    const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 4, 8), pantsMat);
    rightLeg.position.set(0.22, 0.5, 0); g.add(rightLeg);
    [-0.22, 0.22].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.35), bootMat); b.position.set(s, 0.1, 0.07); g.add(b); });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.6, 5, 10), jacketMat);
    body.position.y = 1.25; body.castShadow = true; g.add(body);
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.24), backMat);
    bp.position.set(0, 1.3, -0.4); g.add(bp);
    [-0.55, 0.55].forEach(s => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.44, 4, 8), jacketMat); a.position.set(s, 1.1, 0); g.add(a); });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), skinMat);
    head.position.y = 1.9; head.castShadow = true; g.add(head);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08, 16), hatMat);
    brim.position.y = 2.17; g.add(brim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.5, 16), hatMat);
    top.position.y = 2.44; g.add(top);
    g.position.set(0, 0, 5);
    scene.add(g);
    return { group: g, body, leftLeg, rightLeg };
}

function buildCabin(scene, x, y, z) {
    const g = new THREE.Group();
    const ww = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.7 });
    const rr = new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.9 });
    const bb = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
    const ss = new THREE.MeshStandardMaterial({ color: 0xa09080, roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(13, 0.28, 10), ss); base.position.y = 0.14; g.add(base);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(7, 3.5, 5.5), ww); wall.position.y = 2.0; wall.castShadow = true; g.add(wall);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 5, 2.5, 4), rr); roof.position.y = 4.5; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), ss); ch.position.set(2.2, 4.8, -0.9); g.add(ch);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.1), bb); door.position.set(0, 1.2, 2.8); g.add(door);
    [[-2.5, 2.0, 2.8], [2.5, 2.0, 2.8]].forEach(([wx, wy, wz]) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0xffe680, emissive: 0xffe680, emissiveIntensity: 0.8 }));
        win.position.set(wx, wy, wz); g.add(win);
    });
    [[-3.2, 3.2], [3.2, 3.2]].forEach(([px, pz]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.5, 8), new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 }));
        p.position.set(px, 1.75, pz); g.add(p);
    });
    [0xff7070, 0xffd93d, 0xff9f7a, 0xffb347].forEach((col, fi) => {
        for (let f = fi; f < 12; f += 4) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 6, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 })); fl.position.set(-4.6 + (f % 4) * 2.8, 0.5 - y, 3.8 + Math.floor(f / 4) * 0.8); g.add(fl); }
    });
    g.position.set(x, y, z); scene.add(g);
}

function buildGallery(scene, x, y, z) {
    const g = new THREE.Group();
    const brd = new THREE.MeshStandardMaterial({ color: 0x598040, roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 11), brd); base.position.y = 0.1; g.add(base);
    const wdMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });
    const boardCols = [0x3498db, 0xe74c3c, 0x9b59b6, 0x27ae60];
    [[-7.5, -2.5], [2.5, 7.5]].forEach(mid => {
        mid.forEach((bx, i) => {
            [[-0.8], [0.8]].forEach(([px]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.5, 8), wdMat); p.position.set(bx + px, 2.25, -2); g.add(p); });
            const board = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 0.12), new THREE.MeshStandardMaterial({ color: 0xfefdf5, roughness: 0.5 })); board.position.set(bx, 3.0, -1.94); g.add(board);
            const hdr = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.38, 0.14), new THREE.MeshStandardMaterial({ color: boardCols[i], roughness: 0.5 })); hdr.position.set(bx, 3.9, -1.93); g.add(hdr);
            const frm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 0.08), wdMat); frm.position.set(bx, 3.0, -2.0); g.add(frm);
        });
    });
    for (let b = -9.5; b <= 9.5; b += 1.2) {
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.04), new THREE.MeshStandardMaterial({ color: [0xe74c3c, 0xf39c12, 0x3498db, 0x2ecc71][Math.floor(Math.random() * 4)], roughness: 0.7 }));
        flag.position.set(b, 4.8 + Math.sin(b * 0.7) * 0.3, -4); flag.rotation.z = (Math.random() - 0.5) * 0.5; g.add(flag);
    }
    [[-9.5, 0], [9.5, 0]].forEach(([px, pz]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 6.2, 8), wdMat); p.position.set(px, 3.1, pz); g.add(p); });
    const arch = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 0.3), wdMat); arch.position.y = 6.25; g.add(arch);
    g.position.set(x, y, z); scene.add(g);
}

function buildStoneCircle(scene, x, y, z) {
    const g = new THREE.Group();
    const sm = new THREE.MeshStandardMaterial({ color: 0xa09080, roughness: 1 });
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0x5a8040, roughness: 1 })); hex.position.y = 0.125; g.add(hex);
    const inn = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.95 })); inn.position.y = 0.25; g.add(inn);
    for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        const h = 2.3 + Math.random() * 1.1;
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.75, h, 0.42), sm);
        st.position.set(Math.cos(a) * 5.4, 0.3 + h / 2, Math.sin(a) * 5.4); st.rotation.y = a + (Math.random() - 0.5) * 0.25; st.castShadow = true; g.add(st);
    }
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshStandardMaterial({ color: 0x7fffd4, emissive: 0x3dffb9, emissiveIntensity: 0.8, roughness: 0.1, transparent: true, opacity: 0.85 }));
    crystal.position.y = 1.5; g.add(crystal);
    for (let f = 0; f < 18; f++) {
        const a = (f / 18) * Math.PI * 2, col = [0xff6b6b, 0xffd93d, 0xff85a1, 0xffffff, 0x90ee90][f % 5];
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
        fl.position.set(Math.cos(a) * 7.0, 0.32, Math.sin(a) * 7.0); g.add(fl);
    }
    g.position.set(x, y, z); scene.add(g);
    g.userData.crystal = crystal;
    return g;
}

function buildLighthouse(scene, x, y, z) {
    const g = new THREE.Group();
    const wdMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 });
    const dock = new THREE.Mesh(new THREE.BoxGeometry(14, 0.28, 10), wdMat); dock.position.y = 0.14; g.add(dock);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 9, 12), new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.6 }));
    tower.position.set(0, 4.65, -2); tower.castShadow = true; g.add(tower);
    [0, 1, 2, 3].forEach(r => { const sp = new THREE.Mesh(new THREE.CylinderGeometry(1.06 - r * 0.05, 1.15 - r * 0.05, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 })); sp.position.set(0, 1.5 + r * 2, -2); g.add(sp); });
    const lr = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.3, metalness: 0.7 })); lr.position.set(0, 9.7, -2); g.add(lr);
    const beam = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffff88, emissiveIntensity: 3 })); beam.position.set(0, 10.7, -2); g.add(beam);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0x8b2222, roughness: 0.9 })); cap.position.set(0, 11.4, -2); g.add(cap);
    g.position.set(x, y, z); scene.add(g);
}

function makeGrassTexture() {
    const s = 512; const c = document.createElement('canvas'); c.width = c.height = s; const ctx = c.getContext('2d');
    ctx.fillStyle = '#4a7c3f'; ctx.fillRect(0, 0, s, s);
    ['#5a8f4a', '#3d6e34', '#52854a', '#4e8042', '#3a6930'].forEach(col => {
        for (let i = 0; i < 80; i++) { ctx.fillStyle = col; ctx.fillRect(Math.random() * s, Math.random() * s, 12 + Math.random() * 40, 8 + Math.random() * 28); }
    });
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(9, 9);
    return tex;
}
