"""Derive coarse placement contours from resolved C-alpha coordinates.
Each sample encloses a short backbone segment; these are NOT molecular surfaces.
Run after extract-peroxisomal-enzymes.py. The detailed views retain every C-alpha.
"""
import json,math
from pathlib import Path
result={}
for key,pdb in [('catalase','1dgf'),('oxidase','7q86')]:
 data=json.loads(Path(f'src/scene/data/enzyme-{pdb}.json').read_text());points=[r[2:] for rows in data['chains'].values() for r in rows];lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)];center=[(a+b)/2 for a,b in zip(lo,hi)];scale=1.6/max(b-a for a,b in zip(lo,hi));chains=[]
 for rows in data['chains'].values():
  samples=[]
  for start in range(0,len(rows),8):
   chunk=rows[start:start+8];p=[sum(r[i+2] for r in chunk)/len(chunk) for i in range(3)];r=math.sqrt(sum(sum((a[i+2]-p[i])**2 for i in range(3)) for a in chunk)/len(chunk))+2.6
   samples.append({'p':[round((p[i]-center[i])*scale,5) for i in range(3)],'r':[round(r*scale,5)]*3})
  chains.append(samples)
 result[key]={'pdb':data['pdb'],'sourceSha256':data['sha256'],'chains':chains}
Path('src/scene/data/peroxisome-contours.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
