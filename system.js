/* THE SYSTEM — interactive 3D "clay render" of how the projects fit together.
   Structure follows the hand-drawn guide:
     data (law docs) ⊂ end-to-end RAG + MLOps ⊂ systems: LLM training at scale + research
     scale: Ray plugs in from the side; everything flows into Solutions
     (personal: fitness, assistant · guide others: talks · learning: DSA).
   Pure CSS 3D + a small camera loop. Content lives in PARTS below. */
(function () {
    const root = document.getElementById('system');
    if (!root) return;

    // ---------------------------------------------------------------- content
    const ARROW = '<span aria-hidden="true">→</span>';
    const PARTS = {
        overview: {
            eyebrow: 'Overview',
            title: 'How my work fits together',
            body: `<p>A small data &amp; AI system, built from my projects. Raw documents feed an end-to-end RAG pipeline, which sits on infrastructure for training models at scale. Ray scales it out, and everything flows into solutions people actually use.</p>
                   <p>Click any part, or take the tour.</p>`
        },
        data: {
            eyebrow: 'Layer 1 · Data',
            title: 'Data: legal documents',
            status: 'Part of RAG project',
            body: `<p>The raw material: a corpus of legal documents that gets parsed, cleaned, chunked and indexed so it can be searched and reasoned over.</p>`,
            tags: ['Parsing', 'Chunking', 'Data quality']
        },
        rag: {
            eyebrow: 'Layer 2 · Project',
            title: 'End-to-end RAG &amp; MLOps',
            status: 'Sample project',
            body: `<p>A complete retrieval-augmented generation system over the legal documents: ingestion, embeddings and vector search, LLM answers grounded in sources, and the MLOps around it to evaluate, deploy and monitor it.</p>`,
            tags: ['RAG', 'Embeddings', 'Vector search', 'LLMs', 'MLOps']
        },
        sailor: {
            eyebrow: 'Layer 3 · Systems & research',
            title: 'Sailor: LLM training at scale',
            status: "SOSP '25",
            body: `<p>Research at ETH Zürich on automating large-scale ML training in dynamic cloud environments: elastic fault tolerance with in-CPU checkpointing and fast reconfiguration (2.87× higher goodput than state of the art), plus a resource planner that searches 100× faster than naive approaches.</p>`,
            tags: ['PyTorch', 'DeepSpeed', 'GKE', 'Distributed training'],
            links: [['projects/sailor-llm.html', `Case study ${ARROW}`], ['https://github.com/eth-easl/sailor', 'Code ↗', true]]
        },
        ray: {
            eyebrow: 'Scale',
            title: 'Ray Data &amp; distributed GPU training',
            status: 'Learning',
            live: true,
            body: `<p>The engine for scaling out: distributed data preprocessing with Ray Data streaming into multi-GPU training. Notes and experiments coming soon.</p>`,
            tags: ['Ray Data', 'Ray Train', 'PyTorch', 'GPUs']
        },
        fitness: {
            eyebrow: 'Solutions · Personal',
            title: 'RAG for fitness exercises',
            status: 'Side project',
            body: `<p>Ask in natural language and get exercises grounded in a real exercise dataset. It uses hybrid BM25 + dense retrieval with RRF, contrastive fine-tuning of the embedder (Recall@10 0.36 → 0.81) and a local LLM for the answers, all measured with a labelled eval harness.</p>`,
            tags: ['RAG', 'Hybrid search', 'Embeddings', 'Ollama'],
            links: [['projects/fitness-rag.html', `Case study ${ARROW}`], ['https://github.com/ixsanpe/fitness-ai-assistant', 'Code ↗', true]]
        },
        assistant: {
            eyebrow: 'Solutions · Personal',
            title: 'Personal assistant',
            status: 'Building',
            live: true,
            body: `<p>My own AI assistant, running on my own setup, for everyday tasks.</p>`,
            tags: ['Agents', 'Self-hosted']
        },
        talks: {
            eyebrow: 'Solutions · Guide others',
            title: 'Talks',
            body: `<div class="item"><strong>Career Tips for Fresh Graduates</strong><p>UZH Career Night · Nov 2024</p><p><a class="read-more" href="talks/uzh-career-night-2024.html">Slides &amp; notes ${ARROW}</a></p></div>
                   <div class="item"><strong>Commencement Speech, Class of 2025</strong><p>UPV Valencia · May 2025 (in Spanish)</p><p><a class="read-more" href="https://www.youtube.com/watch?v=Q9edBOO_sYo" target="_blank" rel="noopener">Watch the video ↗</a></p></div>`
        },
        learning: {
            eyebrow: 'Solutions · Learning',
            title: 'Learning: tech problems &amp; DSA',
            status: 'Ongoing',
            live: true,
            body: `<p>Working through technical problems and data structures &amp; algorithms, and writing up what I learn.</p>`,
            tags: ['DSA', 'Problem solving']
        }
    };
    const TOUR = ['overview', 'data', 'rag', 'sailor', 'ray', 'fitness', 'assistant', 'talks', 'learning'];

    // ---------------------------------------------------------------- scene geometry (plane px)
    const CENTER = { x: 190, y: 300 };
    // modules: bounds + boxes relative to module origin (z = base elevation)
    const MODULES = [
        { id: 'sailor', label: 'Sailor', sub: 'training at scale', x: 30, y: 34, w: 200, d: 128, z: 24, lz: 175,
          boxes: [
              [0, 0, 56, 56, 70, 'c-cream'], [72, 0, 56, 56, 92, 'c-cream'], [144, 0, 56, 56, 60, 'c-cream'],
              [0, 72, 56, 56, 52, 'c-cream'], [72, 72, 56, 56, 78, 'c-sage2'], [144, 72, 56, 56, 46, 'c-cream'],
              [12, 12, 32, 32, 74, 'c-sage2', 70], [156, 12, 32, 32, 64, 'c-sage2', 60]
          ] },
        { id: 'rag', label: 'RAG + MLOps', sub: 'end-to-end', x: 262, y: 168, w: 232, d: 196, z: 24, lz: 130, lpos: [200, 170],
          boxes: [
              [0, 0, 232, 196, 20, 'c-sand'],
              [140, 26, 58, 58, 64, 'c-wine', 20],
              [140, 116, 58, 54, 40, 'c-sage2', 20],
              [100, 40, 36, 10, 8, 'c-cream', 20], [166, 84, 8, 32, 8, 'c-cream', 20]
          ] },
        { id: 'data', label: 'Law docs', sub: 'data', x: 290, y: 198, w: 84, d: 112, z: 44, lz: 60, lpos: [10, 20],
          boxes: [
              [0, 0, 84, 112, 6, 'c-cream'], [4, -4, 84, 112, 6, 'c-cream', 7], [8, -8, 84, 112, 6, 'c-cream', 14], [12, -12, 84, 112, 6, 'c-cream', 21]
          ] },
        { id: 'ray', label: 'Ray', sub: 'scale', x: -200, y: 110, w: 132, d: 132, z: 0, lz: 140,
          boxes: [
              [0, 0, 132, 132, 22, 'c-sand'],
              [22, 22, 88, 88, 70, 'c-wine', 22],
              [40, 40, 52, 52, 18, 'c-cream', 92]
          ] },
        { id: 'fitness', label: 'Fitness RAG', sub: 'personal', x: 84, y: 500, w: 72, d: 72, z: 18, lz: 100,
          boxes: [[0, 0, 72, 72, 46, 'c-sage2'], [18, 18, 36, 36, 20, 'c-cream', 46]] },
        { id: 'assistant', label: 'Assistant', sub: 'personal', x: 186, y: 500, w: 72, d: 72, z: 18, lz: 96,
          boxes: [[0, 0, 72, 72, 38, 'c-forest'], [14, 14, 44, 44, 14, 'c-cream', 38]] },
        { id: 'talks', label: 'Talks', sub: 'guide others', x: 292, y: 520, w: 84, d: 40, z: 18, lz: 130,
          boxes: [[34, 18, 16, 16, 30, 'c-sand'], [0, 22, 84, 10, 62, 'c-cream', 30]] },
        { id: 'learning', label: 'Learning', sub: 'DSA', x: 398, y: 500, w: 64, d: 64, z: 18, lz: 92,
          boxes: [[0, 0, 64, 64, 14, 'c-cream'], [6, 6, 52, 52, 14, 'c-sand', 14], [12, 12, 40, 40, 14, 'c-cream', 28]] }
    ];
    const BASES = [
        { x: 0, y: 0, w: 520, d: 400, h: 24, cls: 'c-sage', label: 'Systems · LLM training at scale + research', lx: 400, ly: 70 },
        { x: 56, y: 470, w: 430, d: 150, h: 18, cls: 'c-cream', label: 'Solutions', lx: 271, ly: 610 }
    ];
    const PIPES = [
        // [x, y, w, d, z, h]
        [-68, 172, 98, 12, 26, 12],     // Ray → Sailor
        [246, 400, 14, 70, 6, 12],      // Systems → Solutions
        [230, 100, 32, 12, 30, 12]      // Sailor → RAG
    ];
    const PACKETS = [
        // x1,y1 → x2,y2 at z, count, duration
        [-68, 178, 30, 178, 46, 3, 2.4],
        [253, 400, 253, 470, 26, 3, 2.2],
        [230, 106, 262, 106, 48, 2, 1.6],
        [300, 250, 402, 225, 54, 2, 2.0],
        [431, 252, 431, 284, 66, 2, 1.8]
    ];

    // ---------------------------------------------------------------- build DOM
    const stage = root.querySelector('.sys-stage');
    const scene = root.querySelector('.sys-scene');
    const world = document.createElement('div');
    world.className = 'sys-world';
    world.style.left = -CENTER.x + 'px';
    world.style.top = -CENTER.y + 'px';
    scene.appendChild(world);

    function box(x, y, w, d, h, cls, z = 0) {
        const b = document.createElement('div');
        b.className = 'box ' + cls;
        b.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform:translateZ(${z}px)`;
        b.innerHTML =
            `<div class="face f-top" style="transform:translateZ(${h}px)"></div>` +
            `<div class="face f-front" style="height:${h}px"></div>` +
            `<div class="face f-right" style="width:${h}px"></div>`;
        return b;
    }

    function shadow(x, y, w, d, z = 0) {
        const s = document.createElement('div');
        s.className = 'shadow';
        s.style.cssText = `left:${x + 10}px;top:${y + 14}px;width:${w}px;height:${d}px;transform:translateZ(${z + 0.5}px)`;
        return s;
    }

    function label(text, sub, lz, cls = '') {
        const l = document.createElement('span');
        l.className = 'label ' + cls;
        l.style.setProperty('--lz', lz + 'px');
        l.innerHTML = text + (sub ? `<small>${sub}</small>` : '');
        return l;
    }

    // floor shadows + bases
    BASES.forEach(b => {
        world.appendChild(shadow(b.x, b.y, b.w, b.d));
        const g = document.createElement('div');
        g.className = 'base';
        g.appendChild(box(b.x, b.y, b.w, b.d, b.h, b.cls));
        const l = label(b.label, '', b.h + 4, 'base-label');
        l.style.left = b.lx + 'px';
        l.style.top = b.ly + 'px';
        g.appendChild(l);
        g.addEventListener('click', () => select('overview'));
        world.appendChild(g);
    });
    world.appendChild(shadow(-200, 110, 132, 132));

    PIPES.forEach(([x, y, w, d, z, h]) => world.appendChild(box(x, y, w, d, h, 'c-cream', z)));

    const modEls = {};
    MODULES.forEach(m => {
        const el = document.createElement('div');
        el.className = 'mod';
        el.dataset.id = m.id;
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${m.label}: show details`);
        el.style.cssText = `left:${m.x}px;top:${m.y}px;width:${m.w}px;height:${m.d}px`;
        const lift = document.createElement('div');
        lift.className = 'mod-lift';
        m.boxes.forEach(([x, y, w, d, h, cls, z = 0]) => lift.appendChild(box(x, y, w, d, h, cls, m.z + z)));
        const lab = label(m.label, m.sub, m.z + m.lz);
        if (m.lpos) { lab.style.left = m.lpos[0] + 'px'; lab.style.top = m.lpos[1] + 'px'; }
        lift.appendChild(lab);
        el.appendChild(lift);
        el.addEventListener('click', e => { e.stopPropagation(); select(m.id); });
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(m.id); } });
        world.appendChild(el);
        modEls[m.id] = { el, m };
    });

    PACKETS.forEach(([x1, y1, x2, y2, z, n, dur]) => {
        for (let i = 0; i < n; i++) {
            const p = document.createElement('div');
            p.className = 'packet';
            p.style.cssText = `--x1:${x1}px;--y1:${y1}px;--x2:${x2}px;--y2:${y2}px;--z:${z}px;--dur:${dur}s;--delay:${(-dur / n) * i}s`;
            world.appendChild(p);
        }
    });

    // ---------------------------------------------------------------- panel + legend
    const panelBody = root.querySelector('.sys-panel-body');
    const stepEl = root.querySelector('.sys-step');
    const prevBtn = root.querySelector('[data-tour="prev"]');
    const nextBtn = root.querySelector('[data-tour="next"]');
    const legend = root.querySelector('.sys-legend');

    TOUR.forEach(id => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.id = id;
        b.textContent = id === 'overview' ? 'Overview' : (MODULES.find(m => m.id === id).label);
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

    // ---------------------------------------------------------------- camera
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const BASE = { tx: 57, tz: 40 };
    const cam = { tx: 57, tz: 40, zoom: 1, cx: 0, cy: 0 };
    const target = { ...cam };
    let hover = { x: 0, y: 0, on: false };
    let current = 'overview';

    function select(id) {
        current = id;
        const step = TOUR.indexOf(id);
        Object.values(modEls).forEach(({ el }) => el.classList.toggle('active', el.dataset.id === id));
        world.classList.toggle('focus', id !== 'overview');
        legend.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
        if (id === 'overview') {
            Object.assign(target, { zoom: 1, cx: 0, cy: 0 });
        } else {
            const { m } = modEls[id];
            target.cx = -(m.x + m.w / 2 - CENTER.x);
            target.cy = -(m.y + m.d / 2 - CENTER.y);
            target.zoom = m.w < 100 ? 1.75 : 1.4;
        }
        renderPanel(id);
        stepEl.textContent = `${step + 1} / ${TOUR.length}`;
        prevBtn.disabled = step <= 0;
        nextBtn.textContent = step === TOUR.length - 1 ? 'Back to overview' : (step === 0 ? 'Start the tour' : 'Next');
        if (reduced) Object.assign(cam, target);
    }

    prevBtn.addEventListener('click', () => select(TOUR[Math.max(0, TOUR.indexOf(current) - 1)]));
    nextBtn.addEventListener('click', () => {
        const i = TOUR.indexOf(current);
        select(TOUR[i === TOUR.length - 1 ? 0 : i + 1]);
    });
    stage.addEventListener('click', e => { if (e.target === stage || e.target === scene) select('overview'); });

    stage.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = stage.getBoundingClientRect();
        hover = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5, on: true };
    });
    stage.addEventListener('pointerleave', () => { hover.on = false; });

    function fit() {
        const w = stage.clientWidth, h = stage.clientHeight;
        scene.style.setProperty('--fit', Math.min(w / 1010, h / 720, 1.05).toFixed(3));
    }
    new ResizeObserver(fit).observe(stage);
    fit();

    function apply() {
        scene.style.setProperty('--tx', cam.tx.toFixed(2) + 'deg');
        scene.style.setProperty('--tz', cam.tz.toFixed(2) + 'deg');
        scene.style.setProperty('--zoom', cam.zoom.toFixed(3));
        scene.style.setProperty('--cx', cam.cx.toFixed(1) + 'px');
        scene.style.setProperty('--cy', cam.cy.toFixed(1) + 'px');
    }

    let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);

    function loop(t) {
        requestAnimationFrame(loop);
        if (!visible) return;
        const sway = hover.on ? 0 : Math.sin(t / 2600) * 3;
        target.tz = BASE.tz + (hover.on ? hover.x * 14 : sway);
        target.tx = BASE.tx + (hover.on ? hover.y * -8 : Math.cos(t / 3400) * 1.2);
        const k = 0.07;
        for (const key of ['tx', 'tz', 'zoom', 'cx', 'cy']) cam[key] += (target[key] - cam[key]) * k;
        apply();
    }

    select('overview');
    Object.assign(cam, target);
    apply();
    if (!reduced) requestAnimationFrame(loop);

    // ---------------------------------------------------------------- deep links
    // #sailor, #talks, … open that part; old anchors (#work, #recognition-stage, #awards) still resolve.
    const ALIASES = { work: 'portfolio', system: 'portfolio', 'recognition-stage': 'recognition', awards: 'recognition' };
    function fromHash() {
        const h = decodeURIComponent(location.hash.slice(1));
        if (!h) return;
        let dest = ALIASES[h];
        if (PARTS[h] && h !== 'overview') { select(h); dest = 'portfolio'; }
        if (!dest) return;
        history.replaceState(null, '', '#' + dest);
        const el = document.getElementById(dest);
        if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
    window.addEventListener('load', fromHash, { once: true });
})();
