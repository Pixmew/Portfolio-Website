document.addEventListener('DOMContentLoaded', () => {

    // ── 3D SPACESHIP BACKGROUND (Three.js) ───────────────────────
    const canvas = document.getElementById('bg-canvas');
    if (canvas && window.THREE) {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x06080d, 0.015);

        // TOP-DOWN CAMERA
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, 60, 0); // Looking straight down
        camera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x00ffcc, 1.5);
        dirLight.position.set(10, 30, 10);
        scene.add(dirLight);
        const backLight = new THREE.DirectionalLight(0xff00ff, 1.2);
        backLight.position.set(-10, 10, -10);
        scene.add(backLight);

        // Ship Container (handles position & yaw)
        const shipContainer = new THREE.Group();
        scene.add(shipContainer);

        // Ship Model (handles roll and pitch relative to container)
        const ship = new THREE.Group();
        shipContainer.add(ship);

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
        const cockpitGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
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

        // Starfield
        const starsGeo = new THREE.BufferGeometry();
        const starsPos = new Float32Array(300 * 3);
        for (let i = 0; i < 300; i++) {
            starsPos[i * 3] = (Math.random() - 0.5) * 100;
            starsPos[i * 3 + 1] = (Math.random() - 0.5) * 40 - 20; // Y depth
            starsPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
        const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.5 });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);

        // Mouse tracking on X/Z plane
        const mouse = new THREE.Vector2(0, 0);
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Game Entities
        const lasers = [];
        const asteroids = [];
        const particles = [];

        const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        laserGeo.rotateX(Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

        const astGeo = new THREE.DodecahedronGeometry(1.5, 0);
        const astMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

        window.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;

            const laser = new THREE.Mesh(laserGeo, laserMat);
            laser.position.copy(shipContainer.position);

            // Fire forward from the container's current rotation
            const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(shipContainer.quaternion).normalize();
            laser.position.add(direction.clone().multiplyScalar(2)); // spawn a bit ahead

            laser.userData.velocity = direction.multiplyScalar(3.0);
            scene.add(laser);
            lasers.push(laser);

            // Recoil
            shipContainer.position.add(direction.clone().multiplyScalar(-0.5));
        });

        // Combo UI
        let comboCount = 0;
        const comboEl = document.getElementById('combo-ui');
        function addCombo() {
            comboCount++;
            if (comboEl) {
                comboEl.innerText = 'COMBO: ' + comboCount;
                comboEl.classList.add('visible');
                comboEl.classList.add('bump');
                setTimeout(() => comboEl.classList.remove('bump'), 100);
            }
        }

        function createBlast(pos) {
            const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
            for (let i = 0; i < 10; i++) {
                const p = new THREE.Mesh(pGeo, pMat);
                p.position.copy(pos);
                p.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
                p.userData.life = 1.0;
                scene.add(p);
                particles.push(p);
            }
        }

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

            // Intersect mouse with X/Z plane
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, targetPos);

            // Move container towards target
            shipContainer.position.lerp(targetPos, 4 * dt);

            // Calculate rotation for container
            const direction = targetPos.clone().sub(shipContainer.position);
            const dist = direction.length();
            if (dist > 0.1) {
                direction.normalize();
                const lookPos = shipContainer.position.clone().add(direction);
                shipContainer.lookAt(lookPos);

                // Bank (roll) and Pitch based on mouse pos
                ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, -mouse.x * Math.PI / 3, 5 * dt);
                ship.rotation.x = THREE.MathUtils.lerp(ship.rotation.x, mouse.y * Math.PI / 6, 5 * dt);
            } else {
                ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, 0, 5 * dt);
                ship.rotation.x = THREE.MathUtils.lerp(ship.rotation.x, 0, 5 * dt);
            }

            // Add bobbing to inner ship
            ship.position.y = Math.sin(t * 3) * 0.5;

            // Move stars towards +Z to simulate moving forward
            const posArray = stars.geometry.attributes.position.array;
            for (let i = 2; i < posArray.length; i += 3) {
                posArray[i] += 15 * dt;
                if (posArray[i] > 50) posArray[i] = -50;
            }
            stars.geometry.attributes.position.needsUpdate = true;

            // Spawn asteroids
            if (Math.random() < 0.03) {
                const ast = new THREE.Mesh(astGeo, astMat);
                const angle = Math.random() * Math.PI * 2;
                const radius = 50;
                ast.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

                const target = new THREE.Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
                ast.userData.velocity = target.sub(ast.position).normalize().multiplyScalar(10 * dt + Math.random() * 0.2);
                ast.userData.rotSpeed = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.05);
                scene.add(ast);
                asteroids.push(ast);
            }

            // Update lasers
            for (let i = lasers.length - 1; i >= 0; i--) {
                const l = lasers[i];
                l.position.add(l.userData.velocity);
                if (l.position.lengthSq() > 10000) {
                    scene.remove(l);
                    lasers.splice(i, 1);
                }
            }

            // Update asteroids & collisions
            for (let i = asteroids.length - 1; i >= 0; i--) {
                let a = asteroids[i];
                a.position.add(a.userData.velocity);
                a.rotation.x += a.userData.rotSpeed.x;
                a.rotation.y += a.userData.rotSpeed.y;
                a.rotation.z += a.userData.rotSpeed.z;

                let astRemoved = false;

                // Ship collision
                if (a.position.distanceTo(shipContainer.position) < 3.0) {
                    createBlast(a.position);
                    scene.remove(a);
                    asteroids.splice(i, 1);
                    addCombo();
                    astRemoved = true;
                    // Extra recoil and wobble on hit
                    shipContainer.position.z -= 2;
                    ship.rotation.z += Math.PI / 2;
                    continue;
                }

                // Laser collision
                if (!astRemoved) {
                    for (let j = lasers.length - 1; j >= 0; j--) {
                        let l = lasers[j];
                        if (l.position.distanceTo(a.position) < 2.5) {
                            createBlast(a.position);
                            scene.remove(a);
                            asteroids.splice(i, 1);
                            scene.remove(l);
                            lasers.splice(j, 1);
                            addCombo();
                            astRemoved = true;
                            break;
                        }
                    }
                }

                // Remove out of bounds
                if (!astRemoved && a.position.lengthSq() > 10000) {
                    scene.remove(a);
                    asteroids.splice(i, 1);
                }
            }

            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.position.add(p.userData.velocity);
                p.userData.life -= dt * 2;
                p.scale.setScalar(Math.max(0, p.userData.life));
                if (p.userData.life <= 0) {
                    scene.remove(p);
                    particles.splice(i, 1);
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
