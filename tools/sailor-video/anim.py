import cairo, math, sys, subprocess, glob, os

# Register font files with CoreText for this process (macOS), so cairo's toy API finds them.
import ctypes, ctypes.util, glob, os, sys
def register(paths):
    if sys.platform != 'darwin': return
    cf = ctypes.cdll.LoadLibrary(ctypes.util.find_library('CoreFoundation'))
    ct = ctypes.cdll.LoadLibrary(ctypes.util.find_library('CoreText'))
    cf.CFURLCreateFromFileSystemRepresentation.restype = ctypes.c_void_p
    cf.CFURLCreateFromFileSystemRepresentation.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_long, ctypes.c_bool]
    ct.CTFontManagerRegisterFontsForURL.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_void_p]
    for p in paths:
        b = os.path.abspath(p).encode()
        url = cf.CFURLCreateFromFileSystemRepresentation(None, b, len(b), False)
        ct.CTFontManagerRegisterFontsForURL(url, 1, None)
register(glob.glob(os.path.expanduser('~/Library/Fonts/Inter-*.ttf')))

W, H, FPS = 1920, 1080, 30
DUR = 56.0
MAIN_END = 41.0

# ---------- palette ----------
def hx(s, a=1.0):
    s = s.lstrip('#'); return (int(s[0:2],16)/255, int(s[2:4],16)/255, int(s[4:6],16)/255, a)
BG = hx('#F1ECE4'); INK = hx('#1F2D24'); MUTED = hx('#56635A'); LINE = hx('#DDD5C8')
CARD = hx('#FCFAF6'); BODY = hx('#3A4A3F'); TRACK = hx('#E6DFD3')
OD, OD_L = hx('#2F4637'), hx('#D3DCCF')
SP, SP_L = hx('#B07258'), hx('#EAD9CC')
CTRL = hx('#2F4637')
RED, NAVY, SKY, PUR, GRN = hx('#B5473F'), hx('#1F2D24'), hx('#5D7560'), hx('#A9822F'), hx('#3E7D4C')
STEP_COL = [RED, NAVY, SKY, PUR, GRN]
STEP_NAME = ["Catch error", "Get new config", "Recover ckpt", "Cleanup", "Restart training"]

# ---------- helpers ----------
def clamp(x, a=0, b=1): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a))
def eio(x): return 4*x*x*x if x < .5 else 1 - (-2*x+2)**3/2
def eout(x): return 1 - (1-x)**3
def ein(x): return x*x*x
def back(x, s=1.7): x -= 1; return x*x*((s+1)*x+s)+1
def lerp(a, b, k): return a + (b-a)*k
def mix(c1, c2, k): return tuple(lerp(c1[i], c2[i], k) for i in range(4))
def A(c, a): return (c[0], c[1], c[2], c[3]*a)

def rrect(c, x, y, w, h, r):
    r = min(r, w/2, h/2)
    c.new_sub_path()
    c.arc(x+w-r, y+r, r, -math.pi/2, 0); c.arc(x+w-r, y+h-r, r, 0, math.pi/2)
    c.arc(x+r, y+h-r, r, math.pi/2, math.pi); c.arc(x+r, y+r, r, math.pi, 3*math.pi/2)
    c.close_path()

def circ(c, x, y, r): c.new_sub_path(); c.arc(x, y, r, 0, 2*math.pi)
def fill(c, col): c.set_source_rgba(*col); c.fill()
def stroke(c, col, w): c.set_source_rgba(*col); c.set_line_width(w); c.stroke()

def text(c, s, x, y, size, col, bold=False, align='l', weight=None):
    c.select_font_face("Inter", cairo.FONT_SLANT_NORMAL,
                       cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    c.set_font_size(size)
    e = c.text_extents(s)
    if align == 'c': x -= e.x_advance/2
    elif align == 'r': x -= e.x_advance
    c.move_to(x, y); c.set_source_rgba(*col); c.show_text(s); c.new_path()
    return e.x_advance

def shadow(c, x, y, w, h, r, a=1.0):
    for i, al in ((10, .025), (6, .035), (3, .05)):
        rrect(c, x-i/2, y+i/2+2, w+i, h+i, r+i/2); fill(c, (0.12, 0.18, 0.14, al*a))

def pop(c, cx, cy, s):
    c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy)

# ---------- icons ----------
def cpu(c, cx, cy, s, col, a=1):
    k = 24*s
    c.set_source_rgba(*A(col, a)); c.set_line_width(3*s)
    for i in range(-2, 3):
        o = i*9*s
        for (x1, y1, x2, y2) in ((cx+o, cy-k, cx+o, cy-k-9*s), (cx+o, cy+k, cx+o, cy+k+9*s),
                                 (cx-k, cy+o, cx-k-9*s, cy+o), (cx+k, cy+o, cx+k+9*s, cy+o)):
            c.move_to(x1, y1); c.line_to(x2, y2)
    c.stroke()
    rrect(c, cx-k, cy-k, 2*k, 2*k, 6*s); fill(c, A(INK, a))
    rrect(c, cx-k*.5, cy-k*.5, k, k, 3*s); fill(c, A(col, a))

