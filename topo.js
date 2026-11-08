/* TOPO — animated contour-line map on <canvas data-topo>.
   Perlin-noise terrain + a summit bump, traced with marching squares.
   The cursor lifts the terrain, so contour lines bend around it.
   Options (data attributes): data-summit="x,y" (0–1), data-scale, data-levels. */
(function () {
    // ---- Perlin noise (seeded) ----
    const perm = new Uint8Array(512);
    (function seed(s) {
        const p = [...Array(256).keys()];
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    })(42);
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);
    function grad(h, x, y, z) {
        const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    function noise(x, y, z) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = fade(x), v = fade(y), w = fade(z);
        const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
        return lerp(
            lerp(lerp(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u),
                 lerp(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
            lerp(lerp(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u),
                 lerp(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function Topo(canvas) {
        const ctx = canvas.getContext('2d');
        const cell = 9;
        const scale = +(canvas.dataset.scale || 0.0028);
        const levels = +(canvas.dataset.levels || 14);
        const [sx, sy] = (canvas.dataset.summit || '0.78,0.42').split(',').map(Number);
        let w = 0, h = 0, cols = 0, rows = 0, field = null, dpr = 1;
        let mouse = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0 };
        let color = '31,77,58', alpha = 0.16, accent = '#d9481f';
        let visible = true, t = Math.random() * 10, raf = null, last = 0;

        function readColors() {
            const cs = getComputedStyle(document.documentElement);
            color = cs.getPropertyValue('--contour').trim() || color;
            alpha = parseFloat(cs.getPropertyValue('--contour-alpha')) || alpha;
            accent = cs.getPropertyValue('--route').trim() || accent;
        }

        function resize() {
            const r = canvas.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = r.width; h = r.height;
            canvas.width = w * dpr; canvas.height = h * dpr;
            cols = Math.ceil(w / cell) + 1; rows = Math.ceil(h / cell) + 1;
            field = new Float32Array(cols * rows);
            draw();
        }

        function compute() {
            const cx = sx * w, cy = sy * h, R = Math.max(w, h) * 0.32;
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    const x = i * cell, y = j * cell;
                    let v = noise(x * scale, y * scale, t) * 0.55
                          + noise(x * scale * 2.1, y * scale * 2.1, t * 1.3) * 0.25;
                    const d2 = ((x - cx) ** 2 + (y - cy) ** 2) / (R * R);
                    v += Math.exp(-d2 * 1.6) * 0.9;                       // summit
                    const m2 = ((x - mouse.x) ** 2 + (y - mouse.y) ** 2) / (150 * 150);
                    v += Math.exp(-m2) * 0.35 * mouse.s;                            // cursor peak
                    field[j * cols + i] = v;
                }
            }
        }

        function draw() {
            if (!field) return;
            compute();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const min = -0.5, max = 1.4;
            for (let k = 1; k < levels; k++) {
                const iso = min + (max - min) * (k / levels);
                const major = k % 4 === 0;
                ctx.beginPath();
                for (let j = 0; j < rows - 1; j++) {
                    for (let i = 0; i < cols - 1; i++) {
                        const a = field[j * cols + i], b = field[j * cols + i + 1];
                        const c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
                        const idx = (a > iso) | ((b > iso) << 1) | ((c > iso) << 2) | ((d > iso) << 3);
                        if (idx === 0 || idx === 15) continue;
                        const x = i * cell, y = j * cell;
                        const top = [x + cell * (iso - a) / (b - a), y];
                        const right = [x + cell, y + cell * (iso - b) / (c - b)];
                        const bottom = [x + cell * (iso - d) / (c - d), y + cell];
                        const left = [x, y + cell * (iso - a) / (d - a)];
                        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
                        switch (idx) {
                            case 1: case 14: seg(left, top); break;
                            case 2: case 13: seg(top, right); break;
                            case 3: case 12: seg(left, right); break;
                            case 4: case 11: seg(right, bottom); break;
                            case 5: seg(left, top); seg(right, bottom); break;
                            case 6: case 9: seg(top, bottom); break;
                            case 7: case 8: seg(left, bottom); break;
                            case 10: seg(top, right); seg(bottom, left); break;
                        }
                    }
                }
                ctx.strokeStyle = `rgba(${color}, ${major ? alpha * 2.2 : alpha})`;
                ctx.lineWidth = major ? 1.2 : 0.8;
                ctx.stroke();
            }
            // summit marker
            ctx.fillStyle = accent;
            ctx.save();
            ctx.translate(sx * w, sy * h);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
        }

        function loop(now) {
            raf = requestAnimationFrame(loop);
            if (!visible || now - last < 33) return;   // ~30 fps
            last = now;
            t += 0.0035;
            mouse.x += (mouse.tx - mouse.x) * 0.12;
            mouse.y += (mouse.ty - mouse.y) * 0.12;
            mouse.s += (mouse.ts - mouse.s) * 0.08;
            draw();
        }

        canvas.parentElement.addEventListener('pointermove', e => {
            const r = canvas.getBoundingClientRect();
            mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
            if (mouse.s < 0.01) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
            mouse.ts = 1;
        });
        canvas.parentElement.addEventListener('pointerleave', () => { mouse.ts = 0; });

        new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
        new ResizeObserver(resize).observe(canvas);
        new MutationObserver(() => { readColors(); draw(); })
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        readColors();
        resize();
        if (!reduced) raf = requestAnimationFrame(loop);
    }

    document.querySelectorAll('canvas[data-topo]').forEach(c => Topo(c));
})();
