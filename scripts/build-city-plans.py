"""Explicitly georeference complete plans; requires numpy, scipy and Pillow."""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator
from scipy.optimize import root

ROOT = Path(__file__).resolve().parents[1]

def build(name):
    config = json.loads((ROOT / f'data/{name}-control-points.json').read_text(encoding='utf-8'))
    source = ROOT / config['sourcePath']
    if not source.exists():
        source = ROOT / f'public/{name}/original.jpg'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == config['sha256']
    im = Image.open(source).convert('RGB')
    points = [p for p in config['points'] if p['role'] == 'fit']
    baseline = json.loads((ROOT / f'data/{name}-alignment-baseline.json').read_text(encoding='utf-8'))
    previous = [p for p in baseline['points'] if p['role'] == 'fit']
    # Retain the existing full-sheet frame; new anchors correct local geometry.
    affine = np.linalg.lstsq(np.array([[*p['old'], 1] for p in previous]), np.array([p['ref'] for p in previous]), rcond=None)[0]
    assert np.linalg.det(affine[:2]) > 0
    reference = config['reference']
    origin = np.array([reference['x0'], reference['y0']]) * 256
    ref_scale = reference['width'] / reference['annotationWidth']
    world = 2 ** reference['z'] * 256

    def lonlat(pixel):
        x, y = origin + np.array(pixel) * ref_scale
        return [float(x / world * 360 - 180), float(math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / world)))))]

    height = im.height * config['annotationWidth'] / im.width
    width = config['annotationWidth']
    matrix = np.vstack([affine.T, [0, 0, 1]])
    inverse_affine = np.linalg.inv(matrix)
    target = np.c_[np.array([p['ref'] for p in points]), np.ones(len(points))] @ inverse_affine.T
    old = np.array([p['old'] for p in points])
    # Fix the complete sheet boundary while correcting local surveying/scan distortions.
    edges = np.linspace(0, 1, 25)
    boundary = np.unique(np.vstack([np.c_[edges*width, edges*0], np.c_[edges*width, edges*0+height], np.c_[edges*0, edges*height], np.c_[edges*0+width, edges*height]]), axis=0)
    nodes = np.vstack([target[:, :2], boundary])
    displacement = np.vstack([old-target[:, :2], np.zeros_like(boundary)])
    previous_affine = np.linalg.lstsq(np.array([[*p['old'], 1] for p in previous]), np.array([p['ref'] for p in previous]), rcond=None)[0]
    previous_inverse = np.linalg.inv(np.vstack([previous_affine.T, [0, 0, 1]]))
    previous_target = np.c_[[p['ref'] for p in previous], np.ones(len(previous))] @ previous_inverse.T
    previous_warp = RBFInterpolator(np.vstack([previous_target[:, :2], boundary]), np.vstack([np.array([p['old'] for p in previous])-previous_target[:, :2], np.zeros_like(boundary)]), kernel='thin_plate_spline', smoothing=4)
    # Soft prior samples restrain drift between surveyed anchors without becoming
    # validation landmarks. Their lower weight allows nearby new streets to move.
    px, py = np.meshgrid(np.arange(80, width, 80), np.arange(80, height, 80))
    prior = np.c_[px.ravel(), py.ravel()]
    prior = prior[np.min(np.linalg.norm(prior[:, None]-nodes[None], axis=2), axis=1)>25]
    comparison = json.loads((ROOT / f'data/{name}-street-baseline.json').read_text(encoding='utf-8'))
    comparison_affine = np.array(comparison['affine'])
    comparison_inverse = np.array(comparison['inverseAffine'])
    comparison_warp = RBFInterpolator(np.array(comparison['nodes']), np.array(comparison['displacement']), kernel='thin_plate_spline', smoothing=np.array(comparison['smoothing']))
    # Preserve the preceding surveyed field between new observations. Laffont's
    # coarse street drawing needs softer new observations than Jourdan's scan.
    if name == 'laffont-1904':
        # The baseline field already contains 32 surveyed observations.
        anchor_smoothing = np.r_[[4 if point['name'] in {p['name'] for p in comparison['fitPoints']} else 100 for point in points], np.full(len(boundary),4)]
        warp = RBFInterpolator(np.vstack([nodes, prior]), np.vstack([displacement, comparison_warp(prior)]), kernel='thin_plate_spline', smoothing=np.r_[anchor_smoothing, np.full(len(prior),100)])
    else:
        warp = RBFInterpolator(np.vstack([nodes, prior]), np.vstack([displacement, previous_warp(prior)]), kernel='thin_plate_spline', smoothing=np.r_[np.full(len(nodes),4), np.full(len(prior),1000)])

    def inverse(pixel):
        pixel = np.atleast_2d(pixel)
        return pixel + warp(pixel)

    preview = im.copy()
    preview.thumbnail((4096, 4096), Image.Resampling.LANCZOS)
    render_scale = preview.width / width

    def mesh_sample(pixel, fn, cell_pixels):
        # Validate the piecewise-bilinear mesh actually rendered by Pillow.
        x, y = pixel * render_scale
        x0, y0 = math.floor(x/cell_pixels)*cell_pixels, math.floor(y/cell_pixels)*cell_pixels
        x1, y1 = min(x0+cell_pixels, preview.width), min(y0+cell_pixels, preview.height)
        fx, fy = (x-x0)/(x1-x0), (y-y0)/(y1-y0)
        q = fn(np.array([[x0,y0],[x0,y1],[x1,y1],[x1,y0]])/render_scale)
        return (1-fy)*((1-fx)*q[0]+fx*q[3])+fy*((1-fx)*q[1]+fx*q[2])

    grid_y, grid_x = np.mgrid[0:height:80j, 0:width:80j]
    grid = np.c_[grid_x.ravel(), grid_y.ravel()]
    base = inverse(grid)
    dx = inverse(grid+[.1,0])-base
    dy = inverse(grid+[0,.1])-base
    determinant = (dx[:,0]*dy[:,1]-dx[:,1]*dy[:,0])/.01
    assert determinant.min() > .3, f'Fold or excessive compression in sheet correction: {determinant.min()}'
    assert np.max(np.abs(warp(boundary))) < .1, 'Sheet boundary moved'
    checks = []
    fit_checks = []
    audit = []
    for point in config['points']:
        expected = (inverse_affine @ [*point['ref'], 1])[:2]
        solved = root(lambda pixel: mesh_sample(pixel, inverse, 16)-point['old'], expected)
        assert solved.success
        predicted = np.array([*solved.x, 1]) @ affine
        _, lat = lonlat(point['ref'])
        metres = np.linalg.norm(predicted - point['ref']) * ref_scale * 40075016.6856 / world * math.cos(math.radians(lat))
        if point['role'] == 'check':
            checks.append({'name': point['name'], 'errorMetres': round(float(metres), 1)})
        else:
            fit_checks.append({'name': point['name'], 'errorMetres': round(float(metres), 1)})
        previous_expected = (comparison_inverse @ [*point['ref'], 1])[:2]
        previous_solved = root(lambda pixel: mesh_sample(pixel, lambda p: p+comparison_warp(p), comparison['meshCellPixels'])-point['old'], previous_expected)
        assert previous_solved.success
        previous_predicted = np.array([*previous_solved.x, 1]) @ comparison_affine
        previous_metres = np.linalg.norm(previous_predicted - point['ref']) * ref_scale * 40075016.6856 / world * math.cos(math.radians(lat))
        if point['role'] == 'check':
            audit.append({'name': point['name'], 'beforeMetres': round(float(previous_metres), 1), 'afterMetres': round(float(metres), 1)})
    assert max(p['errorMetres'] for p in checks) < 65, checks
    assert max(p['errorMetres'] for p in fit_checks if p['name'].startswith('Grand Rond')) < 3, fit_checks
    corners = [(0, 0), (config['annotationWidth'], 0), (config['annotationWidth'], height), (0, height)]
    coordinates = [lonlat(np.array([x, y, 1]) @ affine) for x, y in corners]
    destination = ROOT / f'public/{name}'
    destination.mkdir(exist_ok=True)
    (destination / 'original.jpg').write_bytes(source.read_bytes())
    source_size = list(im.size)
    # Preserve the entire sheet and keep each WebGL texture within 4096 pixels.
    im.thumbnail((4096, 4096), Image.Resampling.LANCZOS)
    scale = im.width / width
    mesh = []
    # PIL's mesh performs one bicubic resampling, with shared edges between cells.
    for y0 in range(0, im.height, 16):
        for x0 in range(0, im.width, 16):
            x1, y1 = min(x0+16, im.width), min(y0+16, im.height)
            quad = inverse(np.array([[x0,y0],[x0,y1],[x1,y1],[x1,y0]])/scale)*scale
            mesh.append(((x0,y0,x1,y1), tuple(quad.ravel())))
    im = im.transform(im.size, Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)
    im.save(destination / 'map.webp', quality=92, method=6)
    metadata = {'sourcePage': config['sourcePage'], 'coordinates': coordinates, 'checkPoints': checks, 'method': config['method'], 'sourceSize': source_size, 'rasterSize': list(im.size), 'fitPointCount': len(points), 'minimumInverseJacobian': round(float(determinant.min()), 4)}
    (ROOT / f'src/{name}.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report = {'fitPoints': len(points), 'fitResiduals': fit_checks, 'independentChecks': audit, 'meanIndependentErrorMetres': {key: round(sum(p[key+'Metres'] for p in audit)/len(audit),1) for key in ['before','after']}, 'minimumInverseJacobian': metadata['minimumInverseJacobian'], 'boundaryMaxDisplacementPixels': round(float(np.max(np.abs(warp(boundary)))*scale), 4), 'validationMethod': 'Root solve of the actual 16-pixel renderer mesh; frozen street-baseline is the preceding 32-anchor regularized model, evaluated on identical current check annotations. Thirteen-anchor baseline retained as the affine frame; 1860 uses its soft prior, 1904 uses the frozen preceding 32-anchor field.', 'limitations': 'Manual landmark annotation, not a survey. Validation concerns the control-point network; outskirts beyond it remain less reliable. Original full sheet and source JPEG retained.'}
    (ROOT / f'data/{name}-validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'plan': name, **metadata}, ensure_ascii=True), flush=True)

for name in ['jourdan-1860', 'laffont-1904']:
    build(name)