def gpu(c, cx, cy, s, col, ang, a=1):
    w, h = 104*s, 54*s
    rrect(c, cx-w/2, cy+h/2-2*s, w*.75, 8*s, 2*s); fill(c, A(hx('#A9822F'), a))
    rrect(c, cx-w/2, cy-h/2, w, h, 9*s); fill(c, A(INK, a))
    for fx in (cx-w/4+2*s, cx+w/4-2*s):
        c.arc(fx, cy, 20*s, 0, 2*math.pi); fill(c, A(hx('#3A4A3F'), a))
        for b in range(5):
            th = ang + b*2*math.pi/5
            c.move_to(fx, cy)
            c.arc(fx, cy, 17*s, th, th+0.75); c.close_path()
            fill(c, A(col, a))
        c.arc(fx, cy, 5*s, 0, 2*math.pi); fill(c, A(INK, a))

def shard(c, x, y, n, sz=34, col=SKY, a=1):
    rrect(c, x-sz/2, y-sz/2, sz, sz, 7); fill(c, A(col, a))
    rrect(c, x-sz/2, y-sz/2, sz, sz, 7); stroke(c, A(hx('#FFFFFF'), a*.9), 2)
    text(c, str(n), x, y+sz*.22, sz*.6, A(hx('#FFFFFF'), a), True, 'c')

def check(c, cx, cy, s, col):
    c.move_to(cx-6*s, cy); c.line_to(cx-1.5*s, cy+5*s); c.line_to(cx+7*s, cy-5*s)
    c.set_line_cap(cairo.LINE_CAP_ROUND); stroke(c, col, 3*s); c.set_line_cap(cairo.LINE_CAP_BUTT)

# ---------- layout ----------
CW, CH, GAP, CY = 250, 372, 30, 152
X5 = 470
X4 = 470 + (5*CW+4*GAP - (4*CW+3*GAP))/2
BUS_Y = 572
CTRL_BOX = (80, 528, 250, 88)

def card_x(i, t):
    if i == 4: return X5 + 4*(CW+GAP)
    k = eio(prog(t, 6.6, 7.7))
    return lerp(X5 + i*(CW+GAP), X4 + i*(CW+GAP), k)

def chip_rects(i, x):
    cx = x + CW/2; y = CY + 178
    if i == 0: return {'C': (cx-48, y, 96, 72)}
    return {'T': (cx-104, y, 96, 72), 'C': (cx+8, y, 96, 72)}

T_ERR = 11.4
def clean_t(i): return 28.6 + 0.45*i
def err_amt(i, t):
    return eout(prog(t, T_ERR + .12*i, T_ERR + .5 + .12*i)) * (1 - prog(t, clean_t(i), clean_t(i)+.5))
def running(t): return t < 4.75 or t > 33.0
def green_amt(t): return eout(prog(t, 33.0, 33.8))

# step-2 packet timing
def pkt_start(j): return 16.5 + .3*j
PKT_DUR = 1.5
def cfg_arrive(j): return pkt_start(j) + PKT_DUR

# step-3 shard timing
def sh_start(j): return 21.8 + 1.5*(j-1)   # j = 1..3
SH_FLY, SH_HOP = 1.15, .55

# ---------- scene pieces ----------
def draw_bg(c):
    c.set_source_rgba(*BG); c.paint()
    c.set_source_rgba(0.12, 0.18, 0.14, .07)
    for gx in range(20, W, 40):
        for gy in range(20, H, 40):
            c.rectangle(gx, gy, 2, 2)
    c.fill()

