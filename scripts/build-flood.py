"""Reproduce the 1875 georeferenced raster. Requires numpy, scipy and Pillow.
Input coordinates are manually inspected in 1200px-wide previews; reference
pixels are a PLAN IGN WMTS mosaic (Web Mercator z15). No generated map content.
"""
from pathlib import Path
import json, math, hashlib, urllib.request
import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import RBFInterpolator
from scipy.ndimage import map_coordinates
from scipy.optimize import root

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT/'data/flood-1875-control-points.json').read_text())
source = ROOT/'.local/flood-original.jpg'
if not source.exists():
    source.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(config['sourceUrl'], source)
digest = hashlib.sha256(source.read_bytes()).hexdigest()
if config.get('sha256') and config['sha256'] != digest:
    raise RuntimeError('Original scan changed; recheck control points before building')
image = Image.open(source).convert('RGBA')
assert list(image.size) == config['sourceSize']
scale = image.width/config['annotationWidth']
mask = Image.new('L', image.size)
ImageDraw.Draw(mask).polygon([(x*scale,y*scale) for x,y in config['mask']], fill=255)
image.putalpha(mask)
array = np.array(image)
fit = [p for p in config['points'] if p['role']=='fit']
old = np.array([p['old'] for p in fit]); ref = np.array([p['ref'] for p in fit])
inverse = RBFInterpolator(ref, old, kernel='thin_plate_spline', smoothing=config['smoothing'])
forward = RBFInterpolator(old, ref, kernel='thin_plate_spline', smoothing=config['smoothing'])
reference = config['reference']
ref_scale = reference['width']/config['annotationWidth']
origin = np.array([reference['x0'],reference['y0']])*256
world_size = 2**reference['z']*256

def lonlat(x,y):
    return [float(x/world_size*360-180),float(math.degrees(math.atan(math.sinh(math.pi*(1-2*y/world_size)))))]

# Check points never participate in fitting. Measure the actual inverse renderer,
# rather than only the separately fitted forward approximation.
checks=[]
for point in config['points']:
    if point['role']!='check': continue
    expected=np.array(point['ref'])
    solved=root(lambda r: inverse([r])[0]-point['old'],expected)
    assert solved.success
    lon,lat=lonlat(*(origin+expected*ref_scale))
    metres_per_pixel=40075016.6856/world_size*math.cos(math.radians(lat))*ref_scale
    checks.append(dict(name=point['name'],errorMetres=round(float(np.linalg.norm(solved.x-expected)*metres_per_pixel),1),reference=[lon,lat]))

# Reject folded transformations over the map and its immediate surroundings.
y,x=np.mgrid[140:1301:20,20:1171:20]
coordinates=np.c_[x.ravel(),y.ravel()]
base=forward(coordinates);dx=forward(coordinates+[1,0])-base;dy=forward(coordinates+[0,1])-base
det=dx[:,0]*dy[:,1]-dx[:,1]*dy[:,0]
assert np.min(det)>0, 'Fold detected in map transformation'

# Use the full reference rectangle, including transparent margins; this keeps
# tile addressing predictable and all requested tiles inside bounds available.
width,height=1536,1792
out=ROOT/'public/flood-1875';out.mkdir(parents=True,exist_ok=True)

def render(x0,y0,size,factor):
    # Evaluate the smooth inverse on a dense mesh; bilinear interpolation of this
    # mesh avoids millions of costly spline evaluations without altering imagery.
    axis=np.linspace(.5,size-.5, max(17,size//16+1))
    gy,gx=np.meshgrid(axis,axis,indexing='ij')
    world=np.c_[x0+gx.ravel()*factor,y0+gy.ravel()*factor]
    mapped=inverse((world-origin)/ref_scale)*scale
    yy,xx=np.mgrid[0:size,0:size]
    meshcoords=[yy/(size-1)*(len(axis)-1),xx/(size-1)*(len(axis)-1)]
    sx=map_coordinates(mapped[:,0].reshape(len(axis),len(axis)),meshcoords,order=1)
    sy=map_coordinates(mapped[:,1].reshape(len(axis),len(axis)),meshcoords,order=1)
    rgba=np.stack([map_coordinates(array[:,:,i],[sy,sx],order=1,mode='constant',cval=0) for i in range(4)],axis=-1)
    return Image.fromarray(rgba)

count=0
for z in range(14,18):
    factor=2**(reference['z']-z)
    left=int(origin[0]/(256*factor));top=int(origin[1]/(256*factor))
    right=math.ceil((origin[0]+width)/(256*factor));bottom=math.ceil((origin[1]+height)/(256*factor))
    for col in range(left,right):
        directory=out/str(z)/str(col);directory.mkdir(parents=True,exist_ok=True)
        for row in range(top,bottom):
            render(col*256*factor,row*256*factor,256,factor).save(directory/f'{row}.webp',quality=90,method=4)
            count+=1
    print('Rendered zoom',z,flush=True)
# Overview below z14; assembled from z14 tiles to match exactly at the boundary.
left=int(origin[0]/512);top=int(origin[1]/512)
right=math.ceil((origin[0]+width)/512);bottom=math.ceil((origin[1]+height)/512)
overview=Image.new('RGBA',((right-left)*256,(bottom-top)*256))
for col in range(left,right):
    for row in range(top,bottom):overview.paste(Image.open(out/'14'/str(col)/f'{row}.webp'),((col-left)*256,(row-top)*256))
overview.save(out/'overview.webp',quality=92,method=6)
coordinates=[lonlat(left*512,top*512),lonlat(right*512,top*512),lonlat(right*512,bottom*512),lonlat(left*512,bottom*512)]
metadata=dict(bounds=[coordinates[3][0],coordinates[3][1],coordinates[1][0],coordinates[1][1]],coordinates=coordinates)
(ROOT/'src/flood-1875.json').write_text(json.dumps(metadata,indent=2))
report=dict(sourceUrl=config['sourceUrl'],sha256=digest,sourceSize=list(image.size),fitPoints=len(fit),independentCheckPoints=checks,medianCheckErrorMetres=round(float(np.median([p['errorMetres'] for p in checks])),1),maxCheckErrorMetres=max(p['errorMetres'] for p in checks),minimumForwardJacobian=float(np.min(det)),tileCount=count,bytes=sum(p.stat().st_size for p in out.rglob('*.webp')),limitations='Manual landmark checks, not a survey accuracy guarantee. Edge areas outside the control-point network are less reliable. Flood colouring is historical evidence, not a current flood-risk boundary.')
(ROOT/'data/flood-1875-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
