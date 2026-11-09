# Cut a character sheet (a grid made in ChatGPT or similar) into one transparent PNG per character.
#   python personajes.py <sheet.png> <style: mapa|neon> <cols> <rows> name1,name2,...  [--pad=N] [--mask=x,y,w,h]
#   mapa: light background -> removed by flood fill from the edges of each cell (only the biggest piece is kept)
#   neon: black background -> brightness becomes transparency (keeps the glow); small bits from neighbour cells are dropped
#   --pad=N trims N px off each cell (frame lines); --mask=x,y,w,h blanks a box in every cell (numbers or badges in a corner)
#   Leave a name empty to skip a cell (",,rey,,"); reuse a name to replace a character.
# The characters live in the second skill, como-funciona-personajes (next to this skill), in personajes/<style>/<name>.png,
# with personajes/lista.js listing them. PJ_DIR=<folder> to write somewhere else. Needs only ffmpeg, numpy and scipy.
import os, sys, subprocess, json, numpy as np
from scipy import ndimage

here = os.path.dirname(os.path.abspath(__file__))
root = os.environ.get('PJ_DIR') or os.path.normpath(os.path.join(here, '..', '..', '..', 'como-funciona-personajes', 'personajes'))
opts = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
args = [a for a in sys.argv[1:] if not a.startswith('--')]
src, style, cols, rows, names = args[0], args[1], int(args[2]), int(args[3]), args[4].split(',')
out = os.path.join(root, style); os.makedirs(out, exist_ok=True)
neon = style == 'neon'

w, h = map(int, subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).decode().strip().split(',')[:2])
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'])
img = np.frombuffer(raw, np.uint8).reshape(h, w, 4)[:, :, :3].astype(np.float32)

def save(rgba, path):
    hh, ww = rgba.shape[:2]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{ww}x{hh}', '-i', '-', '-frames:v', '1', path], input=np.clip(rgba, 0, 255).astype(np.uint8).tobytes(), check=True)

cw, ch = w / cols, h / rows
for i, name in enumerate(names):
    if i >= cols * rows or not name: continue
    c, r = i % cols, i // cols
    pad = int(opts.get('pad', 6 if neon else 0))
    x0, y0, x1, y1 = int(c * cw) + pad, int(r * ch) + pad, int((c + 1) * cw) - pad, int((r + 1) * ch) - pad
    cell = img[y0:y1, x0:x1].copy()
    if 'mask' in opts:
        mx, my, mw, mh = map(int, opts['mask'].split(','))
        cell[my:my + mh, mx:mx + mw] = 0 if neon else cell[-6:, -6:].reshape(-1, 3).mean(0)
    if neon:
        a = np.clip((cell.max(axis=2) - 18) * 255 / (255 - 18), 0, 255)
        a[:3, :] = 0; a[-3:, :] = 0; a[:, :3] = 0; a[:, -3:] = 0
        lab, n = ndimage.label(ndimage.binary_dilation(a > 30, iterations=3))
        if n > 1:
            sizes = ndimage.sum(a > 30, lab, range(1, n + 1)); tot = sizes.sum()
            side = set(np.unique(np.concatenate([lab[:, :4].ravel(), lab[:, -4:].ravel(), lab[:4].ravel(), lab[-4:].ravel()])))
            for k in range(1, n + 1):
                if k in side and sizes[k - 1] < tot * .12: a[lab == k] = 0
        rgb = np.where(a[..., None] > 0, np.clip(cell * 255 / np.maximum(cell.max(axis=2, keepdims=True), 1), 0, 255), 0)
    else:
        bg = cell[-6:, -6:].reshape(-1, 3).mean(0)
        near = (np.abs(cell - bg).max(axis=2) < 28) & ((cell.max(axis=2) - cell.min(axis=2)) < 22)
        lab, _ = ndimage.label(near)
        edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
        a = ndimage.binary_opening(~np.isin(lab, edge), iterations=1)
        lab2, n2 = ndimage.label(a)
        if n2: a = lab2 == (int(np.argmax(ndimage.sum(a, lab2, range(1, n2 + 1)))) + 1)
        a = ndimage.gaussian_filter(a.astype(np.float32), .7) * 255
        rgb = cell
    ys, xs = np.where(a > 20)
    if not len(ys): print('empty', name); continue
    yA, yB, xA, xB = max(0, ys.min() - 4), min(a.shape[0], ys.max() + 5), max(0, xs.min() - 4), min(a.shape[1], xs.max() + 5)
    rgba = np.dstack([rgb, a])[yA:yB, xA:xB]
    save(rgba, os.path.join(out, name + '.png')); print(style + '/' + name, rgba.shape[1], 'x', rgba.shape[0])

lst = {}
for st in sorted(os.listdir(root)):
    d = os.path.join(root, st)
    if os.path.isdir(d): lst[st] = sorted(f[:-4] for f in os.listdir(d) if f.endswith('.png'))
with open(os.path.join(root, 'lista.js'), 'w', encoding='utf-8') as f:
    f.write('// made by tools/personajes.py: every character image, preloaded by estilos.js\nwindow.PJ_LIST = ' + json.dumps(lst, ensure_ascii=False) + ';\n')
n = sum(len(v) for v in lst.values()); print(f'{n} characters in {root}')
