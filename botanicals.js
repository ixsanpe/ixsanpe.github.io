/* Alpine Botanical — line-art generator.
   Any <svg class="botanical" data-kind="fern|leaf|edelweiss|pine|ridge"> gets
   drawn as fine single-colour strokes (currentColor). Deterministic per seed. */
(function () {
    const NS = 'http://www.w3.org/2000/svg';
    const f = n => Math.round(n * 10) / 10;

    function rng(seed) {
        let s = seed >>> 0 || 1;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    // Leaf outline along +x, length L, half-width W; optional veins
    function leafPath(L, W, veins) {
        let d = `M0 0 C${f(L * 0.25)} ${f(-W * 1.15)} ${f(L * 0.75)} ${f(-W * 0.9)} ${f(L)} 0 ` +
                `C${f(L * 0.75)} ${f(W * 0.9)} ${f(L * 0.25)} ${f(W * 1.15)} 0 0 ` +
                `M0 0 Q${f(L * 0.5)} ${f(W * 0.08)} ${f(L * 0.92)} 0`;
        for (let i = 1; i <= veins; i++) {
            const x = L * (i / (veins + 1)) * 0.9;
            const reach = W * Math.sin(Math.PI * (x / L)) * 0.95;
            d += ` M${f(x)} 0 Q${f(x + L * 0.08)} ${f(-reach * 0.5)} ${f(x + L * 0.16)} ${f(-reach)}`;
            d += ` M${f(x)} 0 Q${f(x + L * 0.08)} ${f(reach * 0.5)} ${f(x + L * 0.16)} ${f(reach)}`;
        }
        return d;
    }

    function place(d, x, y, deg, s = 1) {
        return `<path d="${d}" transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)}) scale(${s})"/>`;
    }

    // Stem from (0,0) upward with a bend; leaves alternate along it
    function fern(r, { length = 320, leaves = 9, leafLen = 70, bend = 0.25, veins = 0 }) {
        const P0 = [0, 0], P1 = [length * bend, -length * 0.55], P2 = [length * bend * 0.3, -length];
        const at = t => [
            (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
            (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]
        ];
        const dir = t => {
            const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
            const dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
            return Math.atan2(dy, dx) * 180 / Math.PI;
        };
        let out = `<path d="M0 0 Q${f(P1[0])} ${f(P1[1])} ${f(P2[0])} ${f(P2[1])}"/>`;
        for (let i = 0; i < leaves; i++) {
            const t = 0.18 + (i / leaves) * 0.8;
            const [x, y] = at(t);
            const side = i % 2 ? 1 : -1;
            const ang = dir(t) + side * (38 + r() * 14);
            const L = leafLen * (1 - t * 0.55) * (0.9 + r() * 0.2);
            out += place(leafPath(L, L * 0.22, veins), x, y, ang);
        }
        const tip = dir(1);
        out += place(leafPath(leafLen * 0.45, leafLen * 0.1, 0), P2[0], P2[1], tip);
        return out;
    }

    function bigLeaf(r, { size = 260 }) {
        let out = place(leafPath(size, size * 0.36, 7), 0, 0, -62);
        out += `<path d="M0 0 Q-8 30 -24 56"/>`;
        return out;
    }

    function edelweiss(r, { size = 70 }) {
        let out = '';
        const petals = 9;
        for (let i = 0; i < petals; i++) {
            const a = (360 / petals) * i + r() * 8;
            out += place(leafPath(size * (0.85 + r() * 0.3), size * 0.17, 0), 0, 0, a);
        }
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2;
            out += `<circle cx="${f(Math.cos(a) * size * 0.14)}" cy="${f(Math.sin(a) * size * 0.14)}" r="${f(size * 0.06)}"/>`;
        }
        out += `<path d="M0 ${f(size * 0.6)} Q${f(size * 0.2)} ${f(size * 2)} ${f(-size * 0.1)} ${f(size * 3.2)}"/>`;
        out += place(leafPath(size * 0.8, size * 0.12, 0), size * 0.08, size * 1.8, 30);
        out += place(leafPath(size * 0.7, size * 0.11, 0), size * 0.05, size * 2.4, 150);
        return out;
    }

    function pine(r, { length = 260 }) {
        let out = `<path d="M0 0 Q${f(length * 0.1)} ${f(-length * 0.5)} 0 ${f(-length)}"/>`;
        const n = 26;
        for (let i = 2; i < n; i++) {
            const t = i / n;
            const y = -length * t;
            const x = Math.sin(t * Math.PI) * length * 0.07;
            const L = length * 0.2 * (1 - t * 0.6);
            [-1, 1].forEach(s => {
                const a = (s < 0 ? 180 : 0) + s * -(28 + r() * 10);
                const rad = a * Math.PI / 180;
                out += `<path d="M${f(x)} ${f(y)} L${f(x + Math.cos(rad) * L)} ${f(y + Math.sin(rad) * L)}"/>`;
            });
        }
        return out;
    }

    // Single-stroke alpine skyline: sharp peaks, soft valleys
    function ridge(r, { width = 1000, height = 120 }) {
        let x = 0, d = `M0 ${f(height * 0.85)}`;
        while (x < width) {
            const w = 60 + r() * 110;
            const peakY = height * (r() < 0.3 ? 0.02 + r() * 0.15 : 0.25 + r() * 0.35);
            const valleyY = height * (0.6 + r() * 0.35);
            const px = Math.min(x + w * (0.4 + r() * 0.2), width);
            const vx = Math.min(x + w, width);
            d += ` L${f(px)} ${f(peakY)}`;
            d += ` Q${f(px + (vx - px) * 0.5)} ${f(valleyY)} ${f(vx)} ${f(valleyY)}`;
            x = vx;
        }
        return `<path d="${d}"/>`;
    }

    const kinds = { fern, leaf: bigLeaf, edelweiss, pine, ridge };

    document.querySelectorAll('svg.botanical[data-kind]').forEach(svg => {
        const kind = kinds[svg.dataset.kind];
        if (!kind) return;
        const opts = JSON.parse(svg.dataset.opts || '{}');
        const r = rng(+svg.dataset.seed || 7);
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('fill', 'none');
        g.setAttribute('stroke', 'currentColor');
        g.setAttribute('stroke-width', svg.dataset.stroke || '1.3');
        g.setAttribute('stroke-linecap', 'round');
        g.setAttribute('stroke-linejoin', 'round');
        g.innerHTML = kind(r, opts);
        svg.appendChild(g);
        if (!svg.getAttribute('viewBox')) {
            const b = g.getBBox();
            const pad = 6;
            svg.setAttribute('viewBox', `${f(b.x - pad)} ${f(b.y - pad)} ${f(b.width + pad * 2)} ${f(b.height + pad * 2)}`);
        }
    });
})();
