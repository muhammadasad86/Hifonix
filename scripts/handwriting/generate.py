"""
Hand-writing data for script titles (Cintarini).

For each title this builds, in font units (1 em = 1000):
  * `fill`    – the exact glyph outlines (what the browser would render), and
  * `strokes` – ordered pen strokes traced from the glyph skeletons, each with
                its length and nib width.
At runtime the strokes are drawn into an SVG mask (stroke-dashoffset) that
reveals the filled outlines, so each letter appears exactly as a pen writes it.

Run:  python3 scripts/handwriting/generate.py  (needs fontTools, Pillow, scikit-image, scipy)
"""
import json, math, sys
from collections import defaultdict
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from skimage.morphology import skeletonize, remove_small_objects
from scipy.ndimage import distance_transform_edt

FONT = sys.argv[1] if len(sys.argv) > 1 else 'public/fonts/Cintarini-Regular.ttf'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'src/ui/handwriting/titles.ts'
TITLES = {
    'artisan-audio': 'Artisan Audio',
    'headphones': 'Headphones',
    'hi-fi': 'Hi-Fi',
    'hifonix-line-1': 'Hifonix - For',
    'hifonix-line-2': 'the love of music',
}
PX = 6  # raster px per 10 font units  (em = 600px)
S = PX / 10.0

font = TTFont(FONT)
cmap = font.getBestCmap()
gs = font.getGlyphSet()
hmtx = font['hmtx']
upm = font['head'].unitsPerEm
ascent, descent = font['hhea'].ascent, font['hhea'].descent

# --- default-on ligatures (GSUB 'liga'), applied the way a browser shapes text
ligs = {}
gsub = font['GSUB'].table
for fr in gsub.FeatureList.FeatureRecord:
    if fr.FeatureTag != 'liga':
        continue
    for li in fr.Feature.LookupListIndex:
        lk = gsub.LookupList.Lookup[li]
        for st in lk.SubTable:
            if lk.LookupType == 7:
                st = st.ExtSubTable
            if hasattr(st, 'ligatures'):
                for first, lst in st.ligatures.items():
                    for lg in lst:
                        ligs.setdefault(first, []).append((lg.Component, lg.LigGlyph))

def shape(text):
    names = [cmap[ord(c)] for c in text]
    out, i = [], 0
    while i < len(names):
        best = None
        for comp, lg in sorted(ligs.get(names[i], []), key=lambda x: -len(x[0])):
            if names[i + 1:i + 1 + len(comp)] == list(comp):
                best = (lg, len(comp)); break
        if best:
            out.append(best[0]); i += 1 + best[1]
        else:
            out.append(names[i]); i += 1
    return out

def outline(glyphs):
    pen = SVGPathPen(gs); bp = BoundsPen(gs)
    x = 0
    for g in glyphs:
        gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))  # y down
        gs[g].draw(TransformPen(bp, (1, 0, 0, -1, x, 0)))
        x += hmtx[g][0]
    return pen.getCommands(), x, [round(v) for v in bp.bounds]

def raster(glyphs, width):
    W = int(width * S) + 1400; H = int((ascent - descent) * S) + 200
    img = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(img)
    pf = ImageFont.truetype(FONT, int(upm * S), layout_engine=ImageFont.Layout.RAQM)
    ox, oy = 200, 100 + ascent * S  # baseline origin
    # draw glyph by glyph via its outline polygons (exact match to `outline`)
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    x0 = 0
    mask = Image.new('L', (W, H), 0)
    for g in glyphs:
        rp = DecomposingRecordingPen(gs); gs[g].draw(rp)
        polys, cur = [], []
        def q(p0, p1, p2, n=12):
            return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in np.linspace(0,1,n)[1:]]
        def c(p0,p1,p2,p3,n=14):
            return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0], (1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1]) for t in np.linspace(0,1,n)[1:]]
        for op, args in rp.value:
            if op == 'moveTo': cur = [args[0]]
            elif op == 'lineTo': cur.append(args[0])
            elif op == 'qCurveTo':
                pts = list(args); p0 = cur[-1]
                # implied on-curve points between consecutive off-curve points
                offs, on = pts[:-1], pts[-1]
                if on is None: offs, on = pts, None
                seq = []
                for k in range(len(offs)):
                    p1 = offs[k]
                    p2 = offs[k+1] if k+1 < len(offs) else on
                    if k+1 < len(offs): p2 = ((offs[k][0]+offs[k+1][0])/2, (offs[k][1]+offs[k+1][1])/2)
                    cur += q(p0, p1, p2); p0 = p2
            elif op == 'curveTo':
                p0 = cur[-1]; cur += c(p0, *args)
            elif op in ('closePath', 'endPath'):
                if len(cur) > 2: polys.append(cur)
                cur = []
        # nonzero fill: accumulate contour winding with XOR-free method → use signed area rasterisation
        acc = np.zeros((H, W), np.int16)
        for poly in polys:
            pp = [(ox + (x0 + px) * S, oy - py * S) for px, py in poly]
            area = sum(pp[i][0]*pp[(i+1)%len(pp)][1]-pp[(i+1)%len(pp)][0]*pp[i][1] for i in range(len(pp)))
            m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pp, fill=1)
            acc += np.array(m, np.int16) * (1 if area > 0 else -1)
        g_mask = Image.fromarray(((acc != 0) * 255).astype(np.uint8))
        mask = Image.fromarray(np.maximum(np.array(mask), np.array(g_mask)))
        x0 += hmtx[g][0]
    return np.array(mask) > 127, ox, oy

