"""Extract residue backbone traces from the public PDB 4UG0 mmCIF.
Usage: python3 scripts/extract-ribosome.py /path/to/4UG0.cif
Source: https://files.rcsb.org/download/4UG0.cif
Only C4' (RNA) and C-alpha (protein), model 1; gaps remain disconnected.
"""
import sys,json,shlex,hashlib
from pathlib import Path
source=Path(sys.argv[1]);lines=source.read_text().splitlines();entities={};in_entities=False
for line in lines:
 if line.startswith('_entity.details'):in_entities=True;continue
 if in_entities:
  if line.startswith('#'):break
  row=shlex.split(line);entities[row[0]]=row[3]
chains={}
for line in lines:
 if not line.startswith('ATOM '):continue
 row=line.split();atom=row[3].strip('"');entity=row[7];name=entities[entity];kind='rna' if 'ribosomal RNA' in name else 'protein'
 if atom!=("C4'" if kind=='rna' else 'CA') or row[4] not in ('.','A') or row[20]!='1':continue
 subunit='largeSubunit' if ('60S' in name or name in ('28S ribosomal RNA','5S ribosomal RNA','5.8S ribosomal RNA')) else 'smallSubunit' if ('40S' in name or name=='18S ribosomal RNA') else None
 if not subunit:continue
 chain=row[6];record=chains.setdefault(chain,{'chain':chain,'entity':entity,'name':name,'kind':kind,'subunit':subunit,'residues':[]})
 record['residues'].append([int(row[8]),*[float(v) for v in row[10:13]]])
# Keep original deposited Angstrom coordinates; the renderer only recenters/rotates/scales.
result={'pdb':'4UG0','source':'https://files.rcsb.org/download/4UG0.cif','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'atoms':"RNA C4 prime; protein C alpha",'chains':list(chains.values())}
for subunit in ('largeSubunit','smallSubunit'):
 chunk={**result,'chains':[c for c in result['chains'] if c['subunit']==subunit]}
 target=Path(f'src/scene/data/ribosome-4ug0-{subunit}.json');target.write_text(json.dumps(chunk,separators=(',',':'))+'\n')
 print({'subunit':subunit,'chains':len(chunk['chains']),'residues':sum(len(c['residues']) for c in chunk['chains']),'bytes':target.stat().st_size})
