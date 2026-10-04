from pathlib import Path
import json, hashlib, datetime, sys
import numpy as np
from PIL import Image
base=Path(__file__).parent
folder=base/'browser'
rows=[]
for old,new in ([('baseline-all','optimized-all')] if '--processes' in sys.argv else [('baseline-all','optimized-all'),('baseline-structures','optimized-structures-final' if '--final-structures' in sys.argv else 'optimized-structures')]):
    left=json.loads((folder/f'{old}-manifest.json').read_text())
    right=json.loads((folder/f'{new}-manifest.json').read_text())
    assert left['completed']==left['selected']==right['completed']==right['selected']
    for a,b in zip(left['records'],right['records']):
        assert not a['errors'] and not b['errors']
        assert len(a['images'])==len(b['images'])
        for x,y in zip(a['images'],b['images']):
            px,py=folder/x['name'],folder/y['name']
            aa=np.array(Image.open(px).convert('RGBA'));bb=np.array(Image.open(py).convert('RGBA'))
            assert aa.shape==bb.shape
            d=np.abs(aa.astype(np.int16)-bb.astype(np.int16))
            rows.append({'baseline':x['name'],'optimized':y['name'],'width':aa.shape[1],'height':aa.shape[0],'changedPixels':int(np.any(d,axis=2).sum()),'maximumChannelDelta':int(d.max()),'baselineSha256':hashlib.sha256(px.read_bytes()).hexdigest(),'optimizedSha256':hashlib.sha256(py.read_bytes()).hexdigest(),'rgbaSha256':hashlib.sha256(bb.tobytes()).hexdigest()})
result={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Original 960x640 lossless captureFrame PNGs, labels enabled; exact decoded RGBA byte comparison. No rescaling, thresholding or masked pixels. Baseline contains all prior science fixes.','pairs':len(rows),'exactPairs':sum(r['changedPixels']==0 for r in rows),'changedPixels':sum(r['changedPixels'] for r in rows),'rows':rows}
(base/('pixel-processes.json' if '--processes' in sys.argv else 'pixel-comparison.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='rows'}))
