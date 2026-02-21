document.addEventListener('DOMContentLoaded', () => {

    // ── 3D SPACESHIP BACKGROUND (Three.js) ───────────────────────
    const canvas = document.getElementById('bg-canvas');
    if (canvas && window.THREE) {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x06080d, 0.015);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, -10, 45); // Slightly behind and above looking down
        camera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x00ffcc, 1.5);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);
        const backLight = new THREE.DirectionalLight(0xff00ff, 1.2);
        backLight.position.set(-10, -20, -10);
        scene.add(backLight);

        // Build Spaceship Group
        const ship = new THREE.Group();

        // Hull
        const hullGeo = new THREE.ConeGeometry(1, 4, 8);
        hullGeo.rotateX(Math.PI / 2); // Point forward along Z
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.8, roughness: 0.2 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        ship.add(hull);

        // Wings
        const wingGeo = new THREE.BoxGeometry(6, 0.2, 1.5);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.7, roughness: 0.3 });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(0, 0, 1);
        ship.add(wing);

        // Cockpit
        const cockpitGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        cockpitGeo.rotateX(Math.PI / 2);
        const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.5, -0.2);
        ship.add(cockpit);

        // Engine glow
        const engineGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 8);
        engineGeo.rotateX(Math.PI / 2);
        const engineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const engine1 = new THREE.Mesh(engineGeo, engineMat);
        engine1.position.set(-1.5, 0, 1.5);
        const engine2 = new THREE.Mesh(engineGeo, engineMat);
        engine2.position.set(1.5, 0, 1.5);
        ship.add(engine1, engine2);

        scene.add(ship);

        // Add some floating debris/stars
        const starsGeo = new THREE.BufferGeometry();
        const starsPos = new Float32Array(300 * 3);
        for (let i = 0; i < 300; i++) {
            starsPos[i * 3] = (Math.random() - 0.5) * 100;
            starsPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
            starsPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
        const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.5 });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);

        // Mouse tracking
        const mouse = new THREE.Vector2(0, 0);
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Intersection plane

        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Lasers shooting
        const lasers = [];
        const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        laserGeo.rotateX(Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

        window.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            // Simple debounce or just let them spam
            const laser = new THREE.Mesh(laserGeo, laserMat);
            laser.position.copy(ship.position);

            // Fire forward from the ship's current rotation
            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion).normalize();
            laser.position.add(direction.clone().multiplyScalar(2)); // spawn a bit ahead

            laser.userData.velocity = direction.multiplyScalar(2.5); // speed
            scene.add(laser);
            lasers.push(laser);

            // Recoil effect
            ship.position.add(direction.clone().multiplyScalar(-0.5));
        });

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', onWindowResize);

        const clock = new THREE.Clock();
        const targetPos = new THREE.Vector3();

        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);
            const t = clock.getElapsedTime();

            // Find intersection on plane
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, targetPos);

            // Add bobbing to target position
            targetPos.y += Math.sin(t * 2) * 1.5;

            // Move ship towards target
            ship.position.lerp(targetPos, 4 * dt);

            // Calculate rotation
            const direction = targetPos.clone().sub(ship.position);
            const dist = direction.length();
            if (dist > 0.1) {
                direction.normalize();
                const lookPos = ship.position.clone().add(direction);
                ship.lookAt(lookPos);
                // Banking roll
                ship.rotation.z = Math.min(Math.max(-direction.x * 0.8, -Math.PI / 3), Math.PI / 3);
                // Pitch based on vertical movement
                ship.rotation.x = Math.min(Math.max(direction.y * 0.5, -Math.PI / 4), Math.PI / 4);
            } else {
                ship.rotation.z *= 0.9;
                ship.rotation.x *= 0.9;
            }

            // Move stars slightly down to simulate forward movement
            const posArray = stars.geometry.attributes.position.array;
            for (let i = 1; i < posArray.length; i += 3) {
                posArray[i] -= 2 * dt;
                if (posArray[i] < -50) posArray[i] = 50;
            }
            stars.geometry.attributes.position.needsUpdate = true;

            // Update lasers
            for (let i = lasers.length - 1; i >= 0; i--) {
                const l = lasers[i];
                l.position.add(l.userData.velocity);
                if (l.position.lengthSq() > 10000) {
                    scene.remove(l);
                    lasers.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        }
        animate();
    }

    // ── NAV SCROLL HIGHLIGHT ──────────────────────────────────────────────────
    const nav = document.getElementById('site-nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // ── PROJECT CARD HOVER-TO-PLAY ────────────────────────────────────────────
    const cards = document.querySelectorAll('.project-card[data-vid]');
    cards.forEach(card => {
        const vid = card.dataset.vid;
        const iframe = card.querySelector('.card-iframe');

        if (vid && iframe) {
            card.addEventListener('mouseenter', () => {
                // Autoplay mute loop syntax for YouTube embeds
                iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&rel=0&showinfo=0`;
            });

            card.addEventListener('mouseleave', () => {
                iframe.src = '';
            });
        }
    });

    // ── SCROLL REVEAL (Intersection Observer) ─────────────────────────────────
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.section, .project-card, .about-card, .skill-group, .clink');
    revealElements.forEach(el => {
        el.classList.add('reveal-item');
        observer.observe(el);
    });
});
