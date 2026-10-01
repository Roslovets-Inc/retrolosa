"""Explicitly merge the parcel analyses in figures 7 and 8; numpy/Pillow required.
Keep figure 8 intact and add only the red parcel boundaries from figure 7.
The archaeological background of figure 7 remains available in its original.
No download or publication is performed.
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'data/openedition-1550-control-points.json').read_text(encoding='utf-8'))
destination = ROOT / 'public/openedition-1550'
destination.mkdir(exist_ok=True)
images = []
for source in config['sources']:
    name = f"figure-{source['number']:02}.jpg"
    path = ROOT / '.local/openedition-3296/originals' / name
    if not path.exists():
        path = destination / name
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256']
    images.append(Image.open(path).convert('RGB'))
    (destination / name).write_bytes(path.read_bytes())
assert images[0].size == images[1].size == (1999, 2482)
dx, dy = config['registration']['translation7To8']
registration_errors = [math.dist(check['translation'], [dx, dy]) for check in config['registration']['checks']]
assert max(registration_errors) < 1
aligned = images[0].transform(images[1].size, Image.Transform.AFFINE,
                              (1, 0, -dx, 0, 1, -dy), Image.Resampling.BICUBIC,
                              fillcolor=(255, 255, 255))
red = np.asarray(aligned).astype(np.int16)
base = np.asarray(images[1]).copy()
# This source's red lines encode parcel boundaries. Exclude its printed legend.
parcel = (red[:, :, 0] > red[:, :, 1] + 25) & (red[:, :, 0] > red[:, :, 2] + 20)
parcel[2200:] = False
assert parcel.sum() > 20000
base[parcel] = np.minimum(base[parcel], red[parcel]).astype(np.uint8)
assert np.count_nonzero((base[:, :, 2].astype(int) > base[:, :, 0].astype(int) + 25) &
                        (base[:, :, 2].astype(int) > base[:, :, 1].astype(int) + 15)) > 20000
# Append an explanation to the raster, without obscuring or cropping either map.
im = Image.new('RGB', (1999, 2662), 'white')
im.paste(Image.fromarray(base), (0, 0))
try:
    font = ImageFont.truetype('arial.ttf', 30)
except OSError:
    font = ImageFont.truetype('DejaVuSans.ttf', 30)
draw = ImageDraw.Draw(im)
draw.text((55, 2495), '1550 · Héritages du parcellaire — figures 7 et 8', font=font, fill='#222222')
draw.line((55, 2560, 115, 2560), fill='#b51e14', width=4)
draw.text((135, 2540), 'Rouge : limites parcellaires d’orientation antique (figure 7)', font=font, fill='#222222')
draw.text((55, 2585), 'Bleu : autres limites parcellaires (figure 8). Fond historique : XIIe–XIIIe siècles.', font=font, fill='#222222')
im.save(destination / 'map.webp', quality=90, method=6)

fit = [point for point in config['points'] if point['role'] == 'fit']
affine = np.linalg.solve(np.array([[*point['pixel'], 1] for point in fit]),
                         np.array([point['ref'] for point in fit]))
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
    predicted = np.array([*point['pixel'], 1]) @ affine
    _, lat = lonlat(point['ref'])
    metres = np.linalg.norm(predicted - point['ref']) * ref_scale * 40075016.6856 / world * math.cos(math.radians(lat))
    checks.append({'name': point['name'], 'errorMetres': round(float(metres), 1)})
assert max(point['errorMetres'] for point in checks) < 25
corners = [(0, 0), (im.width, 0), (im.width, im.height), (0, im.height)]
metadata = {
    'sourcePage': config['sourcePage'],
    'coordinates': [lonlat(np.array([x, y, 1]) @ affine) for x, y in corners],
    'label': '1550 · Héritages du parcellaire',
    'sourceSize': list(im.size),
    'checkPoints': checks,
    'registrationMaxErrorPixels': round(max(registration_errors), 2),
    'method': 'Figure 8 with registered red parcel boundaries from figure 7. Affine Web Mercator fit on three churches; one withheld checkpoint. Manual annotation, not survey-grade.',
}
(ROOT / 'src/openedition-1550.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(metadata, ensure_ascii=True))
