// --- Custom Cursor ---
const cursor = document.getElementById('custom-cursor');

document.addEventListener('mousemove', (e) => {
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }

    const overlay = document.getElementById('glitch-overlay');
    const heroTitle = document.querySelector('.glitch');
    const x = (window.innerWidth / 2 - e.pageX) / 25;
    const y = (window.innerHeight / 2 - e.pageY) / 25;

    if (overlay) overlay.style.transform = `translate(${x}px, ${y}px)`;
    if (heroTitle) heroTitle.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
});

// --- Game Audio Context (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playHoverSound() { playTone(200, 'square', 0.1, 0.05); }
function playClickSound() {
    playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(800, 'square', 0.1, 0.05), 50);
}

// --- Hover-to-Play YouTube Video ---
// YouTube requires ?autoplay=1&mute=1&controls=0&loop=1&playlist=ID
// We set the src on mouseenter and clear it on mouseleave to force stop
function buildYTSrc(id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0`;
}

document.addEventListener('DOMContentLoaded', () => {

    // === Hover-to-Play: project cards ===
    const cards = document.querySelectorAll('.project-card[data-vid]');
    cards.forEach(card => {
        const vid = card.dataset.vid;
        const iframe = card.querySelector('.card-iframe');

        card.addEventListener('mouseenter', () => {
            if (iframe && vid) iframe.src = buildYTSrc(vid);
            playHoverSound();
            if (cursor) cursor.classList.add('active');
        });

        card.addEventListener('mouseleave', () => {
            if (iframe) iframe.src = ''; // stops playback
            if (cursor) cursor.classList.remove('active');
        });
    });

    // === General interactable cursor + audio ===
    const interactables = document.querySelectorAll('a, .btn, .social-btn');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (cursor) cursor.classList.add('active');
            playHoverSound();
        });
        el.addEventListener('mouseleave', () => { if (cursor) cursor.classList.remove('active'); });
        el.addEventListener('click', () => playClickSound());
    });

    // === Scroll Reveal ===
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.section-title, .project-card, .skill-category, .about-terminal').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px) scale(0.97)';
        el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        observer.observe(el);
    });
});
