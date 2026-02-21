document.addEventListener('DOMContentLoaded', () => {

    // ── GHIBLI SLIME BACKGROUND ──────────────────────────────────────────────
    const canvas = document.getElementById('bg-canvas');
    if (canvas && window.THREE) {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shadow map setup needed?
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();

        // Soft pastel fog
        scene.fog = new THREE.FogExp2(0x1a1c29, 0.015);

        // Orthographic Camera for 2D look
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 40;
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,
            1000
        );
        camera.position.set(0, 50, 50); // Angled top-down (45 degrees)
        camera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xddeeff, 0.6); // Soft blue ambient
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2); // Warm sun
        dirLight.position.set(20, 50, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        scene.add(dirLight);

        // Toon Shading Gradient Map
        // Create a 3-step gradient texture
        const canvasMap = document.createElement('canvas');
        canvasMap.width = 3;
        canvasMap.height = 1;
        const ctx = canvasMap.getContext('2d');
        ctx.fillStyle = '#444444'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = '#888888'; ctx.fillRect(1, 0, 1, 1);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(2, 0, 1, 1);
        const gradientMap = new THREE.CanvasTexture(canvasMap);
        gradientMap.magFilter = THREE.NearestFilter;
        gradientMap.minFilter = THREE.NearestFilter;

        // Slime setup
        const slimeGroup = new THREE.Group();
        scene.add(slimeGroup);

        const slimeGeo = new THREE.SphereGeometry(1.5, 32, 32);
        // Flatten bottom slightly
        const pos = slimeGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            if (pos.getY(i) < -0.8) {
                pos.setY(i, -0.8 + (pos.getY(i) - -0.8) * 0.5);
            }
        }
        slimeGeo.computeVertexNormals();

        let currentColorStr = '#00ffcc';
        let currentColor = new THREE.Color(currentColorStr);
        const slimeMat = new THREE.MeshToonMaterial({
            color: currentColor,
            gradientMap: gradientMap
        });
        const slimeMesh = new THREE.Mesh(slimeGeo, slimeMat);
        slimeMesh.position.y = 1.2; // So it sits on the ground
        slimeMesh.castShadow = true;
        slimeMesh.receiveShadow = true;
        slimeGroup.add(slimeMesh);

        // Slime Eyes (Kawaii)
        const eyeGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.5, 1.5, 1.3);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.5, 1.5, 1.3);
        slimeGroup.add(eyeL, eyeR);

        // -- AI Companion Slime (Female with Bow) --
        const aiGroup = new THREE.Group();
        scene.add(aiGroup);

        // Offset starting position
        aiGroup.position.set(10, 0, -10);

        let aiColorStr = '#ff00ff';
        let aiColor = new THREE.Color(aiColorStr);
        const aiMat = new THREE.MeshToonMaterial({
            color: aiColor,
            gradientMap: gradientMap
        });
        const aiMesh = new THREE.Mesh(slimeGeo, aiMat);
        aiMesh.position.y = 1.2;
        aiMesh.castShadow = true;
        aiMesh.receiveShadow = true;
        aiGroup.add(aiMesh);

        // AI Eyes
        const aiEyeL = new THREE.Mesh(eyeGeo, eyeMat);
        aiEyeL.position.set(-0.5, 1.5, 1.3);
        const aiEyeR = new THREE.Mesh(eyeGeo, eyeMat);
        aiEyeR.position.set(0.5, 1.5, 1.3);
        aiGroup.add(aiEyeL, aiEyeR);

        // Bow Accessory
        const bowGeo = new THREE.TorusGeometry(0.4, 0.15, 8, 16);
        bowGeo.scale(1, 0.5, 1);
        const bowMat = new THREE.MeshToonMaterial({ color: 0xff0055, gradientMap: gradientMap });
        const bowL = new THREE.Mesh(bowGeo, bowMat);
        bowL.position.set(-0.4, 2.2, 0);
        bowL.rotation.z = Math.PI / 4;
        const bowR = new THREE.Mesh(bowGeo, bowMat);
        bowR.position.set(0.4, 2.2, 0);
        bowR.rotation.z = -Math.PI / 4;
        const bowCenterGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const bowCenter = new THREE.Mesh(bowCenterGeo, bowMat);
        bowCenter.position.set(0, 2.2, 0);
        aiGroup.add(bowL, bowR, bowCenter);

        // Forest Background Environment
        const envGroup = new THREE.Group();
        scene.add(envGroup);

        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2624, roughness: 1 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        envGroup.add(ground);

        // Tree Billboards
        const treeCount = 60;
        const treeMats = [
            new THREE.MeshBasicMaterial({ color: 0x2d4c3b, transparent: true, opacity: 0.9 }),
            new THREE.MeshBasicMaterial({ color: 0x3a5a4a, transparent: true, opacity: 0.9 }),
            new THREE.MeshBasicMaterial({ color: 0x1f362a, transparent: true, opacity: 0.9 })
        ];

        for (let i = 0; i < treeCount; i++) {
            // Quick stylized tree using a cylinder and cone instead of texture to keep it robust
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 3, 5);
            const trunkMat = new THREE.MeshToonMaterial({ color: 0x4a3b32, gradientMap: gradientMap });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);

            const leavesGeo = new THREE.ConeGeometry(2 + Math.random(), 4 + Math.random() * 2, 6);
            const leavesMat = new THREE.MeshToonMaterial({ color: [0x2d4c3b, 0x3a5a4a, 0x1f362a][Math.floor(Math.random() * 3)], gradientMap: gradientMap });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 3;

            const treeBase = new THREE.Group();
            treeBase.add(trunk);
            treeBase.add(leaves);

            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 35; // Keep center clear
            treeBase.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);

            // Random slight rotation to face camera roughly
            treeBase.rotation.y = Math.random() * Math.PI;

            trunk.castShadow = true;
            leaves.castShadow = true;
            trunk.receiveShadow = true;
            leaves.receiveShadow = true;

            envGroup.add(treeBase);
        }

        // Splats Array
        const splats = [];

        // Coins Array
        const coins = [];
        const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
        coinGeo.rotateX(Math.PI / 2); // Stand up
        const coinMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.2, gradientMap: gradientMap });

        let coinCount = 0;
        const coinUi = document.getElementById('coin-ui');
        function collectCoin() {
            coinCount++;
            if (coinUi) {
                coinUi.innerText = '🪙 ' + coinCount;
                coinUi.classList.add('bump');
                setTimeout(() => coinUi.classList.remove('bump'), 100);
            }
        }

        // Click Hint UI
        const clickHint = document.getElementById('click-hint');
        let hintVisible = true;

        // Player Interaction State
        const mouse = new THREE.Vector2(0, 0);
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const targetPos = new THREE.Vector3(0, 0, 0);

        // Player Jump
        let isJumping = false;
        let jumpTime = 0;
        const jumpDuration = 0.6;
        let jumpStart = new THREE.Vector3();
        let jumpEnd = new THREE.Vector3();

        // AI Jump & State
        let aiIsJumping = false;
        let aiJumpTime = 0;
        let aiJumpStart = new THREE.Vector3();
        let aiJumpEnd = new THREE.Vector3();
        let aiTargetPos = new THREE.Vector3(10, 0, -10);
        let aiWanderTimer = 0;

        const colors = ['#00ffcc', '#ff00ff', '#ffeb3b', '#ff5722', '#00e5ff', '#b2ff59'];

        function getNextColor(lastColor) {
            const available = colors.filter(c => c !== lastColor);
            return available[Math.floor(Math.random() * available.length)];
        }

        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, targetPos);
        });

        function triggerPlayerJump(endPos) {
            if (isJumping) return;
            isJumping = true;
            jumpTime = 0;
            jumpStart.copy(slimeGroup.position);
            jumpEnd.copy(endPos);

            if (hintVisible && clickHint) {
                hintVisible = false;
                clickHint.classList.add('hidden');
            }
        }

        window.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || isJumping) return;
            const tempEnd = new THREE.Vector3();
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, tempEnd);
            triggerPlayerJump(tempEnd);
        });

        function spawnSplat(pos, colorHex) {
            const splatGeo = new THREE.CircleGeometry(2 + Math.random(), 16);
            const splatMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8, depthWrite: false });
            const splat = new THREE.Mesh(splatGeo, splatMat);
            splat.rotation.x = -Math.PI / 2;
            splat.position.copy(pos);
            splat.position.y = 0.01; // Slightly above ground

            // Random rotation for variety
            splat.rotation.z = Math.random() * Math.PI * 2;
            // Scale randomly
            const s = 0.5 + Math.random() * 0.5;
            splat.scale.set(s, s, s);

            scene.add(splat);
            splats.push(splat);

            if (splats.length > 20) {
                const oldSplat = splats.shift();
                scene.remove(oldSplat);
                oldSplat.geometry.dispose();
                oldSplat.material.dispose();
            }
        }

        function onWindowResize() {
            const aspect = window.innerWidth / window.innerHeight;
            camera.left = -frustumSize * aspect / 2;
            camera.right = frustumSize * aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', onWindowResize);

        const clock = new THREE.Clock();
        let velocity = new THREE.Vector3();
        let lastPos = new THREE.Vector3();

        let aiVelocity = new THREE.Vector3();
        let aiLastPos = new THREE.Vector3();

        let coinSpawnTimer = 0;

        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);
            const t = clock.getElapsedTime();

            // -- COIN SPAWNING --
            coinSpawnTimer -= dt;
            if (coinSpawnTimer <= 0 && coins.length < 5) {
                // Spawn a coin every 3-5 seconds, max 5 at a time
                coinSpawnTimer = 3 + Math.random() * 2;
                const coin = new THREE.Mesh(coinGeo, coinMat);
                // Spawn randomly within a radius
                const angle = Math.random() * Math.PI * 2;
                const radius = 10 + Math.random() * 20;
                coin.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);

                // Add a glowing halo
                const glowGeo = new THREE.CircleGeometry(1.5, 16);
                const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.3, depthWrite: false });
                const glow = new THREE.Mesh(glowGeo, glowMat);
                glow.rotation.x = -Math.PI / 2;
                glow.position.y = -0.9;
                coin.add(glow);

                scene.add(coin);
                coins.push(coin);
            }

            // Update Coins & Collisions
            for (let i = coins.length - 1; i >= 0; i--) {
                const c = coins[i];
                // Spin coin
                c.rotation.y += 3 * dt;
                // Bob coin
                c.position.y = 1 + Math.sin(t * 5 + i) * 0.3;

                // Check collision with Player Slime
                if (c.position.distanceTo(slimeGroup.position) < 3.0) {
                    collectCoin();
                    scene.remove(c);
                    c.geometry.dispose();
                    coins.splice(i, 1);

                    // Trigger jump using the current cursor target position
                    const tempEnd = new THREE.Vector3();
                    raycaster.setFromCamera(mouse, camera);
                    raycaster.ray.intersectPlane(plane, tempEnd);
                    triggerPlayerJump(tempEnd);
                }
            }

            // -- AI COMPANION LOGIC --
            aiWanderTimer -= dt;
            if (aiWanderTimer <= 0 && !aiIsJumping) {
                // Pick a new random spot to wander to
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 15;
                // Stick relatively close to the player
                aiTargetPos.x = slimeGroup.position.x + Math.cos(angle) * radius;
                aiTargetPos.z = slimeGroup.position.z + Math.sin(angle) * radius;

                // 30% chance to jump instead of sliding
                if (Math.random() < 0.3) {
                    aiIsJumping = true;
                    aiJumpTime = 0;
                    aiJumpStart.copy(aiGroup.position);
                    aiJumpEnd.copy(aiTargetPos);
                }

                aiWanderTimer = 2 + Math.random() * 3; // Wait 2-5s before moving again
            }

            if (aiIsJumping) {
                aiJumpTime += dt;
                const progress = Math.min(aiJumpTime / jumpDuration, 1.0);

                const ease = 1 - Math.pow(1 - progress, 3);
                aiGroup.position.lerpVectors(aiJumpStart, aiJumpEnd, ease);

                const height = Math.sin(progress * Math.PI) * 8;
                aiGroup.position.y = height;

                if (progress < 0.5) {
                    aiMesh.scale.set(0.8, 1.4, 0.8);
                } else {
                    aiMesh.scale.set(0.9, 1.2, 0.9);
                }

                if (progress >= 1.0) {
                    aiIsJumping = false;
                    aiGroup.position.copy(aiJumpEnd);
                    aiGroup.position.y = 0;

                    aiMesh.scale.set(1.5, 0.5, 1.5);

                    aiColorStr = getNextColor(aiColorStr);
                    aiColor.set(aiColorStr);
                    aiMat.color = aiColor;

                    spawnSplat(aiGroup.position, aiColor);
                }
            } else {
                // Spring following for AI
                aiGroup.position.lerp(aiTargetPos, 3 * dt); // Slower than player
                aiGroup.position.y = 0;

                aiMesh.scale.x = THREE.MathUtils.lerp(aiMesh.scale.x, 1, 10 * dt);
                aiMesh.scale.y = THREE.MathUtils.lerp(aiMesh.scale.y, 1, 10 * dt);
                aiMesh.scale.z = THREE.MathUtils.lerp(aiMesh.scale.z, 1, 10 * dt);

                aiVelocity.subVectors(aiGroup.position, aiLastPos).divideScalar(dt);
                const aiSpeed = aiVelocity.length();

                if (aiSpeed > 2) {
                    aiMesh.scale.y = Math.max(0.7, 1 - aiSpeed * 0.01);
                    aiMesh.scale.x = Math.min(1.2, 1 + aiSpeed * 0.005);
                    aiMesh.scale.z = Math.min(1.2, 1 + aiSpeed * 0.005);

                    if (aiVelocity.lengthSq() > 0.1) {
                        aiGroup.rotation.y = Math.atan2(aiVelocity.x, aiVelocity.z);
                    }
                } else {
                    aiMesh.position.y = 1.2 + Math.sin(t * 5 + 1) * 0.1;
                    aiMesh.scale.y = 1 + Math.sin(t * 10 + 1) * 0.05;
                    aiMesh.scale.x = 1 - Math.sin(t * 10 + 1) * 0.025;
                    aiMesh.scale.z = 1 - Math.sin(t * 10 + 1) * 0.025;
                }
            }

            aiLastPos.copy(aiGroup.position);

            // -- CLICK HINT PROJECTION --
            if (hintVisible && clickHint) {
                const vector = new THREE.Vector3();
                vector.copy(slimeGroup.position);
                vector.y += 4; // float above slime
                vector.project(camera);

                // Map to 2D screen space
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

                clickHint.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            }

            // -- PLAYER SLIME LOGIC --
            if (isJumping) {
                jumpTime += dt;
                const progress = Math.min(jumpTime / jumpDuration, 1.0);

                // Parabola trajectory
                const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic for horizontal
                slimeGroup.position.lerpVectors(jumpStart, jumpEnd, ease);

                // Height arc (sin wave)
                const height = Math.sin(progress * Math.PI) * 8;
                slimeGroup.position.y = height;

                // Stretch during jump based on vertical movement
                if (progress < 0.5) {
                    slimeMesh.scale.set(0.8, 1.4, 0.8); // Stretching up
                } else {
                    slimeMesh.scale.set(0.9, 1.2, 0.9); // Falling down stretch
                }

                if (progress >= 1.0) {
                    isJumping = false;
                    slimeGroup.position.copy(jumpEnd);
                    slimeGroup.position.y = 0;

                    slimeMesh.scale.set(1.5, 0.5, 1.5);

                    // New Unique Color
                    currentColorStr = getNextColor(currentColorStr);
                    currentColor.set(currentColorStr);
                    slimeMat.color = currentColor;

                    // Update CSS global
                    document.documentElement.style.setProperty('--accent', currentColorStr);
                    // Update the glow specifically with opacity applied
                    // Optional: You can do text manipulation to set alpha, or just rely on CSS

                    // Splat
                    spawnSplat(slimeGroup.position, currentColor);
                }
            } else {
                // Spring following
                slimeGroup.position.lerp(targetPos, 5 * dt);

                // Ground level
                slimeGroup.position.y = 0;

                // Recovery lerp for scale
                slimeMesh.scale.x = THREE.MathUtils.lerp(slimeMesh.scale.x, 1, 10 * dt);
                slimeMesh.scale.y = THREE.MathUtils.lerp(slimeMesh.scale.y, 1, 10 * dt);
                slimeMesh.scale.z = THREE.MathUtils.lerp(slimeMesh.scale.z, 1, 10 * dt);

                // Calculate velocity for squash/stretch
                velocity.subVectors(slimeGroup.position, lastPos).divideScalar(dt);
                const speed = velocity.length();

                if (speed > 5) {
                    // Moving fast across ground -> stretch in move direction, squash height
                    slimeMesh.scale.y = Math.max(0.7, 1 - speed * 0.01);
                    slimeMesh.scale.x = Math.min(1.2, 1 + speed * 0.005);
                    slimeMesh.scale.z = Math.min(1.2, 1 + speed * 0.005);

                    // Rotate to face velocity
                    if (velocity.lengthSq() > 0.1) {
                        const angle = Math.atan2(velocity.x, velocity.z);
                        slimeGroup.rotation.y = angle;
                    }
                } else {
                    // Idle wobble
                    slimeMesh.position.y = 1.2 + Math.sin(t * 6) * 0.1;
                    slimeMesh.scale.y = 1 + Math.sin(t * 12) * 0.05;
                    slimeMesh.scale.x = 1 - Math.sin(t * 12) * 0.025;
                    slimeMesh.scale.z = 1 - Math.sin(t * 12) * 0.025;
                }
            }

            // Adjust eyes to always somewhat face +Z (camera block)
            // They are local to slimeGroup, which revolves. Just counter rotate
            eyeL.position.set(-0.5, 1.1, 1.3);
            eyeR.position.set(0.5, 1.1, 1.3);

            lastPos.copy(slimeGroup.position);
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
