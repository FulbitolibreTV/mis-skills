# Finds free-to-use photos on Wikimedia Commons and saves them into <folder>/web/img/<key>.jpg
# Only keeps public domain, CC0, CC BY and CC BY-SA files, and writes the credits to <folder>/CREDITOS.txt
# (paste those credits in the video description: CC BY / BY-SA require it).
#
# usage: python fotos.py <folder> <key> "<search>" [<key> "<search>" ...]
#        python fotos.py <folder> <key> "File:Exact name.jpg"      (pick an exact Commons file)
#   options: --list  only print the first candidates for each search, download nothing
#            --n=K   take the K-th good result (default 1)
import sys, os, json, re, urllib.request, urllib.parse

API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'como-funciona-skill/1.0 (video maker; contact via Wikimedia talk page)'}
OK = re.compile(r'(public domain|^pd|cc0|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$)', re.I)


def fetch(url, timeout=30):
    # Wikimedia answers 429 when asked too fast: wait and retry
    import time, urllib.error
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == 4: raise
            time.sleep(5 * (i + 1))


def get(params):
    q = urllib.parse.urlencode({**params, 'format': 'json'})
    return json.loads(fetch(API + '?' + q))


def strip(html):
    return re.sub(r'<[^>]+>', '', html or '').strip()


def candidates(search, width=1400):
    common = {'action': 'query', 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': width}
    if search.lower().startswith('file:'):
        d = get({**common, 'titles': search})
    else:
        d = get({**common, 'generator': 'search', 'gsrnamespace': 6, 'gsrlimit': 25, 'gsrsearch': search + ' filetype:bitmap'})
    pages = sorted((d.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    out = []
    for p in pages:
        ii = (p.get('imageinfo') or [{}])[0]
        md = ii.get('extmetadata', {})
        lic = strip(md.get('LicenseShortName', {}).get('value', ''))
        if not OK.search(lic) or ii.get('mime') not in ('image/jpeg', 'image/png'):
            continue
        if min(ii.get('width', 0), ii.get('height', 0)) < 500:
            continue
        out.append({'title': p['title'], 'url': ii.get('thumburl') or ii['url'], 'page': ii.get('descriptionurl', ''),
                    'license': lic, 'author': strip(md.get('Artist', {}).get('value', ''))[:80] or 'Wikimedia Commons',
                    'size': f"{ii.get('width')}x{ii.get('height')}"})
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]
    listing = '--list' in flags
    nth = next((int(f[4:]) for f in flags if f.startswith('--n=')), 1)
    folder, pairs = args[0], args[1:]
    os.makedirs(os.path.join(folder, 'web', 'img'), exist_ok=True)
    credits = []
    for key, search in zip(pairs[::2], pairs[1::2]):
        c = candidates(search)
        if listing:
            print(f'== {key}: {search}')
            for i, x in enumerate(c[:8], 1): print(f'  {i}. {x["title"]}  [{x["license"]}, {x["size"]}]')
            continue
        if len(c) < nth:
            print(f'!! {key}: no free photo for "{search}" (try other words or an exact File: name)'); continue
        x = c[nth - 1]
        ext = '.png' if x['url'].lower().endswith('.png') else '.jpg'
        dest = os.path.join(folder, 'web', 'img', key + ext)
        data = fetch(x['url'], 60)
        with open(dest, 'wb') as f:
            f.write(data)
        __import__('time').sleep(1)
        print(f'{key}: img/{key}{ext}  <- {x["title"]} [{x["license"]}]')
        credits.append(f'{x["title"][5:]} - {x["author"]} - {x["license"]} - {x["page"]}')
    if credits:
        with open(os.path.join(folder, 'CREDITOS.txt'), 'a', encoding='utf-8') as f:
            f.write('\n'.join(credits) + '\n')


if __name__ == '__main__':
    main()