def draw_header(c, t):
    a = eout(prog(t, 0.0, 0.8))
    text(c, "Elastic training on spot instances", 80, 92, 44, A(INK, a), True)
    text(c, "How the system recovers when a node disappears", 82, 128, 22, A(MUTED, a))
    # world size panel (left)
    pa = eout(prog(t, 0.3, 1.0))
    px, py, pw, ph = 80, 190, 250, 300
    k = eio(prog(t, 7.0, 7.6))
    flash = math.sin(math.pi*prog(t, 6.9, 8.2))
    shadow(c, px, py, pw, ph, 20, pa)
    rrect(c, px, py, pw, ph, 20); fill(c, A(mix(CARD, SP_L, flash), pa))
    rrect(c, px, py, pw, ph, 20); stroke(c, A(mix(LINE, SP, flash), pa), 2.5)
    text(c, "WORLD SIZE", px+pw/2, py+44, 18, A(MUTED, pa), True, 'c')
    c.save(); c.rectangle(px, py+60, pw, 170); c.clip()
    text(c, "4", px+pw/2, py+200 - 170*k, 150, A(INK, pa*(1-k)), True, 'c')
    text(c, "3", px+pw/2, py+200 + 170*(1-k), 150, A(mix(INK, SP, flash), pa), True, 'c')
    c.restore()
    n = 4 if t < 7.3 else 3
    for d in range(4):
        dxp = px + pw/2 - 3*16 + d*32
        on = d < n
        lost = d == 3 and t >= 4.75
        col = SP if on and not lost else (RED if lost and t < 7.3 else LINE)
        circ(c, dxp, py+262, 10); fill(c, A(col, pa))
    # resumed toast
    ta = eout(prog(t, 34.6, 35.3))
    if ta > 0:
        s = "Training resumed  ·  world size 3"
        c.select_font_face("Inter", 0, 1); c.set_font_size(26); w = c.text_extents(s).x_advance + 90
        x0 = 1130 - w/2; y0 = 52 - 14*(1-ta)
        rrect(c, x0, y0, w, 56, 28); fill(c, A(GRN, ta))
        c.arc(x0+34, y0+28, 13, 0, 2*math.pi); fill(c, A(hx('#FFFFFF'), ta))
        check(c, x0+34, y0+28, 1.1, A(GRN, ta))
        text(c, s, x0+58, y0+37, 26, A(hx('#FFFFFF'), ta), True)

def draw_chip(c, t, i, key, r, col_base):
    x, y, w, h = r
    e = err_amt(i, t); g = green_amt(t)
    border = mix(mix(col_base, RED, e), GRN, g)
    bg = mix(CARD, hx('#F4E2DD'), e)
    rrect(c, x, y, w, h, 12); fill(c, bg)
    rrect(c, x, y, w, h, 12); stroke(c, border, 2.5)
    text(c, key, x+w/2, y+40, 30, INK, True, 'c')
    text(c, "train" if key == 'T' else "ckpt", x+w/2, y+62, 15, MUTED, False, 'c')

def draw_card(c, t, i):
    x = card_x(i, t); y = CY
    alpha = 1.0; dy = 0; dx = 0; grey = 0; sc = back(prog(t, .35+.14*i, .95+.14*i))
    if sc <= 0: return
    if i == 4:
        grey = eout(prog(t, 4.75, 5.3))
        shake = (1 - prog(t, 4.75, 5.7)) * (t > 4.75)
        dx = math.sin(t*70) * 7 * shake
        f = prog(t, 5.9, 6.7)
        dy = 340*ein(f); alpha = 1 - f
        if alpha <= 0: return
    c.save()
    c.push_group()
    pop(c, x+CW/2, y+CH/2, sc)
    c.translate(dx, dy)
    if i == 4: c.rotate(0.0)
    is_od = i == 0
    col, col_l = (OD, OD_L) if is_od else (SP, SP_L)
    shadow(c, x, y, CW, CH, 20)
    rrect(c, x, y, CW, CH, 20); fill(c, CARD)
    # header band
    c.save(); rrect(c, x, y, CW, CH, 20); c.clip()
    c.rectangle(x, y, CW, 64); fill(c, col_l)
    c.restore()
    e = err_amt(i, t) if i < 4 else 0
    border = mix(mix(col, RED, e), GRN, green_amt(t) if i < 4 else 0)
    rrect(c, x, y, CW, CH, 20); stroke(c, border, 2.5)
    c.arc(x+26, y+32, 7, 0, 2*math.pi); fill(c, col)
    text(c, "On-demand" if is_od else f"Spot {i}", x+42, y+41, 25, INK, True)
    # icons
    ang = (t*9 if running(t) else (4.75*9 if t < 33 else 4.75*9 + (t-33)*9)) + i
    if i == 4 and t > 4.75: ang = 4.75*9 + i
    iy = y + 116
    if is_od:
        cpu(c, x+CW/2, iy, 1.0, OD)
    else:
        gpu(c, x+CW/2-42, iy, 1.0, SP if not (t > 33) else mix(SP, GRN, green_amt(t)), ang)
        cpu(c, x+CW/2+72, iy, .82, SP)
    # chips
    for key, r in chip_rects(i, x).items():
        draw_chip(c, t, i, key, r, col)
    # bottom area
    by = y + 278
    if is_od:
        text(c, "CHECKPOINT STORE", x+CW/2, by-6, 14, MUTED, True, 'c')
        for n in range(4):
            shard(c, x+CW/2 - 63 + n*42, by+22, n, 34, SKY)
    else:
        text(c, "TRAINING", x+20, by+4, 14, MUTED, True)
        bx, bw = x+20, CW-40
        rrect(c, bx, by+16, bw, 12, 6); fill(c, TRACK)
        if running(t) and i != 4 or (i == 4 and t < 4.75):
            p = (t*.16 + i*.23) % 1 if t < 33 else ((t-33)*.16 + i*.23 + .5) % 1
        else:
            p = (4.75*.16 + i*.23) % 1
        bc = SP if t < 4.75 else (LINE if t < 33 else mix(LINE, GRN, green_amt(t)))
        if i == 4 and t >= 4.75: bc = LINE
        rrect(c, bx, by+16, max(12, bw*p), 12, 6); fill(c, bc)
        # status text
        if i == 4 and t >= 4.75: st, sc_ = "lost", RED
        elif t < 4.75: st, sc_ = "running", SP
        elif t < 33: st, sc_ = "paused", MUTED
        else: st, sc_ = "running", GRN
        text(c, st, x+CW-20, by+4, 14, sc_, True, 'r')
    # config tag
    if i < 4:
        ka = back(prog(t, cfg_arrive(i), cfg_arrive(i)+.45))
        if ka > 0:
            s = "coordinator" if is_od else f"rank {i-1}  ·  world 3"
            c.save(); pop(c, x+CW/2, y+CH-28, ka)
            c.select_font_face("Inter", 0, 1); c.set_font_size(15); tw = c.text_extents(s).x_advance
            rrect(c, x+CW/2-tw/2-14, y+CH-44, tw+28, 30, 15); fill(c, NAVY)
            text(c, s, x+CW/2, y+CH-24, 15, hx('#FFFFFF'), True, 'c')
            c.restore()
    # preempted overlay
    if grey > 0:
        rrect(c, x, y, CW, CH, 20); fill(c, (0.55, 0.53, 0.49, .55*grey))
        c.save(); pop(c, x+CW/2, y+CH/2, lerp(1.6, 1, back(prog(t, 4.9, 5.3))))
        sa = prog(t, 4.9, 5.05)
        c.translate(x+CW/2, y+CH/2); c.rotate(-0.2)
        rrect(c, -100, -26, 200, 52, 8); fill(c, A(CARD, sa))
        rrect(c, -100, -26, 200, 52, 8); stroke(c, A(RED, sa), 4)
        text(c, "PREEMPTED", 0, 10, 28, A(RED, sa), True, 'c')
        c.restore()
    c.pop_group_to_source(); c.paint_with_alpha(alpha)
    c.restore()

