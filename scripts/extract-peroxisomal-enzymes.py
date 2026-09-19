"""Extract C-alpha backbones and cofactor positions from identity assemblies.
Usage: python3 scripts/extract-peroxisomal-enzymes.py /tmp/vc-1DGF.cif /tmp/vc-7Q86.cif
Both entries' biological assembly 1 uses identity operator 1. No crystal mates.
"""
import sys,json,hashlib,shlex
from pathlib import Path
for filename,pdb,allowed,ligand in zip(sys.argv[1:],['1DGF','7Q86'],['ABCD','AB'],['HEM','FAD']):
 source=Path(filename);lines=source.read_text().splitlines();cols=[s.split('.')[1].strip() for s in lines if s.startswith('_atom_site.')]
 chains={c:[] for c in allowed};cofactors={};seen=set()
 for line in lines:
  if not line.startswith(('ATOM ','HETATM ')):continue
  row=dict(zip(cols,shlex.split(line)));chain=row['label_asym_id'];name=row['label_atom_id'];alt=row['label_alt_id']
  if row['pdbx_PDB_model_num']!='1' or alt not in ('.','A'):continue
  xyz=[float(row['Cartn_'+axis]) for axis in 'xyz']
  if chain in chains and name=='CA' and row['label_seq_id'].isdigit():
   key=(chain,row['label_seq_id']);assert key not in seen;seen.add(key)
   chains[chain].append([int(row['label_seq_id']),int(row['auth_seq_id']),*xyz])
  if row['label_comp_id']==ligand and row['type_symbol']!='H':cofactors.setdefault(chain,[]).append([name,row['type_symbol'],*xyz])
 expected=1988 if pdb=='1DGF' else 1219
 assert sum(map(len,chains.values()))==expected,(pdb,{k:len(v) for k,v in chains.items()})
 assert len(cofactors)==len(allowed)
 bonds=[];in_bonds=False
 for line in lines:
  if line.startswith('_chem_comp_bond.'):in_bonds=True;continue
  if in_bonds and line.startswith('#'):break
  if in_bonds:
   fields=shlex.split(line)
   if fields and fields[0]==ligand:bonds.append(fields[1:4])
 result={'bonds':bonds,'pdb':pdb,'source':f'https://files.rcsb.org/download/{pdb}.cif','assembly':1,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'chains':chains,'cofactor':ligand,'cofactors':cofactors}
 Path(f'src/scene/data/enzyme-{pdb.lower()}.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
 print(pdb,{k:len(v) for k,v in chains.items()},'cofactors',len(cofactors))
