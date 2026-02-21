// --- Overlay Panel: renders portfolio content inside HTML overlays ---

let panelEl, panelTitle, panelBody, panelClose;
let isOpen = false;
let currentZoneId = null;

const PROJECTS = [
    { title: 'Laundry Restock DIY', vid: 'zb9QKkiSRX8', tags: ['Unity', 'C#', 'Simulation'], desc: 'Relaxing simulation — organise a laundry room, sort, fill and restock with satisfying ASMR feedback.' },
    { title: 'Burger Chef', vid: 'TbkW4vawJFk', tags: ['Unity', 'C#', 'Simulation'], desc: 'Puzzle game — stack the right ingredients, unlock toppings and cook the perfect burger.' },
    { title: 'Myth Monster Hunter', vid: 'EBxXDO2tP9I', tags: ['Unity', 'C#', 'Adventure'], desc: 'Immersive ocean adventure — cast lines, catch fish and mythical creatures with custom rod physics.' },
    { title: 'Drag and Merge', vid: 'DclRxS_hcMc', tags: ['Hyper Casual', 'Puzzle'], desc: 'Untangle tangled lovers — click, drag and solve every puzzle to reunite them.' },
    { title: 'Swipe Attack 3D', vid: '93WNVEmMP9Y', tags: ['Hyper Casual', '3D'], desc: 'Swap places with enemies to eliminate them — dodge, think fast and survive every unique level.' },
    { title: 'Makeup Factory Tycoon', vid: null, tags: ['Simulation', 'Tycoon'], desc: 'Build and manage makeup factories — craft arms, set up production lines, advertise and research upgrades.' },
    { title: 'Camo Shooter 3D', vid: 'bRjcQQOWBy4', tags: ['Hyper Casual', 'Shooter'], desc: 'You are a sniper — scan the battlefield, find camouflaged enemies and take them out first.' },
    { title: 'Army Snake', vid: 't9O8PL6xgPE', tags: ['Action', 'Arcade'], desc: 'Command a snake-formation of soldiers — defeat enemy armies, earn cash and upgrade your unit.' },
];

const SKILLS = [
    { category: 'Engines & Graphics', items: ['Unity 3D', 'Unreal Engine 5', 'Custom Engines', 'HLSL & Post-Proc'] },
    { category: 'Languages & Logic', items: ['C#', 'C++', 'Python', 'AI Dev Workflows'] },
    { category: 'Design & Tools', items: ['Blender', 'Figma', 'Adobe Photoshop', 'Perforce & Git'] },
];

export function createPanel() {
    panelEl = document.getElementById('overlay-panel');
    panelTitle = document.getElementById('panel-title');
    panelBody = document.getElementById('panel-body');
    panelClose = document.getElementById('panel-close');

    panelClose.addEventListener('click', closePanel);
    document.addEventListener('keydown', e => {
        if (e.code === 'Escape') closePanel();
    });
}

export function openPanel(zone) {
    if (!panelEl) return;
    currentZoneId = zone.id;
    isOpen = true;

    panelTitle.textContent = zone.icon + ' ' + zone.label;
    panelTitle.style.color = '#' + zone.color.toString(16).padStart(6, '0');

    panelBody.innerHTML = buildPanelContent(zone.id);
    panelEl.classList.remove('hidden');
    panelEl.classList.add('open');

    // Wire up hover-to-play after innerHTML set
    if (zone.id === 'projects') wireVideoCards();
}

export function closePanel() {
    if (!panelEl) return;
    isOpen = false;
    currentZoneId = null;
    panelEl.classList.remove('open');
    panelEl.classList.add('hidden');
    // Kill any playing iframes
    panelEl.querySelectorAll('iframe').forEach(f => { f.src = ''; });
}

export function isPanelOpen() { return isOpen; }

// ---- Content Builders ----

function buildPanelContent(id) {
    switch (id) {
        case 'about': return buildAbout();
        case 'projects': return buildProjects();
        case 'skills': return buildSkills();
        case 'contact': return buildContact();
        default: return '';
    }
}

function buildAbout() {
    return `
    <div class="panel-about">
        <div class="about-terminal">
            <div class="terminal-header">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
                <span class="terminal-title">yash@sys:~$ cat profile.txt</span>
            </div>
            <div class="terminal-body">
                <p>As a game developer with 3+ years of focused industry experience and the proper foundation
                   with education in Computer Sciences, I am highly skilled in programming and designing.</p>
                <br>
                <p>My professional skills such as C#, C++, Unity, and Blender are backed by solid interpersonal
                   skills. I am passionate about creating the best in game development and showcasing my
                   creativity through my portfolio.</p>
                <span class="cursor-blink">_</span>
            </div>
        </div>
        <div class="about-stats">
            <div class="stat-card"><span class="stat-num">3+</span><span class="stat-label">Years XP</span></div>
            <div class="stat-card"><span class="stat-num">8+</span><span class="stat-label">Games Shipped</span></div>
            <div class="stat-card"><span class="stat-num">∞</span><span class="stat-label">Passion</span></div>
        </div>
    </div>`;
}

function buildProjects() {
    const cards = PROJECTS.map(p => `
        <div class="project-card ${p.vid ? 'has-video' : ''}" ${p.vid ? `data-vid="${p.vid}"` : ''}>
            <div class="card-media">
                <div class="card-thumb"></div>
                ${p.vid ? `
                <div class="card-video-wrap">
                    <iframe class="card-iframe" src="" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <div class="card-play-hint">&#9654; HOVER TO PLAY</div>` : ''}
            </div>
            <div class="project-info">
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
                <div class="tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
            </div>
        </div>`).join('');
    return `<div class="projects-grid">${cards}</div>`;
}

function buildSkills() {
    const cats = SKILLS.map(s => `
        <div class="skill-category">
            <h3>${s.category}</h3>
            <ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>`).join('');
    return `<div class="skills-container">${cats}</div>`;
}

function buildContact() {
    return `
    <div class="contact-section-inner">
        <p class="contact-tagline">Ready to build something amazing together? Let's talk.</p>
        <div class="social-links">
            <a href="mailto:yashshete45@gmail.com" class="social-btn" id="btn-email">Email</a>
            <a href="https://www.linkedin.com/in/yash-shete-b36aa1182/" target="_blank" rel="noopener noreferrer" class="social-btn" id="btn-linkedin">LinkedIn</a>
            <a href="https://universeyash4.wixsite.com/yashsheteportfolio" target="_blank" rel="noopener noreferrer" class="social-btn" id="btn-portfolio">Full Portfolio</a>
        </div>
        <div class="contact-beacon">
            <div class="beacon-ring r1"></div>
            <div class="beacon-ring r2"></div>
            <div class="beacon-ring r3"></div>
            <span class="beacon-icon">📡</span>
        </div>
    </div>`;
}

function buildYTSrc(id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0`;
}

function wireVideoCards() {
    const cards = panelEl.querySelectorAll('.project-card[data-vid]');
    cards.forEach(card => {
        const vid = card.dataset.vid;
        const iframe = card.querySelector('.card-iframe');
        card.addEventListener('mouseenter', () => {
            if (iframe && vid) iframe.src = buildYTSrc(vid);
        });
        card.addEventListener('mouseleave', () => {
            if (iframe) iframe.src = '';
        });
    });
}