def draw_lightning(c, t):
    if not (4.3 < t < 5.4): return
    x = card_x(4, t) + CW/2 + 10; y1 = CY + 40
    pts = [(x+40, -20), (x-10, 40), (x+30, 50), (x-30, 110), (x+12, 118), (x-26, y1)]
    grow = eout(prog(t, 4.35, 4.6)); fade = 1 - prog(t, 4.95, 5.4)
    yy = lerp(-20, y1, grow)
    c.save(); c.rectangle(0, -40, W, yy+40); c.clip()
    for wdt, col in ((26, hx('#EAD9A0', .35*fade)), (10, hx('#C9A24A', fade)), (4, hx('#FFFFFF', fade))):
        c.move_to(*pts[0])
        for p in pts[1:]: c.line_to(*p)
        c.set_line_join(cairo.LINE_JOIN_ROUND); stroke(c, col, wdt)
    c.restore()
    fl = max(0, 1 - abs(t-4.62)/0.18)
    if fl > 0: c.set_source_rgba(1, 1, 1, .55*fl); c.paint()

def draw_controller(c, t):
    k = back(prog(t, 8.0, 8.6))
    if k <= 0: return
    x, y, w, h = CTRL_BOX
    pulse = 0
    # bus
    bus_end = card_x(3, t) + CW/2
    bp = eio(prog(t, 8.4, 9.6))
    x0 = x + w
    xe = lerp(x0, bus_end, bp)
    act = mix(CTRL, RED, max(err_amt(1, t)*0, 0))
    c.move_to(x0, BUS_Y); c.line_to(xe, BUS_Y); stroke(c, NAVY, 4)
    for i in range(4):
        cx = card_x(i, t) + CW/2
        if xe >= cx:
            dp = eout(prog(t, 8.4 + 1.2*((cx-x0)/(bus_end-x0)), 8.6 + 1.2*((cx-x0)/(bus_end-x0))))
            c.move_to(cx, BUS_Y); c.line_to(cx, lerp(BUS_Y, CY+CH, dp)); stroke(c, NAVY, 4)
            c.arc(cx, BUS_Y, 7, 0, 2*math.pi); fill(c, NAVY)
    c.save(); pop(c, x+w/2, y+h/2, k)
    shadow(c, x, y, w, h, 16)
    rrect(c, x, y, w, h, 16); fill(c, CTRL)
    text(c, "Controller", x+w/2, y+52, 28, hx('#FFFFFF'), True, 'c')
    c.arc(x+w, BUS_Y, 8, 0, 2*math.pi); fill(c, NAVY)
    c.restore()

