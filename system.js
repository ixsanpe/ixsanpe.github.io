/* THE SYSTEM — an illustrated node graph of how the projects fit together.
     Data (unstructured text) → Systems (RAG + MLOps, Sailor) on Infra (Ray, GPUs & cloud) → Solutions (fitness RAG)
     Me underneath: builds the systems, gives talks, learns by building (second brain, coding harness).
   Plain SVG built from the data below; two layouts (wide / phone). Content lives in PARTS. */
(function () {
    const root = document.getElementById('system');
    if (!root) return;

    // ---------------------------------------------------------------- content
    const ARROW = '<span aria-hidden="true">→</span>';
    const PARTS = {
        overview: {
            eyebrow: 'Overview',
            title: 'How my work fits together',
            body: `<p>I enjoy working across the whole AI stack, from data to infrastructure to the products people use. So instead of a list, I show my projects as one AI system. Every node is a project I've worked on. Click one to read more.</p>
                   <p>Underneath is me: the talks I've given, and what I'm learning through my ongoing projects.</p>`
        },
        data: {
            eyebrow: 'Data',
            title: 'Unstructured data processing',
            body: `<p>Where every AI system starts: turning raw, unstructured text into clean, structured data that retrieval and models can use. Parsing, chunking and data quality come before any embedding.</p>`
        },
        rag: {
            eyebrow: 'Systems',
            title: 'RAG + MLOps',
            status: 'Side project',
            body: `<p>The engine of the fitness project: hybrid retrieval (BM25 + dense), a fine-tuned embedder and a local LLM for the answers, plus the MLOps around it: a labelled eval harness to measure every change.</p>`,
            tags: ['RAG', 'Hybrid search', 'Embeddings', 'Evals', 'MLOps'],
            links: [['projects/fitness-rag.html', `Case study ${ARROW}`]]
        },
        sailor: {
            eyebrow: 'Systems · Research project',
            title: 'Sailor: LLM training at scale',
            status: "SOSP '25",
            body: `<p>Research at ETH Zürich on making large-scale model training easier in the cloud. Sailor picks the right resources for a training job and keeps it running when machines come and go, so long trainings don't have to start over.</p>`,
            tags: ['PyTorch', 'Distributed training', 'Cloud'],
            links: [['projects/sailor-llm.html', `Case study ${ARROW}`], ['https://github.com/eth-easl/sailor', 'Code ↗', true]]
        },
        ray: {
            eyebrow: 'Infra · Scale',
            title: 'Ray Data &amp; distributed GPU training',
            status: 'Learning',
            live: true,
            body: `<p>The layer that scales the systems out: distributed data processing with Ray Data and multi-GPU training with Ray Train. I'm learning it hands-on, with notes to come.</p>`
        },
        fitness: {
            eyebrow: 'Solutions',
            title: 'RAG for fitness exercises',
            status: 'Side project',
            body: `<p>Ask in natural language and get exercises grounded in a real exercise dataset. It uses hybrid BM25 + dense retrieval with RRF, contrastive fine-tuning of the embedder (Recall@10 0.36 → 0.81) and a local LLM for the answers, all measured with a labelled eval harness.</p>`,
            tags: ['RAG', 'Hybrid search', 'Embeddings', 'Ollama'],
            links: [['projects/fitness-rag.html', `Case study ${ARROW}`], ['https://github.com/ixsanpe/fitness-ai-assistant', 'Code ↗', true]]
        },
        talks: {
            eyebrow: 'Me · Guide others',
            title: 'Talks',
            body: `<div class="item"><strong>Career Tips for Fresh Graduates</strong><p>UZH Career Night · Nov 2024</p><p><a class="read-more" href="talks/uzh-career-night-2024.html">Slides &amp; notes ${ARROW}</a></p></div>
                   <div class="item"><strong>Commencement Speech, Class of 2025</strong><p>UPV Valencia · May 2025 (in Spanish)</p><p><a class="read-more" href="https://www.youtube.com/watch?v=Q9edBOO_sYo" target="_blank" rel="noopener">Watch the video ↗</a></p></div>`
        },
        learning: {
            eyebrow: 'Me · Learning',
            title: 'Learning by building',
            status: 'Ongoing',
            live: true,
            body: `<p>Ongoing projects where I learn by building: hands-on tools I use every day, built in the open as they take shape.</p>`
        },
        brain: {
            eyebrow: 'Me · Learning',
            title: 'Second brain',
            status: 'Ongoing build',
            live: true,
            body: `<p>A second brain: using AI to capture, organise and find my notes and knowledge.</p>`
        },
        harness: {
            eyebrow: 'Me · Learning',
            title: 'Coding harness',
            status: 'Ongoing build',
            live: true,
            body: `<p>My AI development setup: the agents, tools and workflows I use to write, test and ship code with AI.</p>`
        }
    };
    // order of the index under the graph (Ixeia's node stays in the graph only)
    const PARTS_ORDER = ['overview', 'data', 'rag', 'sailor', 'ray', 'fitness', 'talks', 'brain', 'harness'];

    // ---------------------------------------------------------------- graph
    const NS = 'http://www.w3.org/2000/svg';
    // groups: [label, part to open on click (optional)]
    const GROUPS = { data: ['Data'], sys: ['Systems'], infra: ['Infra'], sol: ['Solutions'], me: ['Me'], learn: ['Learning · ongoing projects', 'learning'] };
    const NODES = {
        data:    { label: 'Unstructured data', sub: 'text',            group: 'data',  icon: 'text' },
        rag:     { label: 'RAG + MLOps',       sub: 'retrieval + evals',    group: 'sys',   icon: 'search' },
        sailor:  { label: 'Sailor project',    sub: 'LLM training',    group: 'sys',   icon: 'nn' },
        ray:     { label: 'Ray',               sub: 'scale-out',       group: 'infra', icon: 'ray', ongoing: true },
        fitness: { label: 'Fitness RAG',       sub: 'personal',        group: 'sol',   icon: 'dumbbell' },
        me:      { label: 'Ixeia',             sub: 'me',              group: 'me',    photo: 'assets/profile_train.jpg', r: 42, still: true },
        talks:   { label: 'Talks',             sub: 'guide others',    group: 'me',    icon: 'mic' },
        brain:   { label: 'Second brain',      sub: 'AI organisation', group: 'learn', icon: 'brain', ongoing: true },
        harness: { label: 'Coding harness',    sub: 'AI dev setup',    group: 'learn', icon: 'terminal', ongoing: true }
    };
    // [from, to, style]; `to` may be '@group' to point at a group's edge
    const EDGES = [
        ['data', '@sys'], ['rag', 'ray', 'dashed'], ['sailor', 'ray'], ['rag', 'fitness'],
        ['me', '@infra', 'builds'], ['me', 'talks'], ['me', '@learn']
    ];
    const LAYOUTS = {
        wide: {
            vb: [760, 613],
            groups: { data: [20, 30, 150, 348], sys: [200, 30, 340, 185], infra: [200, 228, 340, 150], sol: [570, 30, 170, 348],
                      me: [20, 413, 720, 180], learn: [370, 425, 355, 158] },
            pos: { data: [95, 210], sailor: [285, 112], rag: [455, 112], ray: [370, 300], fitness: [655, 204],
                   talks: [110, 506], me: [250, 502], brain: [470, 508], harness: [628, 508],
                   '@sys': [200, 122], '@infra': [250, 380], '@learn': [370, 502] }
        },
        narrow: {
            vb: [400, 1365],
            groups: { data: [16, 20, 368, 170], sys: [16, 220, 368, 190], infra: [16, 425, 368, 190], sol: [16, 645, 368, 160],
                      me: [16, 835, 368, 505], learn: [32, 1145, 336, 180] },
            pos: { data: [200, 95], sailor: [110, 305], rag: [290, 305], ray: [110, 510], fitness: [285, 720],
                   me: [200, 915], talks: [90, 1065], brain: [115, 1237], harness: [285, 1237],
                   '@sys': [200, 218], '@infra': [70, 617], '@learn': [285, 1145] }
        }
    };
    const ICONS = {
        text: '<path d="M-13 -13V17H8"/><path d="M-9 -17H5L12 -10V13H-9Z"/><path d="M5 -17V-10H12"/><path d="M-5 -7H4M-5 -2H8M-5 3H8M-5 8H5"/>',
        network: '<circle cx="0" cy="-10" r="4.5"/><circle cx="-11" cy="8" r="4.5"/><circle cx="11" cy="8" r="4.5"/><path d="M-2.5 -6L-8.5 4M2.5 -6L8.5 4M-6.5 8H6.5"/>',
        terminal: '<rect x="-17" y="-13" width="34" height="26" rx="3"/><path d="M-10 -4L-5 0L-10 4"/><path d="M-1 5H9"/>',
        nn: '<path d="M-14 -9L0 -13M-14 -9L0 0M-14 -9L0 13M-14 9L0 -13M-14 9L0 0M-14 9L0 13M0 -13L14 0M0 0L14 0M0 13L14 0" class="thin"/><circle cx="-14" cy="-9" r="3.2" class="dot"/><circle cx="-14" cy="9" r="3.2" class="dot"/><circle cx="0" cy="-13" r="3.2" class="dot"/><circle cx="0" cy="0" r="3.2" class="dot"/><circle cx="0" cy="13" r="3.2" class="dot"/><circle cx="14" cy="0" r="3.2" class="dot"/>',
        ray: '<path transform="translate(-14 -14) scale(1.1667)" class="logo" d="M16.153 12.826c-.63-.183-1.03.15-1.378.846-.58 1.13-1.643 1.644-2.888 1.594-1.245-.05-2.257-.63-2.788-1.776-.233-.498-.498-.664-1.046-.68-.93-.017-1.643.016-2.174 1.062-.631 1.261-2.258 1.693-3.619 1.261a3.234 3.234 0 0 1-2.257-3.22 3.198 3.198 0 0 1 2.29-3.02 3.276 3.276 0 0 1 3.702 1.327c.216.315.216.863.597.93.648.1 1.328.033 1.992.033.299 0 .316-.266.399-.465.58-1.295 1.61-1.959 2.987-1.975 1.361-.017 2.39.647 2.955 1.892.215.465.48.598.946.548.166-.017.332.016.498 0 .464-.083 1.062.282 1.344-.448.282-.73-.382-.913-.68-1.245-.847-.946-1.81-1.793-2.673-2.706-.415-.465-.763-.614-1.41-.415-1.876.614-3.619-.431-4.15-2.357-.448-1.676.714-3.535 2.44-3.917a3.293 3.293 0 0 1 3.95 2.457c.017.05.017.083.033.133.117.564.117 1.145-.132 1.626-.283.531-.133.83.249 1.195a152.61 152.61 0 0 1 3.286 3.27c.299.299.498.349.913.2 1.51-.565 2.97-.1 3.884 1.161a3.266 3.266 0 0 1-.067 3.801c-.896 1.195-2.357 1.643-3.834 1.079-.381-.15-.58-.1-.846.182a163.619 163.619 0 0 1-3.403 3.386c-.299.3-.415.532-.232.98a3.198 3.198 0 0 1-1.278 3.917A3.298 3.298 0 0 1 9.646 23c-1.062-1.062-1.228-2.688-.415-4.033a3.196 3.196 0 0 1 3.835-1.294c.498.182.78.083 1.145-.283 1.012-1.045 2.058-2.058 3.087-3.103.266-.266.68-.449.432-1.03-.233-.547-.631-.414-1.03-.431zM11.97 4.942c.913.016 1.643-.714 1.66-1.627v-.05a1.646 1.646 0 0 0-1.76-1.56 1.63 1.63 0 0 0-1.543 1.527 1.638 1.638 0 0 0 1.577 1.71zm.033 5.41a1.658 1.658 0 0 0-1.676 1.61v.084a1.73 1.73 0 0 0 1.643 1.66c.847.016 1.643-.78 1.677-1.627a1.648 1.648 0 0 0-1.577-1.71c-.017-.016-.05-.016-.067-.016zm7.088 1.694c.016.896.747 1.61 1.626 1.643a1.723 1.723 0 0 0 1.66-1.726 1.666 1.666 0 0 0-1.66-1.61 1.623 1.623 0 0 0-1.643 1.577c.017.05.017.083.017.116zM3.24 10.353a1.692 1.692 0 0 0-1.66 1.626c-.017.847.863 1.727 1.693 1.71a1.687 1.687 0 0 0 1.626-1.743 1.615 1.615 0 0 0-1.643-1.593Zm8.68 12c.98.033 1.71-.647 1.727-1.593a1.646 1.646 0 0 0-1.51-1.793 1.646 1.646 0 0 0-1.793 1.51v.233a1.609 1.609 0 0 0 1.543 1.66c0-.017.017-.017.033-.017z"/>',
        brain: '<path d="M-1 -14C-5 -17 -11 -15 -12 -10C-17 -9 -18 -2 -15 1C-18 5 -15 12 -10 12C-8 16 -3 16 -1 13Z"/><path d="M1 -14C5 -17 11 -15 12 -10C17 -9 18 -2 15 1C18 5 15 12 10 12C8 16 3 16 1 13Z"/><path d="M-6 -8Q-10 -4 -6 -1M6 -8Q10 -4 6 -1M-9 5Q-5 3 -4 8M9 5Q5 3 4 8"/>',
        gpu: '<rect x="-11" y="-11" width="22" height="22" rx="2"/><rect x="-5" y="-5" width="10" height="10" rx="1"/><path d="M-6 -11V-16M0 -11V-16M6 -11V-16M-6 11V16M0 11V16M6 11V16M-11 -6H-16M-11 0H-16M-11 6H-16M11 -6H16M11 0H16M11 6H16"/>',
        books: '<path d="M-17 15H17"/><path d="M-14 15V-9H-8V15"/><path d="M-6 15V-14H0V15"/><path d="M2 15V-5H7V15"/><path d="M9 15L13 -9L18 -8L13 15"/><path d="M-11 -4V-1M-3 -9V-6"/>',
        search: '<path d="M-17 -15H-1V11H-17Z"/><path d="M-13 -9H-5M-13 -4H-6M-13 1H-9"/><circle cx="6" cy="2" r="8"/><path d="M12 8L17 13"/>',
        boat: '<path d="M0 -17V6H13Z"/><path d="M-3 -11V6H-13Z"/><path d="M-16 9H16L11 15H-11Z"/>',
        sun: '<circle r="6"/><path d="M0 -11V-16M0 11V16M-11 0H-16M11 0H16M-8 -8L-11 -11M8 8L11 11M8 -8L11 -11M-8 8L-11 11"/>',
        dumbbell: '<path d="M-9 0H9"/><rect x="-15" y="-9" width="6" height="18" rx="1.5"/><rect x="9" y="-9" width="6" height="18" rx="1.5"/><path d="M-18 -4V4M18 -4V4"/>',
        mic: '<rect x="-4" y="-16" width="8" height="16" rx="4"/><path d="M-9 -4Q-9 6 0 6Q9 6 9 -4"/><path d="M0 6V13M-6 13H6"/><path d="M13 -12Q16 -8 13 -4"/>',
        book: '<path d="M0 -8Q-8 -13 -17 -10V10Q-8 7 0 12Q8 7 17 10V-10Q8 -13 0 -8V12"/><path d="M5 -14L7 -18M10 -12L14 -15"/>',
        chat: '<path d="M-16 -12H16V7H-3L-9 13V7H-16Z"/><circle cx="-7" cy="-2" r="1.6" class="ink-fill"/><circle cx="0" cy="-2" r="1.6" class="ink-fill"/><circle cx="7" cy="-2" r="1.6" class="ink-fill"/>'
    };

    const stage = root.querySelector('.sys-stage');
    const scene = root.querySelector('.sys-scene');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let svg, nodeEls = {}, edgeEls = [], layoutName = null, current = 'overview', drawn = false;

    const el = (tag, attrs = {}, parent) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    };

    function edgePath(a, b, ra, rb) {
        const [x1, y1] = a, [x2, y2] = b;
        const dx = x2 - x1, dy = y2 - y1;
        if (Math.abs(dx) >= Math.abs(dy)) {
            const s = Math.sign(dx);
            const sx = x1 + s * (ra + 4), ex = x2 - s * (rb + 10), m = (ex - sx) / 2;
            return `M${sx} ${y1} C${sx + m} ${y1} ${ex - m} ${y2} ${ex} ${y2}`;
        }
        const s = Math.sign(dy);
        // leaving a node downwards: start below its label, not through it
        const sy = y1 + (s > 0 ? ra + 46 : -(ra + 4)), ey = y2 - s * (rb + 10), m = (ey - sy) / 2;
        return `M${x1} ${sy} C${x1} ${sy + m} ${x2} ${ey - m} ${x2} ${ey}`;
    }

    function build(name) {
        layoutName = name;
        const L = LAYOUTS[name];
        scene.innerHTML = '';
        nodeEls = {}; edgeEls = [];
        svg = el('svg', { viewBox: `0 0 ${L.vb[0]} ${L.vb[1]}`, class: 'graph' + (drawn ? ' drawn' : ''), role: 'group', 'aria-label': 'How my projects connect' }, scene);
        const defs = el('defs', {}, svg);
        const mk = el('marker', { id: 'g-arrow', viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
        el('path', { d: 'M1 1L8 5L1 9', class: 'arrow-head' }, mk);

        // groups
        for (const id in L.groups) {
            const [x, y, w, h] = L.groups[id];
            const [name, part] = GROUPS[id];
            const g = el('g', { class: 'grp grp-' + id + (part ? ' grp-click' : '') }, svg);
            el('rect', { x, y, width: w, height: h, rx: 22 }, g);
            const t = el('text', { x: x + 18, y: y + 26, class: 'grp-label' }, g);
            t.textContent = name;
            if (part) {
                g.dataset.id = part;
                g.setAttribute('tabindex', 0);
                g.setAttribute('role', 'button');
                g.setAttribute('aria-label', `${name}: show details`);
                g.addEventListener('click', e => { e.stopPropagation(); select(part, true); });
                g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(part); } });
                nodeEls[part] = g;
            }
        }

        // edges (under nodes)
        const edgeLayer = el('g', { class: 'edges' }, svg);
        EDGES.forEach(([a, b, style]) => {
            const pa = L.pos[a], pb = L.pos[b];
            const ra = NODES[a].r || 34, rb = NODES[b] ? (NODES[b].r || 34) : -8;
            const d = edgePath(pa, pb, ra, rb);
            const g = el('g', { class: 'edge' + (style ? ' ' + style : ''), 'data-a': a, 'data-b': b }, edgeLayer);
            const p = el('path', { d, class: 'edge-line', 'marker-end': 'url(#g-arrow)' }, g);
            if (style === 'builds') {
                const t = el('text', { class: 'edge-label', 'data-mid': 1 }, g);
                t.textContent = 'builds';
            }
            if (!reduced) {
                [0, 0.5].forEach(off => {
                    const dot = el('circle', { r: 3.2, class: 'flow-dot' }, g);
                    const am = el('animateMotion', { dur: '3.2s', repeatCount: 'indefinite', begin: `${-off * 3.2}s`, path: d }, dot);
                    void am;
                });
            }
            edgeEls.push({ g, a, b, p });
        });

        // nodes
        Object.entries(NODES).forEach(([id, n], i) => {
            const [cx, cy] = L.pos[id];
            const r = n.r || 34;
            // `still` nodes (Ixeia) have no panel of their own: clicking them goes back to the overview
            const target = n.still ? 'overview' : id;
            const g = el('g', { class: `gnode grp-${n.group}`, 'data-id': id, tabindex: 0, role: 'button',
                                'aria-label': n.still ? `${n.label}: back to overview` : `${n.label}: show details`, transform: `translate(${cx} ${cy})` }, svg);
            const body = el('g', { class: 'gnode-body', style: `animation-delay:${-i * 0.7}s` }, g);
            if (n.ongoing) el('circle', { r: r + 7, class: 'ongoing-ring' }, body);
            el('circle', { r: r + 5, class: 'halo' }, body);
            el('circle', { r, class: 'disc' }, body);
            if (n.photo) {
                const cp = el('clipPath', { id: 'clip-' + id }, defs);
                el('circle', { r: r - 3 }, cp);
                el('image', { href: n.photo, x: -r, y: -r, width: 2 * r, height: 2 * r, 'clip-path': `url(#clip-${id})`, preserveAspectRatio: 'xMidYMid slice' }, body);
            } else {
                const ic = el('g', { class: 'icon' }, body);
                ic.innerHTML = ICONS[n.icon];
            }
            const t = el('text', { y: r + 20, class: 'node-label' }, g);
            t.textContent = n.label;
            const s = el('text', { y: r + 37, class: 'node-sub' }, g);
            s.textContent = n.sub;
            g.addEventListener('click', e => { e.stopPropagation(); select(target, true); });
            g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(target); } });
            g.addEventListener('mouseenter', () => highlight(id));
            g.addEventListener('mouseleave', () => highlight(current === 'overview' ? null : current));
            nodeEls[id] = g;
        });

        // edge draw-in lengths
        edgeEls.forEach(({ g, p }) => {
            const len = p.getTotalLength();
            p.style.setProperty('--len', len.toFixed(1));
            const t = g.querySelector('[data-mid]');
            if (t) { const m = p.getPointAtLength(len / 2); t.setAttribute('x', m.x + 10); t.setAttribute('y', m.y + 4); }
        });
        highlight(current === 'overview' ? null : current);
        Object.values(nodeEls).forEach(g => g.classList.toggle('active', g.dataset.id === current));
    }

    function highlight(id) {
        svg.classList.toggle('focus', !!id);
        const linked = new Set(id ? [id] : []);
        edgeEls.forEach(({ g, a, b }) => {
            const grp = b[0] === '@' ? b.slice(1) : null;
            const on = id && (a === id || b === id || (grp && ((NODES[id] && NODES[id].group === grp) || GROUPS[grp][1] === id)));
            g.classList.toggle('lit', !!on);
            if (on) { linked.add(a); linked.add(b); }
        });
        if (id === 'learning') { linked.add('brain'); linked.add('harness'); }
        Object.entries(nodeEls).forEach(([nid, g]) => g.classList.toggle('lit', linked.has(nid)));
    }

    function pickLayout() {
        const name = stage.clientWidth < 560 ? 'narrow' : 'wide';
        if (name !== layoutName) build(name);
    }
    new ResizeObserver(pickLayout).observe(stage);
    pickLayout();

    // draw edges in when the graph scrolls into view
    new IntersectionObserver((es, obs) => {
        if (es[0].isIntersecting) { drawn = true; svg.classList.add('drawn'); obs.disconnect(); }
    }, { threshold: 0.25 }).observe(stage);

    // ---------------------------------------------------------------- panel + legend
    const panel = root.querySelector('.sys-panel');
    const panelBody = root.querySelector('.sys-panel-body');
    const legend = root.querySelector('.sys-legend');

    PARTS_ORDER.forEach(id => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.id = id;
        b.textContent = id === 'overview' ? 'Overview' : (NODES[id] ? NODES[id].label : 'Learning');
        b.addEventListener('click', () => select(id));
        li.appendChild(b);
        legend.appendChild(li);
    });

    function renderPanel(id) {
        const p = PARTS[id];
        const status = p.status ? `<span class="chip${p.live ? ' live' : ''}">${p.status}</span>` : '';
        const tags = p.tags ? `<div class="tech-tags">${p.tags.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>` : '';
        const links = p.links ? `<div class="card-links">${p.links.map(([h, t, ext]) =>
            `<a class="read-more" href="${h}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`).join('')}</div>` : '';
        panelBody.innerHTML =
            `<div class="sys-panel-top"><p class="eyebrow">${p.eyebrow}</p>${status}</div>
             <h3>${p.title}</h3>${p.body}${tags}${links}`;
        panelBody.classList.remove('swap');
        void panelBody.offsetWidth;
        panelBody.classList.add('swap');
    }

    function select(id, fromGraph) {
        current = id;
        Object.values(nodeEls).forEach(g => g.classList.toggle('active', g.dataset.id === id));
        highlight(id === 'overview' ? null : id);
        legend.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
        renderPanel(id);
        // on phones the panel sits under the graph: bring it into view after a tap
        if (fromGraph && layoutName === 'narrow') panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }

    stage.addEventListener('click', e => { if (!e.target.closest('.gnode, .grp-click')) select('overview'); });

    select('overview');
})();
