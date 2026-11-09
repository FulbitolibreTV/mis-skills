#!/usr/bin/env python3
"""Control de ritmo: busca tramos sin movimiento.

python3 ritmo.py proyecto/reel.mp4 [--umbral 0.6] [--por-zona]

Por defecto avisa de los tramos de más de --umbral segundos en los que no se mueve nada en toda la pantalla.
Con --por-zona es más exigente: cada zona (arriba, centro, abajo) tiene que cambiar al menos cada --umbral segundos.
"""
import subprocess, sys
import numpy as np

args = sys.argv[1:]
if not [a for a in args if not a.startswith('--')]:
    sys.exit(__doc__)
ruta = next(a for a in args if not a.startswith('--') and (args.index(a) == 0 or args[args.index(a) - 1] != '--umbral'))
umbral = float(args[args.index('--umbral') + 1]) if '--umbral' in args else 0.6
por_zona = '--por-zona' in args
FPS, w, h = 30, 90, 160
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-vf', f'fps={FPS},scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16)
if len(f) < 2:
    sys.exit('No he podido leer el vídeo.')
d = np.abs(np.diff(f, axis=0))
zonas = {'arriba': d[:, :h // 3], 'centro': d[:, h // 3: 2 * h // 3], 'abajo': d[:, 2 * h // 3:]}


def quietos(mov):
    tramos, ini = [], None
    for i, m in enumerate(list(mov) + [True]):
        if not m and ini is None:
            ini = i
        if m and ini is not None:
            tramos.append((ini / FPS, (i - ini) / FPS)); ini = None
    return tramos


mov = np.zeros(len(d), bool)
malos = []
print(f'{len(f)} fotogramas · {len(f) / FPS:.1f} s')
print('Por zonas (' + ('cuentan para el veredicto' if por_zona else 'solo orientativo: el veredicto mira la pantalla entera') + '):')
for nombre, z in zonas.items():
    mz = z.reshape(len(d), -1).max(axis=1) > 12
    mov |= mz
    largo = max((g for _, g in quietos(mz)), default=0)
    marca = ('✗' if largo > umbral else '✓') if por_zona else ' '
    print(f'  {marca} {nombre:7s} activo {100 * mz.mean():3.0f} % · quieto como mucho {largo:.2f} s')
    if por_zona:
        malos += [(a, g, nombre) for a, g in quietos(mz) if g > umbral]
malos = [(a, g, 'pantalla') for a, g in quietos(mov) if g > umbral] + sorted(malos)
if malos:
    print(f'AVISO: {len(malos)} tramo(s) de más de {umbral} s sin cambios:')
    for a, g, donde in malos:
        print(f'  {donde}, en el segundo {a:.1f}: {g:.2f} s quieto → mete algo que entre en ese segundo y rehaz el tramo')
else:
    largo = max((g for _, g in quietos(mov)), default=0)
    print(f'OK ✔ ningún tramo quieto de más de {umbral} s' + (' en ninguna zona' if por_zona else '') + f' (en pantalla, el más largo: {largo:.2f} s).')
