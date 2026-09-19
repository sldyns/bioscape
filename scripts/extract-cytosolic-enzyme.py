"""Extract resolved C-alpha coordinates from human triosephosphate isomerase 1HTI.
Usage: python3 scripts/extract-cytosolic-enzyme.py /path/to/1HTI.cif
"""
import sys,json,shlex,hashlib
from pathlib import Path
source=Path(sys.argv[1]);lines=source.read_text().splitlines();cols=[s.split('.')[1].strip() for s in lines if s.startswith('_atom_site.')];chains={'A':[],'B':[]}
for line in lines:
 if not line.startswith(('ATOM ','HETATM ')):continue
 row=dict(zip(cols,shlex.split(line)));chain=row['label_asym_id']
 if chain in chains and row['label_atom_id']=='CA' and row['label_alt_id'] in ('.','A') and row['pdbx_PDB_model_num']=='1':chains[chain].append([int(row['label_seq_id']),int(row['auth_seq_id']),*[float(row['Cartn_'+axis]) for axis in 'xyz']])
assert [len(v) for v in chains.values()]==[248,248]
Path('src/scene/data/cytosolic-enzyme-1hti.json').write_text(json.dumps({'pdb':'1HTI','source':'https://files.rcsb.org/download/1HTI.cif','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'chains':chains},separators=(',',':'))+'\n')
print({k:len(v) for k,v in chains.items()})
