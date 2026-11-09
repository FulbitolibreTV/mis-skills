# cuts the drone clip on the beat (120 BPM), grades, upscales to 1080x1920, adds titles and new music -> dron_editado.mp4
import subprocess, sys
SRC = sys.argv[1]
G = ("curves=all='0/0 0.2/0.13 0.5/0.48 0.8/0.86 1/1',huesaturation=colors=y:saturation=-0.22:strength=1,"
     "huesaturation=colors=r:saturation=-0.1,eq=saturation=1.05,scale=1080:1920:flags=lanczos,unsharp=5:5:0.7,vignette=angle=PI/6,fps=30")
# (source start, source end, speed, transition into this clip)  -- each clip lasts (end-start)/speed seconds on screen
CLIPS = [
    (0.0, 3.4, 1.0, None),       # boat comes at us (title)
    (5.0, 7.4, 1.2, 'cut'),      # boat carves the turn
    (10.0, 13.6, 1.8, 'zoom'),   # DROP: chase over the lake, sped up
    (14.0, 17.6, 1.8, 'cut'),
    (19.3, 21.1, 0.9, 'slide'),  # mangroves
    (22.2, 24.3, 1.0, 'cut'),
    (25.3, 27.2, 0.95, 'cut'),
    (28.3, 30.2, 0.95, 'zoom'),  # the crew on board
    (31.3, 35.3, 2.0, 'cut'),    # following the boat, fast
    (38.8, 40.8, 1.0, 'cut'),    # wide side shot with the bird
    (35.4, 37.8, 0.8, 'slide'),  # slow-mo behind
    (41.8, 47.9, 1.0, 'fade'),   # outro: trailing shot
]
XF = {'zoom': ('smoothup', .30), 'slide': ('slideleft', .30), 'fade': ('fade', .45)}
segs = []
for i, (a, b, sp, tr) in enumerate(CLIPS):
    out = f'seg{i:02d}.mp4'
    import os
    if not os.path.exists(out): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-t', str(b - a), '-i', SRC, '-an',
                    '-vf', f'setpts=PTS/{sp},{G}', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', out], check=True)
    segs.append((out, (b - a) / sp, tr))
# chain with xfade where asked, plain cuts otherwise
inputs, fc, cur, t = [], [], '[0:v]', segs[0][1]
for i, (f, d, tr) in enumerate(segs): inputs += ['-i', f]
for i in range(1, len(segs)):
    f, d, tr = segs[i]
    kind, dur = XF.get(tr, ('fade', .04))
    off = t - dur
    fc.append(f'{cur}[{i}:v]xfade=transition={kind}:duration={dur}:offset={off:.3f}[v{i}]'); cur = f'[v{i}]'; t = off + d
TOTAL = t
n = len(segs)
fc.append(f'{cur}[{n}:v]overlay=0:0:enable=\'between(t,0.25,3.1)\':format=auto[t1]')
fc.append(f"[{n+1}:v]format=rgba,fade=t=in:st={TOTAL-4.2:.2f}:d=0.4:alpha=1[e]")
fc.append(f"[t1][e]overlay=0:0:enable='gte(t,{TOTAL-4.2:.2f})'[t2]")
fc.append(f"[t2]fade=t=out:st={TOTAL-0.6:.2f}:d=0.6[vout]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-loop', '1', '-t', f'{TOTAL:.2f}', '-i', 'title.png', '-loop', '1', '-t', f'{TOTAL:.2f}', '-i', 'end.png',
                '-i', 'music.wav', '-filter_complex', ';'.join(fc), '-map', '[vout]', '-map', f'{n+2}:a',
                '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                '-af', 'loudnorm=I=-14:TP=-1.5', '-shortest', '-movflags', '+faststart', 'dron_editado.mp4'], check=True)
print('dron_editado.mp4', round(TOTAL, 2), 's')
