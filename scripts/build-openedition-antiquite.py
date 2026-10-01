"""Prepare figure 1 as a georeferenced local prototype; numpy and Pillow required.
The affine fit preserves the plan geometry. A separate checkpoint is not fitted.
No automatic download or publication; original remains in the local collection.
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'data/openedition-antiquite-control-points.json').read_text(encoding='utf-8'))
source = ROOT / config['sourcePath']
if not source.exists():
    source = ROOT / 'public/openedition-antiquite/figure-01.jpg'
assert hashlib.sha256(source.read_bytes()).hexdigest() == config['sha256']
im = Image.open(source).convert('RGBA')
scale = im.width / config['annotationWidth']
# Preserve the complete source drawing, including its original legend.
points = [p for p in config['points'] if p['role'] == 'fit']
a = np.linalg.solve(np.array([[*p['old'], 1] for p in points]), np.array([p['ref'] for p in points]))
assert np.linalg.det(a[:2]) > 0
reference = config['reference']
origin = np.array([reference['x0'], reference['y0']]) * 256
ref_scale = reference['width'] / config['annotationWidth']
world = 2 ** reference['z'] * 256

def lonlat(pixel):
    x, y = origin + np.array(pixel) * ref_scale
    return [float(x / world * 360 - 180), float(math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / world)))))]

checks = []
for point in config['points']:
    if point['role'] != 'check':
        continue
    predicted = np.array([*point['old'], 1]) @ a
    _, lat = lonlat(point['ref'])
    metres = np.linalg.norm(predicted - point['ref']) * ref_scale * 40075016.6856 / world * math.cos(math.radians(lat))
    checks.append({'name': point['name'], 'errorMetres': round(float(metres), 1)})
assert max(p['errorMetres'] for p in checks) < 25
corners = [(0, 0), (im.width / scale, 0), (im.width / scale, im.height / scale), (0, im.height / scale)]
coordinates = [lonlat(np.array([x, y, 1]) @ a) for x, y in corners]
destination = ROOT / 'public/openedition-antiquite'
destination.mkdir(exist_ok=True)
im.save(destination / 'map.webp', quality=90, method=6)
# Keep the complete legend and original attribution available from the source dialog.
(destination / 'figure-01.jpg').write_bytes(source.read_bytes())
metadata = {'sourcePage': config['sourcePage'], 'coordinates': coordinates, 'label': 'Antiquité tardive', 'timelineAnchor': 450, 'checkPoints': checks, 'method': config['method'], 'sourceSize': list(im.size)}
(ROOT / 'src/openedition-antiquite.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'checks': checks, 'rasterBytes': (destination / 'map.webp').stat().st_size, 'coordinates': coordinates}, ensure_ascii=True))