def bus_point(j, u, t):
    """position along controller->card j path, u in [0,1]"""
    x0 = CTRL_BOX[0] + CTRL_BOX[2]; cx = card_x(j, t) + CW/2
    L1 = cx - x0; L2 = BUS_Y - (CY+CH) + 20; d = u*(L1+L2)
    if d < L1: return x0 + d, BUS_Y
    return cx, BUS_Y - (d-L1)

def draw_errors(c, t):
    for i in range(4):
        e = err_amt(i, t)
        if e <= 0: continue
        rs = chip_rects(i, card_x(i, t))
        if 'T' in rs:
            (tx, ty, tw, th), (cx_, cy_, cw, ch) = rs['T'], rs['C']
            c.move_to(tx+tw, ty+th/2); c.line_to(cx_, cy_+ch/2); stroke(c, A(RED, e), 3)
        for key, (x, y, w, h) in rs.items():
            bx, by = x+w-4, y+4
            ph = (t - T_ERR) % 1.2
            if t < clean_t(i):
                c.arc(bx, by, 14 + 26*ph, 0, 2*math.pi); stroke(c, A(RED, e*(1-ph/1.2)*.6), 3)
            s = back(prog(t, T_ERR+.12*i, T_ERR+.5+.12*i)) * (1 - eio(prog(t, clean_t(i), clean_t(i)+.5)))
            c.save(); pop(c, bx, by, max(s, 0))
            c.arc(bx, by, 15, 0, 2*math.pi); fill(c, RED)
            text(c, "!", bx, by+7, 21, hx('#FFFFFF'), True, 'c')
            c.restore()
        # e* label
        x, y, w, h = rs['C']
        text(c, "e*", x+w/2, y-10, 22, A(RED, e), True, 'c')

def draw_cleanup_fx(c, t):
    for i in range(4):
        t0 = clean_t(i)
        p = prog(t, t0, t0+.9)
        if p <= 0 or p >= 1: continue
        for key, (x, y, w, h) in chip_rects(i, card_x(i, t)).items():
            bx, by = x+w-4, y+4
            for n in range(10):
                th = n*2*math.pi/10 + i
                r = 8 + 46*eout(p)
                c.arc(bx + r*math.cos(th), by + r*math.sin(th), 5*(1-p)+1, 0, 2*math.pi)
                fill(c, A(PUR, 1-p))
            # sweep ring
            c.arc(x+w/2, y+h/2, 30 + 60*eout(p), 0, 2*math.pi); stroke(c, A(PUR, .5*(1-p)), 3)
        # card glow
        x = card_x(i, t)
        rrect(c, x-6, CY-6, CW+12, CH+12, 24); stroke(c, A(PUR, .7*math.sin(math.pi*p)), 5)

def draw_packets(c, t):
    for j in range(4):
        u = prog(t, pkt_start(j), pkt_start(j)+PKT_DUR)
        if 0 < u < 1:
            px, py = bus_point(j, eio(u), t)
            for k in range(5):
                uu = eio(max(0, u - .025*k)); qx, qy = bus_point(j, uu, t)
                c.arc(qx, qy, 11-1.8*k, 0, 2*math.pi); fill(c, A(SKY, .5 - .09*k))
            rrect(c, px-16, py-12, 32, 24, 5); fill(c, NAVY)
            rrect(c, px-16, py-12, 32, 24, 5); stroke(c, hx('#FFFFFF'), 2)
            c.move_to(px-16, py-12); c.line_to(px, py+2); c.line_to(px+16, py-12); stroke(c, hx('#FFFFFF'), 2)
        # arrival flash on chips + T-C link
        ap = prog(t, cfg_arrive(j), cfg_arrive(j)+.8)
        if 0 < ap < 1:
            rs = chip_rects(j, card_x(j, t))
            for (x, y, w, h) in rs.values():
                rrect(c, x-4-10*ap, y-4-10*ap, w+8+20*ap, h+8+20*ap, 14+6*ap); stroke(c, A(NAVY, 1-ap), 3)
        lk = prog(t, cfg_arrive(j), cfg_arrive(j)+.4) * (1 - prog(t, 27.5, 28.4))
        if j > 0 and lk > 0:
            rs = chip_rects(j, card_x(j, t))
            (tx, ty, tw, th), (cx_, cy_, cw, ch) = rs['T'], rs['C']
            c.move_to(tx+tw, ty+th/2+16); c.line_to(tx+tw + (cx_-tx-tw)*lk, ty+th/2+16); stroke(c, A(NAVY, 1), 3)

