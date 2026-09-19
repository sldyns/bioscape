"""Extract C-alpha positions of one mature cathepsin D (chains A/B) from PDB 1LYA.
Usage: python3 scripts/extract-cathepsin.py /path/to/1LYA.cif
"""
import sys,json,hashlib
from pathlib import Path
source=Path(sys.argv[1]);chains={'A':[],'B':[]}
for line in source.read_text().splitlines():
 if not line.startswith('ATOM '):continue
 row=line.split()
 if row[3]=='CA' and row[6] in chains and row[4] in ('.','A') and row[20]=='1':chains[row[6]].append([int(row[8]),int(row[16]),*[float(x) for x in row[10:13]]])
result={'pdb':'1LYA','source':'https://files.rcsb.org/download/1LYA.cif','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'chains':chains}
Path('src/scene/data/cathepsin-1lya.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print({k:len(v) for k,v in chains.items()})
