"""Fit the live IGN mosaic to preserved streets; requires numpy and scipy.

Exports a small TPS model, evaluated once into a shared bilinear lookup grid by
the browser. Validation uses that grid, rather than just the ideal fitted spline.
"""
import json
import math
from pathlib import Path

import numpy as np
from scipy.optimize import root

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'data/etat-major-control-points.json').read_text())
baseline = json.loads((ROOT / 'data/etat-major-alignment-baseline.json').read_text())
fit = [p for p in config['points'] if p['role'] == 'fit']
offset = np.array(config['offsetPixels']) / config['annotationScale']
edges = np.linspace(0, 1, 25)
boundary = np.unique(np.vstack([np.c_[edges*1200, edges*0], np.c_[edges*1200, edges*0+1400], np.c_[edges*0, edges*1400], np.c_[edges*0+1200, edges*1400]]), axis=0)
nodes = np.vstack([[p['ref'] for p in fit], boundary]) / 1000
values = np.vstack([np.array([p['old'] for p in fit])-np.array([p['ref'] for p in fit])+offset, np.zeros_like(boundary)])

def previous(p):
    local=baseline['localCorrection']
    base=np.array(p)-offset
    t=np.clip((np.linalg.norm(np.array(p)-local['centre'])-local['innerRadius'])/(local['outerRadius']-local['innerRadius']),0,1)
    return base+(1-t*t*(3-2*t))*(np.array([*p,1])@np.array(local['inverseAffine'])-base)

px,py=np.meshgrid(np.arange(40,1200,80),np.arange(40,1400,80))
prior=np.c_[px.ravel(),py.ravel()]
prior=prior[np.min(np.linalg.norm(prior[:,None]-nodes[None]*1000,axis=2),axis=1)>25]
values=np.vstack([values,[previous(p)-p+offset for p in prior]])
smoothing=np.r_[np.full(len(nodes),4e-6),np.full(len(prior),.001)]
nodes=np.vstack([nodes,prior/1000])

def kernel(a, b):
    d = np.sum((a[:, None, :] - b[None, :, :])**2, axis=2)
    return .5 * d * np.log(np.maximum(d, 1e-30))

polynomial = np.c_[np.ones(len(nodes)), nodes]
system = np.block([[kernel(nodes, nodes)+np.diag(smoothing), polynomial], [polynomial.T, np.zeros((3, 3))]])
coefficients = np.linalg.solve(system, np.vstack([values, np.zeros((3, 2))]))
weights, affine = coefficients[:-3], coefficients[-3:]
step = 8
gx, gy = np.meshgrid(np.arange(0,1201,step), np.arange(0,1401,step))
positions = np.c_[gx.ravel(), gy.ravel()] / 1000
displacement = (kernel(positions,nodes)@weights+np.c_[np.ones(len(positions)),positions]@affine).reshape(gy.shape+(2,))
comparison=json.loads((ROOT/'data/etat-major-street-baseline.json').read_text())
cw=comparison['warp']
comparison_displacement=(kernel(positions,np.array(cw['nodes']))@np.array(cw['weights'])+np.c_[np.ones(len(positions)),positions]@np.array(cw['affine'])).reshape(displacement.shape)

def inverse(p, grid=displacement):
    x,y=p
    base=np.array(p)-offset
    if x<0 or y<0 or x>=1200 or y>=1400: return base
    ix,iy=int(x//step),int(y//step)
    fx,fy=x/step-ix,y/step-iy
    d=(1-fy)*((1-fx)*grid[iy,ix]+fx*grid[iy,ix+1])+fy*((1-fx)*grid[iy+1,ix]+fx*grid[iy+1,ix+1])
    return base+d

determinants=[]
for y in np.arange(4,1400,8):
    for x in np.arange(4,1200,8):
        p=np.array([x,y]);b=inverse(p)
        dx=(inverse(p+[.1,0])-b)/.1;dy=(inverse(p+[0,.1])-b)/.1
        determinants.append(np.linalg.det(np.array([dx,dy])))
assert min(determinants)>.3, min(determinants)
audit=[];residuals=[]
metres_per_annotation_pixel=1.28*40075016.6856/(2**15*256)*math.cos(math.radians(43.6))
for point in config['points']:
    errors=[]
    for fn in [lambda p: inverse(p, comparison_displacement),inverse]:
        solved=root(lambda p:fn(p)-point['old'],point['ref'])
        assert solved.success, point
        errors.append(round(float(np.linalg.norm(solved.x-point['ref'])*metres_per_annotation_pixel),1))
    if point['role']=='check': audit.append(dict(name=point['name'],beforeMetres=errors[0],afterMetres=errors[1]))
    else: residuals.append(dict(name=point['name'],errorMetres=errors[1]))
assert max(p['afterMetres'] for p in audit)<65, audit
model=dict(referenceZoom=15,offsetPixels=config['offsetPixels'],annotationScale=1.28,referenceOriginTiles=[16512,11962],points=config['points'],warp=dict(width=1200,height=1400,step=step,normalization=1000,nodes=nodes.tolist(),weights=weights.tolist(),affine=affine.tolist()),method=config['method'])
(ROOT/'src/etat-major-alignment.json').write_text(json.dumps(model,indent=2)+'\n')
boundary_displacement=np.concatenate([displacement[0],displacement[-1],displacement[:,0],displacement[:,-1]])
assert np.max(np.abs(boundary_displacement)) < .1
report=dict(fitPoints=len(fit),fitResiduals=residuals,independentChecks=audit,minimumInverseJacobian=round(min(determinants),4),maximumBoundaryDisplacementPixels=round(float(np.max(np.abs(boundary_displacement))),4),limitations='Manual landmarks on a 1:40000 raster. Checks exclude fitting anchors and use the same bilinear inverse grid as the browser. Correction is restricted to the Toulouse reference mosaic; outside it the earlier translation applies.')
report['meanIndependentErrorMetres']={key:round(sum(p[key+'Metres'] for p in audit)/len(audit),1) for key in ['before','after']}
report['validationMethod']='Same withheld street annotations evaluated through both actual bilinear grids. Frozen street-baseline is the immediately preceding 22-anchor dense model. Initial translation/local-affine baseline remains the soft prior.'
(ROOT/'data/etat-major-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