def draw_shards(c, t):
    od = card_x(0, t)
    for j in range(1, 4):
        n = j - 1
        sx, sy = od + CW/2 - 63 + n*42, CY + 278 + 22
        rs = chip_rects(j, card_x(j, t))
        tx, ty, tw, th = rs['T']; cxx, cyy, cw, ch = rs['C']
        T = (tx+tw-6, ty+th-4); C = (cxx+cw-6, cyy+ch-4)
        t0 = sh_start(j)
        u = prog(t, t0, t0+SH_FLY)
        if t < t0: continue
        # source highlight
        hl = math.sin(math.pi*prog(t, t0-.2, t0+.5))
        if hl > 0:
            rrect(c, sx-22, sy-22, 44, 44, 10); stroke(c, A(SKY, hl), 3)
        if u < 1:
            e = eio(u)
            # bezier arc above cards
            p0, p3 = (sx, sy), T
            p1 = (sx, CY - 90); p2 = (T[0], CY - 90)
            bx = (1-e)**3*p0[0] + 3*(1-e)**2*e*p1[0] + 3*(1-e)*e*e*p2[0] + e**3*p3[0]
            by = (1-e)**3*p0[1] + 3*(1-e)**2*e*p1[1] + 3*(1-e)*e*e*p2[1] + e**3*p3[1]
            # trail
            for k in range(1, 8):
                ee = eio(max(0, u - .03*k))
                qx = (1-ee)**3*p0[0] + 3*(1-ee)**2*ee*p1[0] + 3*(1-ee)*ee*ee*p2[0] + ee**3*p3[0]
                qy = (1-ee)**3*p0[1] + 3*(1-ee)**2*ee*p1[1] + 3*(1-ee)*ee*ee*p2[1] + ee**3*p3[1]
                c.arc(qx, qy, 12-1.3*k, 0, 2*math.pi); fill(c, A(SKY, .35-.04*k))
            shard(c, bx, by, n, 40 + 8*math.sin(math.pi*u))
        else:
            fade = 1 - prog(t, 30.5, 31.5) * 0  # shards stay
            land = back(prog(t, t0+SH_FLY, t0+SH_FLY+.3))
            shard(c, T[0], T[1], n, 30*max(land, .01) if land < 1 else 30)
            hu = prog(t, t0+SH_FLY+.15, t0+SH_FLY+.15+SH_HOP)
            if hu > 0:
                e = eio(hu)
                hx_ = lerp(T[0], C[0], e); hy_ = lerp(T[1], C[1], e) - 40*math.sin(math.pi*e)
                if hu < 1:
                    c.move_to(T[0], T[1]); c.line_to(hx_, hy_); stroke(c, A(SKY, .6), 2)
                shard(c, hx_, hy_, n, 30)

def draw_stepper(c, t):
    a = eout(prog(t, 10.2, 10.9))
    if a <= 0: return
    starts = [11.0, 16.0, 21.2, 28.2, 32.6]
    x0, y = 80, 660; w = (W - 160 - 4*16) / 5
    for k in range(5):
        x = x0 + k*(w+16)
        active = starts[k] <= t < (starts[k+1] if k < 4 else 99)
        done = t >= (starts[k+1] if k < 4 else 99)
        ka = eout(prog(t, starts[k], starts[k]+.4)) if active else (1 if done else 0)
        col = STEP_COL[k]
        c.save(); pop(c, x+w/2, y+32, lerp(.9, 1, a))
        rrect(c, x, y, w, 64, 32); fill(c, A(mix(CARD, col, ka if active else 0), a))
        rrect(c, x, y, w, 64, 32); stroke(c, A(mix(LINE, col, ka), a), 2.5)
        cc = mix(hx('#FFFFFF'), col, 0) if active else col
        c.arc(x+34, y+32, 19, 0, 2*math.pi)
        fill(c, A(CARD if active else (col if done else TRACK), a))
        if done: check(c, x+34, y+32, 1.2, A(hx('#FFFFFF'), a))
        else: text(c, str(k+1), x+34, y+40, 21, A(col if active else MUTED, a), True, 'c')
        text(c, STEP_NAME[k], x+64, y+40, 22, A(hx('#FFFFFF') if active else (INK if done else MUTED), a), True)
        c.restore()

CAPS = [
    (0.0, "Training on spot instances", None,
     "One reliable on-demand node plus four cheap spot nodes with GPUs. Each spot node runs",
     "a training process (T) and a checkpoint process (C)."),
    (4.3, "A spot node is preempted", SP,
     "The Cloud reclaims a spot instance without warning. The world size drops from 4 to 3,",
     "and every process that was talking to it stalls."),
    (8.0, "The controller takes over", CTRL,
     "A controller on the on-demand node stays connected to every surviving node",
     "and orchestrates the recovery in five steps."),
    (11.0, "Step 1  ·  Catch error", RED,
     "Instead of crashing, every surviving T and C process catches the failure (e*)",
     "and pauses, waiting for the controller."),
    (16.0, "Step 2  ·  Get new config", NAVY,
     "The controller computes the new topology and sends it to every node,",
     "so all processes agree on their new rank and the world size of 3."),
    (21.2, "Step 3  ·  Recover checkpoint", SKY,
     "The on-demand node keeps every checkpoint shard. Each surviving node pulls its shard",
     "into the training process, then mirrors it to its checkpoint process."),
    (28.2, "Step 4  ·  Cleanup", PUR,
     "Leftovers from the old world, such as error state and stale connections,",
     "are cleared so nothing still points at the lost node."),
    (32.6, "Step 5  ·  Restart training", GRN,
     "Training resumes on the 3 remaining nodes from the recovered state,",
     "without restarting the whole job."),
]

