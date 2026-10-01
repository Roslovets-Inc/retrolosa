"""Explicitly prepare the complete borough-growth diagram, retaining its phase legend.

Alignment transfers manually matched landmarks through the existing XIII-century
reference. Checks measure inter-diagram agreement, not independent survey accuracy.
No downloads or publication. Requires numpy and Pillow.
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'data/openedition-12c-control-points.json').read_text(encoding='utf-8'))
reference = json.loads((ROOT / config['referenceConfig']).read_text(encoding='utf-8'))
source = ROOT / config['sourcePath']
if not source.exists():
    source = ROOT / 'public/openedition-12c/figure-09.jpg'
assert hashlib.sha256(source.read_bytes()).hexdigest() == config['sha256']

def fit(points):
    points = [p for p in points if p['role'] == 'fit']
    return np.linalg.solve(np.array([[*p['old'], 1] for p in points]), np.array([p['ref'] for p in points]))

base = fit(reference['points'])
fit_points = [dict(p, ref=(np.array([*p['ref'], 1]) @ base).tolist()) for p in config['points']]
alignment = fit(fit_points)
# Preserve the diagram's affine shape; anchor its translation directly on the
# modern basilica instead of amplifying small errors through near-collinear points.
anchor = config['points'][0]
alignment[2] += np.array(anchor['modernRef']) - np.array([*anchor['old'], 1]) @ alignment
assert np.linalg.det(alignment[:2]) > 0
origin = np.array([reference['reference']['x0'], reference['reference']['y0']]) * 256
ref_scale = reference['reference']['width'] / reference['annotationWidth']
world = 2 ** reference['reference']['z'] * 256

def world_pixel(pixel):
    return origin + np.array(pixel) * ref_scale

def lonlat(pixel):
    x, y = world_pixel(pixel)
    return [float(x / world * 360 - 180), float(math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / world)))))]

checks = []
for point in config['points']:
    if point['role'] != 'check' and (point['name'] == anchor['name'] or 'modernRef' not in point):
        continue
    predicted = np.array([*point['old'], 1]) @ alignment
    expected = np.array(point['modernRef']) if 'modernRef' in point else np.array([*point['ref'], 1]) @ base
    distance = np.linalg.norm(world_pixel(predicted) - world_pixel(expected))
    metres = distance * 40075016.6856 / world * math.cos(math.radians(lonlat(expected)[1]))
    checks.append({'name': point['name'], 'errorMetres': round(float(metres), 1)})
assert max(p['errorMetres'] for p in checks) < 25, checks
im = Image.open(source).convert('RGBA')
scale = im.width / config['annotationWidth']
corners = [(0, 0), (im.width / scale, 0), (im.width / scale, im.height / scale), (0, im.height / scale)]
coordinates = [lonlat(np.array([x, y, 1]) @ alignment) for x, y in corners]
destination = ROOT / 'public/openedition-12c'
destination.mkdir(exist_ok=True)
im.save(destination / 'map.webp', quality=90, method=6)
(destination / 'figure-09.jpg').write_bytes(source.read_bytes())
# The castle is an accessible source document, not an unvalidated map overlay.
castle = ROOT / '.local/openedition-3296/originals/figure-11.jpg'
if castle.exists():
    assert hashlib.sha256(castle.read_bytes()).hexdigest() == 'de1e2c7c7d8d2d4cfbfcfa17b18e2c91d58b5acd8be5f95ac9ceda7bb831b307'
    (destination / 'figure-11.jpg').write_bytes(castle.read_bytes())
metadata = {
    'coordinates': coordinates,
    'timelineAnchor': 1195,
    'checkPoints': checks,
    'sourceSize': list(im.size),
    'method': 'Affine transfer through figure 6, translated to the corrected Saint-Sernin crossing on IGN. Withheld gates check inter-diagram agreement only.',
    'coverage': 'Saint-Sernin borough only; full diagram and multiphase legend retained.',
}
(ROOT / 'src/openedition-12c.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(metadata))
