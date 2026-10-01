"""Compose XII-century regions and a Saint-Pierre detail in a transparent shared raster.

Run after build-openedition-12c.py. No downloads or publication. Phase selection
combines manually reviewed regions and legend colours; originals remain accessible.
The castle's symbol-and-scale placement is explicitly approximate, not validated.
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'data/openedition-12c-fragments.json').read_text(encoding='utf-8'))
META_PATH = ROOT / 'src/openedition-12c.json'
metadata = json.loads(META_PATH.read_text(encoding='utf-8'))
assert 'fragments' not in metadata, 'Run build-openedition-12c.py before composing again.'
destination = ROOT / 'public/openedition-12c'
world = 2 ** 17 * 256

def projected(lonlat):
    lon, lat = lonlat
    return np.array([(lon + 180) / 360 * world, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * world])

def geographic(point):
    x, y = point
    return [float(x / world * 360 - 180), float(math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / world)))))]

def polygon(size, vertices):
    mask = Image.new('L', size)
    ImageDraw.Draw(mask).polygon(vertices, fill=255)
    return np.array(mask)

def original(item):
    filename = f"figure-{item['figure']:02}.jpg"
    path = ROOT / '.local/openedition-3296/originals' / filename
    if not path.exists():
        path = destination / filename
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256']
    (destination / filename).write_bytes(path.read_bytes())
    im = Image.open(path).convert('RGBA')
    return im.resize((1200, round(im.height * 1200 / im.width)))

etienne = CONFIG['etienne']
im = original(etienne)
pixels = np.array(im)
r, g, b = [pixels[:, :, i].astype(float) for i in range(3)]
regions = np.maximum.reduce([polygon(im.size, p) for p in etienne['phaseRegions']]) > 0
canonical = (r > 190) & (g > 130) & (g < 240) & (b < 160)
episcopal = (r > 145) & (b > 145) & (g + 8 < r) & (g + 8 < b)
roman = (r > 120) & (r > g * 1.6) & (r > b * 1.5)
# Only explicitly dated colours within reviewed regions survive. Gothic/later
# outlines, background streets and the XIII-century extension remain transparent.
keep = (regions & (canonical | episcopal)) | ((polygon(im.size, etienne['romanesqueRegion']) > 0) & roman)
pixels[:, :, 3] = np.where(keep, 255, 0)
etienne_image = Image.fromarray(pixels)
etienne_image.save(destination / 'etienne.webp', lossless=True)
fit = [p for p in etienne['points'] if p['role'] == 'fit']
old0, old1 = [np.array(p['old']) for p in fit]
ref0, ref1 = [np.array(p['ref']) for p in fit]
d = old1 - old0
e = ref1 - ref0
a = np.dot(d, e) / np.dot(d, d)
b = (d[0] * e[1] - d[1] * e[0]) / np.dot(d, d)
linear = np.array([[a, b], [-b, a]])
offset = ref0 - old0 @ linear + np.array([66062, 47861]) * 256
etienne_matrix = np.vstack([linear, offset])
checks = []
for p in etienne['points']:
    if p['role'] != 'check':
        continue
    predicted = np.array([*p['old'], 1]) @ etienne_matrix
    expected = np.array(p['ref']) + np.array([66062, 47861]) * 256
    metres = np.linalg.norm(predicted - expected) * 40075016.6856 / world * math.cos(math.radians(43.6))
    checks.append({'name': p['name'], 'errorMetres': round(float(metres), 1)})
assert max(p['errorMetres'] for p in checks) < 25, checks

castle = CONFIG['castle']
im = original(castle)
pixels = np.array(im)
pixels[:, :, 3] = polygon(im.size, castle['coveragePolygon'])
castle_image = Image.fromarray(pixels)
castle_image.save(destination / 'castle.webp', lossless=True)
refconfig = json.loads((ROOT / 'data/openedition-13c-control-points.json').read_text(encoding='utf-8'))
fit = [p for p in refconfig['points'] if p['role'] == 'fit']
base = np.linalg.solve(np.array([[*p['old'], 1] for p in fit]), np.array([p['ref'] for p in fit]))
centre = np.array([*castle['figure6Anchor'], 1]) @ base
reference = refconfig['reference']
centre = (np.array([reference['x0'], reference['y0']]) * 256 + centre * reference['width'] / refconfig['annotationWidth']) * 4
metres_per_pixel = 40075016.6856 / world * math.cos(math.radians(geographic(centre)[1]))
scale = castle['scaleBar']['metres'] / castle['scaleBar']['pixels'] / metres_per_pixel
castle_matrix = np.vstack([np.eye(2) * scale, centre - np.array(castle['anchor']) * scale])

borough = Image.open(destination / 'map.webp').convert('RGBA')
# Keep its established alignment unchanged while excluding page margins/legend
# from coverage. Complete original and legend remain in the source dialog.
borough_mask = polygon((1200, round(borough.height * 1200 / borough.width)), [[40, 945], [62, 750], [85, 450], [95, 335], [174, 160], [403, 55], [770, 155], [900, 235], [978, 385], [1035, 600], [1035, 830], [950, 880], [650, 935], [125, 1000]])
borough.putalpha(Image.fromarray(borough_mask).resize(borough.size))
corners = np.array([projected(c) for c in metadata['coordinates']])
borough_matrix = np.vstack([(corners[1] - corners[0]) / borough.width, (corners[3] - corners[0]) / borough.height, corners[0]])

pierre = CONFIG['pierre']
im = original(pierre)
pixels = np.array(im)
r, g, b = [pixels[:, :, i].astype(float) for i in range(3)]
red = (r > 110) & (r > g * 1.6) & (r > b * 1.6)
green = (r > 130) & (g > 140) & (g > r * 0.97) & (b > 60) & (b < g * 0.9)
phase_mask = polygon(im.size, pierre['phaseRegion']) > 0
pixels[:, :, 3] = np.where(phase_mask & (red | green), 255, 0)
pierre_image = Image.fromarray(pixels)
pierre_image.save(destination / 'pierre.webp', lossless=True)
fit = [p for p in pierre['points'] if p['role'] == 'fit']
old0, old1 = [np.array(p['old']) for p in fit]
ref0, ref1 = [np.array(p['ref']) for p in fit]
d, e = old1 - old0, ref1 - ref0
a = np.dot(d, e) / np.dot(d, d)
b = (d[0] * e[1] - d[1] * e[0]) / np.dot(d, d)
linear = np.array([[a, b], [-b, a]])
pierre_origin = np.array([pierre['reference']['x0'], pierre['reference']['y0']]) * 256
pierre_matrix = np.vstack([linear, ref0 - old0 @ linear + pierre_origin])
pierre_checks = []
for p in pierre['points']:
    if p['role'] != 'check':
        continue
    predicted = np.array([*p['old'], 1]) @ pierre_matrix
    expected = np.array(p['ref']) + pierre_origin
    metres = np.linalg.norm(predicted - expected) * 40075016.6856 / world * math.cos(math.radians(43.6))
    pierre_checks.append({'name': p['name'], 'errorMetres': round(float(metres), 1)})
assert max(p['errorMetres'] for p in pierre_checks) < 15, pierre_checks
# The higher-detail phase drawing replaces the borough's coarse church symbol
# within a tight footprint; it does not blank the surrounding historical streets.
detail_hull = np.array([[25, 330, 1], [730, 185, 1], [1145, 240, 1], [1190, 830, 1], [800, 915, 1], [75, 755, 1]]) @ pierre_matrix
inverse_borough = np.linalg.inv(borough_matrix[:2])
borough_hull = (detail_hull - borough_matrix[2]) @ inverse_borough
clear = polygon(borough.size, [tuple(p) for p in borough_hull]) > 0
borough_pixels = np.array(borough)
borough_pixels[clear, 3] = 0
borough = Image.fromarray(borough_pixels)
fragments = [(borough, borough_matrix), (etienne_image, etienne_matrix), (castle_image, castle_matrix), (pierre_image, pierre_matrix)]
extents = []
for im, matrix in fragments:
    extents.extend(np.array([[0, 0, 1], [im.width, 0, 1], [im.width, im.height, 1], [0, im.height, 1]]) @ matrix)
minimum = np.floor(np.min(extents, axis=0)) - 4
maximum = np.ceil(np.max(extents, axis=0)) + 4
# Two raster pixels per zoom-17 world pixel retain linework without huge assets.
resolution = 2
size = tuple(np.ceil((maximum - minimum) * resolution).astype(int))
canvas = Image.new('RGBA', size)
for im, matrix in fragments:
    inverse = np.linalg.inv(matrix[:2])
    linear = inverse / resolution
    offset = (minimum - matrix[2]) @ inverse
    coefficients = (linear[0, 0], linear[1, 0], offset[0], linear[0, 1], linear[1, 1], offset[1])
    warped = im.transform(size, Image.Transform.AFFINE, coefficients, Image.Resampling.BICUBIC)
    canvas.alpha_composite(warped)
canvas.save(destination / 'map.webp', quality=90, method=6)
canvas.save(ROOT / '.local/12c-composite.png')
metadata['coordinates'] = [geographic(p) for p in [minimum, [maximum[0], minimum[1]], maximum, [minimum[0], maximum[1]]]]
metadata['sourceSize'] = list(canvas.size)
metadata['coverage'] = 'Three disconnected regions: Saint-Sernin borough with Saint-Pierre-des-Cuisines phase detail, Romanesque Saint-Étienne, approximately placed Narbonnais castle.'
metadata['fragments'] = [
    {'id': 'saint-sernin', 'figure': 9, 'checkPoints': metadata['checkPoints']},
    {'id': 'saint-etienne', 'figure': 4, 'checkPoints': checks, 'method': etienne['method']},
    {'id': 'narbonnais', 'figure': 11, 'checkPoints': [], 'method': castle['method'], 'approximate': True},
    {'id': 'saint-pierre', 'figure': 3, 'checkPoints': pierre_checks, 'method': pierre['method'], 'multiphase': True},
]
metadata['revision'] = 4
META_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'size': canvas.size, 'etienneChecks': checks, 'pierreChecks': pierre_checks, 'castle': castle['positionalAccuracy'], 'rasterBytes': (destination / 'map.webp').stat().st_size}))