def draw_caption(c, t):
    x, y, w, h = 80, 764, W-160, 250
    a = eout(prog(t, 0.2, 0.9))
    shadow(c, x, y, w, h, 24, a)
    rrect(c, x, y, w, h, 24); fill(c, A(CARD, a))
    idx = max(k for k in range(len(CAPS)) if CAPS[k][0] <= t)
    cur = CAPS[idx]
    k = eout(prog(t, cur[0], cur[0]+.5)) if idx > 0 else a
    prev = CAPS[idx-1] if idx > 0 else None
    def bar_col(cp): return cp[2] or INK
    bc = mix(bar_col(prev), bar_col(cur), k) if prev else bar_col(cur)
    c.save(); rrect(c, x, y, w, h, 24); c.clip()
    c.rectangle(x, y, 12, h); fill(c, A(bc, a))
    for cp, al, off in ((prev, 1-k, -18*k), (cur, k, 18*(1-k))):
        if cp is None or al <= 0: continue
        col = cp[2] or INK
        text(c, cp[1], x+60, y+82+off, 46, A(col, al*a), True)
        text(c, cp[3], x+60, y+146+off, 31, A(BODY, al*a))
        text(c, cp[4], x+60, y+192+off, 31, A(BODY, al*a))
    c.restore()

def frame_main(c, t):
    draw_bg(c)
    draw_header(c, t)
    draw_controller(c, t)
    for i in (4, 0, 1, 2, 3): draw_card(c, t, i)
    draw_lightning(c, t)
    draw_errors(c, t)
    draw_packets(c, t)
    draw_shards(c, t)
    draw_cleanup_fx(c, t)
    draw_stepper(c, t)
    draw_caption(c, t)
    # fade in/out
    fo = 0; fi = 1 - prog(t, 0, .4)
    if max(fo, fi) > 0: c.set_source_rgba(*BG[:3], max(fo, fi)); c.paint()


