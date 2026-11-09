# Map data for the «mapa ilustrado» style: real coastlines and borders (Natural Earth, public domain)
# cut to a box of the world, written to <reel>/web/mapa.js as lon/lat outlines that the page draws.
#   python mapa.py <reel-folder> <west> <south> <east> <north> [--res=10m|50m] [--tol=0.02]
#   python mapa.py ~/Videos/como-funciona/brasil -85 -58 -30 15
# It prints the names of the countries inside the box (use them in shots.js: land(ctx, 'Brazil', ...)).
# Data comes from the world-atlas package (Natural Earth 1:10m / 1:50m), downloaded once to ~/.cache/como-funciona.
import json, os, sys, urllib.request
sys.stdout.reconfigure(encoding='utf-8')

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
if len(args) < 5:
    print(__doc__ if __doc__ else 'usage: mapa.py <reel> <west> <south> <east> <north> [--res=10m|50m]'); sys.exit(1)
reel = args[0]; W, S, E, N = map(float, args[1:5])
span = max(E - W, N - S)
res = opts.get('res', '10m' if span < 40 else '50m')
tol = float(opts.get('tol', span / 900))          # simplification, in degrees

cache = os.path.join(os.path.expanduser('~'), '.cache', 'como-funciona'); os.makedirs(cache, exist_ok=True)
src = os.path.join(cache, f'countries-{res}.json')
if not os.path.exists(src):
    print(f'downloading Natural Earth {res} (once)...')
    urllib.request.urlretrieve(f'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-{res}.json', src)
topo = json.load(open(src, encoding='utf-8'))
sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']

arcs = []
for a in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)

def ring(idx):
    out = []
    for i in idx:
        pts = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(pts if not out else pts[1:])
    # rings that cross the 180° line (Russia, Fiji...): keep each point near the previous one so no stripe crosses the map
    for k in range(1, len(out)):
        x, y = out[k]
        while x - out[k - 1][0] > 180: x -= 360
        while x - out[k - 1][0] < -180: x += 360
        out[k] = (x, y)
    return out

def dp(pts, eps):   # Douglas-Peucker, iterative
    if len(pts) < 4: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop(); (x1, y1), (x2, y2) = pts[a], pts[b]; dx, dy = x2 - x1, y2 - y1; L = (dx * dx + dy * dy) ** .5 or 1e-9
        best, bi = -1, -1
        for i in range(a + 1, b):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L
            if d > best: best, bi = d, i
        if best > eps: keep[bi] = True; stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]

pw, ph = (E - W) * .35, (N - S) * .35
BW, BS, BE, BN = W - pw, S - ph, E + pw, N + ph
out = {}
for g in topo['objects']['countries']['geometries']:
    name = (g.get('properties') or {}).get('name') or str(g.get('id'))
    polys = g['arcs'] if g['type'] == 'MultiPolygon' else ([g['arcs']] if g['type'] == 'Polygon' else [])
    rings = []
    for poly in polys:
        r = ring(poly[0])   # outer ring only (holes are lakes, not needed at this scale)
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        if max(xs) < BW or min(xs) > BE or max(ys) < BS or min(ys) > BN: continue
        if (max(xs) - min(xs)) < tol * 2 and (max(ys) - min(ys)) < tol * 2: continue   # tiny islets
        m = len(r) // 2; r = dp(r[:m + 1], tol)[:-1] + dp(r[m:], tol)   # split the closed ring so the ends differ
        if len(r) >= 4: rings.append([v for p in r for v in (round(p[0], 3), round(p[1], 3))])
    if rings: out[name] = rings

os.makedirs(os.path.join(reel, 'web'), exist_ok=True)
with open(os.path.join(reel, 'web', 'mapa.js'), 'w', encoding='utf-8') as f:
    f.write('// Natural Earth (public domain) via world-atlas, made by tools/mapa.py\n')
    f.write('window.GEO = ' + json.dumps({'box': [W, S, E, N], 'c': out}, separators=(',', ':')) + ';\n')
print(f'{len(out)} countries, res {res}, file {os.path.getsize(os.path.join(reel, "web", "mapa.js")) // 1024} KB:')
print(', '.join(sorted(out)))