N8 = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]

def trace(sk):
    pts = set(zip(*np.nonzero(sk)))
    nb = {p: [(p[0]+dy, p[1]+dx) for dy, dx in N8 if (p[0]+dy, p[1]+dx) in pts] for p in pts}
    nodes = {p for p in pts if len(nb[p]) != 2}
    seen_edges = set(); paths = []
    def walk(a, b):
        path = [a, b]; prev, cur = a, b
        while cur not in nodes:
            nxt = [n for n in nb[cur] if n != prev]
            if not nxt: break
            prev, cur = cur, nxt[0]; path.append(cur)
            if cur == a: break
        return path
    for a in nodes:
        for b in nb[a]:
            key = frozenset((a, b))
            if key in seen_edges: continue
            p = walk(a, b)
            for i in range(len(p)-1): seen_edges.add(frozenset((p[i], p[i+1])))
            paths.append(p)
    # pure loops (no nodes)
    rest = pts - {q for p in paths for q in p}
    while rest:
        s = next(iter(rest)); p = [s]; prev = None; cur = s
        while True:
            nxt = [n for n in nb[cur] if n != prev and n in rest and n not in p[-3:]]
            if not nxt: break
            prev, cur = cur, nxt[0]; p.append(cur)
        rest -= set(p); paths.append(p + [p[0]])
    return paths

def simplify(p, eps=1.2):
    if len(p) < 3: return p
    a, b = np.array(p[0], float), np.array(p[-1], float)
    v = b - a; L = np.hypot(*v) or 1e-9
    d = [abs(v[0] * (q[1] - a[1]) - v[1] * (q[0] - a[0])) / L for q in p[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i-1] > eps:
        return simplify(p[:i+1], eps)[:-1] + simplify(p[i:], eps)
    return [p[0], p[-1]]

def build(text):
    glyphs = shape(text)
    d, adv, box = outline(glyphs)
    ink, ox, oy = raster(glyphs, adv)
    dist = distance_transform_edt(ink)
    sk = skeletonize(remove_small_objects(ink, max_size=30))
    paths = trace(sk)
    strokes = []
    for p in paths:
        if len(p) < 6 and not any(dist[q] > 4 for q in p):  # tiny spur
            continue
        # write left → right (and top → bottom for vertical strokes)
        (y0, x0), (y1, x1) = p[0], p[-1]
        if x0 - x1 > 2 or (abs(x0 - x1) <= 2 and y0 > y1):
            p = p[::-1]
        w = max(dist[q] for q in p) * 2.25 + 2  # nib that fully covers the stroke
        sp = simplify(p)
        # to font units
        u = [((x - ox) / S, (y - oy) / S) for y, x in sp]
        L = sum(math.hypot(u[i+1][0]-u[i][0], u[i+1][1]-u[i][1]) for i in range(len(u)-1))
        if L < 8: continue
        dd = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in u)
        strokes.append({'d': dd, 'len': round(L, 1), 'w': round(w / S, 1), 'x': round(min(x for x, _ in u), 1)})
    # pen order: by the stroke's left edge, so the word is written left to right
    strokes.sort(key=lambda s: s['x'])
    for s in strokes: del s['x']
    return {'text': text, 'advance': adv, 'box': box, 'ascent': ascent, 'descent': descent, 'fill': d, 'strokes': strokes}

data = {k: build(t) for k, t in TITLES.items()}
with open(OUT, 'w') as f:
    f.write('/* Generated by scripts/handwriting/generate.py — do not edit by hand. */\n')
    f.write('import type { HandwritingData } from \'./types\';\n\n')
    f.write('export const TITLES = ' + json.dumps(data, separators=(',', ':')) + ' satisfies Record<string, HandwritingData>;\n')
for k, v in data.items():
    print(k, len(v['strokes']), 'strokes', len(v['fill']), 'chars fill')
