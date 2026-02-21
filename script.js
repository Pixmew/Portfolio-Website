document.addEventListener('DOMContentLoaded', () => {

    // ── BACKGROUND PARTICLES (Lightweight, No Three.js) ───────────────────────
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = Math.floor((w * h) / 12000); // Responsive amount

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.5 + 0.5,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.5 + 0.1
            });
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 204, ${p.alpha})`;
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        draw();

        window.addEventListener('resize', () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        });
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