RES_T = 40.4
def draw_results(c, u):
    draw_bg(c)
    a = eout(prog(u, 0.3, 1.0))
    text(c, "Results", 80, 92, 44, A(INK, a), True)
    text(c, "1.5B-parameter model  ·  8 nodes  ·  single GCP region", 82, 128, 22, A(MUTED, a))
    # ---- goodput panel ----
    px, py, pw, ph = 80, 190, 640, 620
    k = back(prog(u, 0.6, 1.3))
    c.save(); pop(c, px+pw/2, py+ph/2, lerp(.92, 1, k)); c.push_group()
    shadow(c, px, py, pw, ph, 24); rrect(c, px, py, pw, ph, 24); fill(c, CARD)
    c.rectangle(px, py+24, 12, ph-48); fill(c, GRN)
    text(c, "GOODPUT", px+48, py+60, 20, MUTED, True)
    g = eio(prog(u, 1.4, 3.6))
    text(c, f"{1+2*g:.1f}×", px+44, py+168, 110, GRN, True)
    text(c, "higher than the baseline", px+50, py+212, 24, BODY)
    base = py+ph-70; maxh = 300; bw = 150
    for n, (lab, val, col) in enumerate((("Baseline", 1, hx('#B9B2A6')), ("Our system", 3, GRN))):
        bx = px + 110 + n*240
        hh = maxh*val/3 * (eio(prog(u, 1.4, 2.2)) if n == 0 else g)
        rrect(c, bx, base-hh, bw, hh+1, 14); fill(c, col)
        if hh > 30:
            text(c, f"{1 + (val-1)*(g if n else 1):.0f}×" if n else "1×", bx+bw/2, base-hh-14, 30, col, True, 'c')
        text(c, lab, bx+bw/2, base+38, 22, INK, True, 'c')
    c.move_to(px+80, base); c.line_to(px+pw-60, base); stroke(c, LINE, 2)
    c.pop_group_to_source(); c.paint_with_alpha(clamp(k*1.5)); c.restore()
    # ---- reconfig panel ----
    px, py, pw, ph = 760, 190, 1080, 620
    k = back(prog(u, 0.85, 1.55))
    c.save(); pop(c, px+pw/2, py+ph/2, lerp(.92, 1, k)); c.push_group()
    shadow(c, px, py, pw, ph, 24); rrect(c, px, py, pw, ph, 24); fill(c, CARD)
    c.rectangle(px, py+24, 12, ph-48); fill(c, CTRL)
    text(c, "RECONFIGURATION TIME AFTER A PREEMPTION", px+48, py+60, 20, MUTED, True)
    segs = [("Distributed group init", 10, NAVY), ("DeepSpeed started", 26, PUR), ("Snapshot recovered", 16, SKY)]
    t0 = 3.0; sc = 0.1   # 1 s of real time = 0.1 s of video
    el = 0.0; times = []
    for name, d, col in segs:
        f = prog(u, t0, t0 + d*sc); times.append((t0, f)); el += d*f; t0 += d*sc
    done_t = t0
    text(c, f"{int(round(el))}", px+44, py+168, 110, INK if el < 52 else CTRL, True)
    c.select_font_face("Inter", 0, 1); c.set_font_size(110)
    nw = c.text_extents(f"{int(round(el))}").x_advance
    text(c, "s", px+52+nw, py+168, 56, MUTED, True)
    text(c, "from preemption to training again", px+50, py+212, 24, BODY)
    bx0, bx1, by = px+50, px+pw-150, py+300
    pxs = (bx1-bx0)/52
    rrect(c, bx0, by, bx1-bx0, 44, 22); fill(c, TRACK)
    c.save(); rrect(c, bx0, by, bx1-bx0, 44, 22); c.clip()
    x = bx0
    for (name, d, col), (st, f) in zip(segs, times):
        if f > 0:
            c.rectangle(x, by, d*pxs*eio(f), 44); fill(c, col)
            if f >= 1: text(c, f"{d} s", x+d*pxs/2, by+30, 20, hx('#FFFFFF'), True, 'c')
        x += d*pxs
    c.restore()
    # axis
    for s_ in range(0, 53, 10):
        xx = bx0 + s_*pxs
        c.move_to(xx, by+54); c.line_to(xx, by+62); stroke(c, LINE, 2)
        text(c, f"{s_}s", xx, by+84, 16, MUTED, False, 'c')
    # resume flag
    fk = back(prog(u, done_t, done_t+.5))
    if fk > 0:
        c.save(); pop(c, bx1+8, by+22, fk)
        c.move_to(bx1, by-14); c.line_to(bx1, by+58); stroke(c, GRN, 4)
        circ(c, bx1+50, by+22, 30); fill(c, GRN)
        c.move_to(bx1+42, by+8); c.line_to(bx1+64, by+22); c.line_to(bx1+42, by+36); c.close_path(); fill(c, hx('#FFFFFF'))
        c.restore()
        text(c, "Resume training", bx1+50, by-30, 18, A(GRN, clamp(fk)), True, 'c')
    # legend rows
    for n, ((name, d, col), (st, f)) in enumerate(zip(segs, times)):
        ry = by + 150 + n*62
        ra = eout(prog(u, st, st+.4))
        circ(c, bx0+14, ry-8, 11); fill(c, A(col, ra))
        text(c, f"{n+1}.  {name}", bx0+40, ry, 26, A(INK, ra), True)
        text(c, f"{d} s", bx1, ry, 26, A(col, ra), True, 'r')
        if n < 2:
            c.move_to(bx0, ry+26); c.line_to(bx1, ry+26); stroke(c, A(TRACK, ra), 2)
    c.pop_group_to_source(); c.paint_with_alpha(clamp(k*1.5)); c.restore()
    # takeaway
    ta = eout(prog(u, done_t+.6, done_t+1.3))
    s_ = "Back to training in under a minute, with 3× the goodput of the baseline."
    text(c, s_, W/2, 900 + 14*(1-ta), 34, A(INK, ta), True, 'c')

def frame(c, t):
    if t < RES_T + 0.9:
        frame_main(c, min(t, MAIN_END))
    if t > RES_T:
        k = eio(prog(t, RES_T, RES_T + 0.9))
        c.push_group(); draw_results(c, t - (RES_T + 0.5)); c.pop_group_to_source(); c.paint_with_alpha(k)
    fo = prog(t, DUR-.8, DUR)
    if fo > 0: c.set_source_rgba(*BG[:3], fo); c.paint()

def surface_at(t):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
    c.set_antialias(cairo.ANTIALIAS_BEST); frame(c, t); return s

if __name__ == '__main__':
    if sys.argv[1] == 'still':
        for tt in sys.argv[2:]:
            surface_at(float(tt)).write_to_png(f"still_{tt}.png")
    else:
        f0, f1, out = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        tmp = out.replace('.mp4', '.tmp.mp4')
        p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra',
                              '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264',
                              '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', tmp],
                             stdin=subprocess.PIPE)
        for fi in range(f0, f1):
            s = surface_at(fi / FPS); s.flush()
            p.stdin.write(bytes(s.get_data()))
        p.stdin.close()
        if p.wait() == 0:
            import os; os.rename(tmp, out)
