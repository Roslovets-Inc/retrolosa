"""Prepare the complete Saget plan; requires numpy and Pillow. Run explicitly."""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'data/saget-1777-control-points.json').read_text(encoding='utf-8'))
source = ROOT / config['sourcePath']
if not source.exists():
    source = ROOT / 'public/saget-1777/original.jpg'
assert hashlib.sha256(source.read_bytes()).hexdigest() == config['sha256']
im = Image.open(source).convert('RGB')
points = [p for p in config['points'] if p['role'] == 'fit']
affine = np.linalg.solve(np.array([[*p['old'], 1] for p in points]), np.array([p['ref'] for p in points]))
assert np.linalg.det(affine[:2]) > 0
reference = config['reference']
origin = np.array([reference['x0'], reference['y0']]) * 256
ref_scale = reference['width'] / reference['annotationWidth']
world = 2 ** reference['z'] * 256

def lonlat(pixel):
    x, y = origin + np.array(pixel) * ref_scale
    return [float(x / world * 360 - 180), float(math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / world)))))]

checks = []
for point in config['points']:
    if point['role'] != 'check':
        continue
    predicted = np.array([*point['old'], 1]) @ affine
    _, lat = lonlat(point['ref'])
    metres = np.linalg.norm(predicted - point['ref']) * ref_scale * 40075016.6856 / world * math.cos(math.radians(lat))
    checks.append({'name': point['name'], 'errorMetres': round(float(metres), 1)})
assert max(p['errorMetres'] for p in checks) < 100, checks
height = im.height * config['annotationWidth'] / im.width
corners = [(0, 0), (config['annotationWidth'], 0), (config['annotationWidth'], height), (0, height)]
coordinates = [lonlat(np.array([x, y, 1]) @ affine) for x, y in corners]
destination = ROOT / 'public/saget-1777'
destination.mkdir(exist_ok=True)
(destination / 'original.jpg').write_bytes(source.read_bytes())
source_size = list(im.size)
# Keep all margins and tables; limit texture width for smaller WebGL devices.
im.thumbnail((4096, 4096), Image.Resampling.LANCZOS)
im.save(destination / 'map.webp', quality=92, method=6)
metadata = {'sourcePage': config['sourcePage'], 'coordinates': coordinates, 'checkPoints': checks, 'method': config['method'], 'sourceSize': source_size, 'rasterSize': list(im.size)}
(ROOT / 'src/saget-1777.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(metadata, ensure_ascii=True))
