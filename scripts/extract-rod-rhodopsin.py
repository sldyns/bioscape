"""Extract deposited chain-A coordinates and native chromophore bonds for PDB 1U19.

python3 scripts/extract-rod-rhodopsin.py 1U19.pdb RET.cif --out src/compare/models/data/rod-rhodopsin-1u19.json
The input files can be kept offline. The output contains no amino-acid sequence.
"""
import argparse
import hashlib
import json
import math
import re
import shlex
from pathlib import Path


def require(condition, message):
    if not condition:
        raise ValueError(message)


def difference(a, b):
    return [x-y for x,y in zip(a,b)]


def cross(a, b):
    return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]


def dot(a, b):
    return sum(x*y for x,y in zip(a,b))


def unit(a):
    return [x/math.sqrt(dot(a,a)) for x in a]


def dihedral(a, b, c, d):
    axis=unit(difference(c,b))
    ab=difference(a,b)
    cd=difference(d,c)
    v=[v-axis[k]*dot(ab,axis) for k,v in enumerate(ab)]
    w=[v-axis[k]*dot(cd,axis) for k,v in enumerate(cd)]
    return math.degrees(math.atan2(dot(cross(axis,v),w),dot(v,w)))


def component_bonds(lines):
    for index,line in enumerate(lines):
        if line.strip()!="_chem_comp_bond.comp_id":
            continue
        fields=[]
        while index<len(lines) and lines[index].startswith("_chem_comp_bond."):
            fields.append(lines[index].strip().split(".")[-1])
            index+=1
        rows=[]
        while index<len(lines) and lines[index].strip()!="#":
            row=dict(zip(fields,shlex.split(lines[index])))
            if row.get("comp_id")=="RET":
                a,b=row["atom_id_1"],row["atom_id_2"]
                if re.fullmatch(r"C\d+",a) and re.fullmatch(r"C\d+",b):
                    rows.append([int(a[1:]),int(b[1:]),{"SING":1,"DOUB":2}[row["value_order"]]])
            index+=1
        return rows
    raise ValueError("Missing RET chemical-component bond records")


def extract(structure, component):
    lines=structure.read_text().splitlines()
    require(any(row.startswith("HEADER") and row[62:66]=="1U19" for row in lines),"Expected deposited 1U19 PDB coordinates")
    require(any(row.startswith("REMARK   2 RESOLUTION.") and "2.20 ANGSTROMS" in row for row in lines),"Unexpected crystallographic resolution")
    atoms={}
    serials={}
    order=[]
    for row in lines:
        if row.startswith("ENDMDL"):
            break
        if not row.startswith(("ATOM  ","HETATM")) or row[21]!="A" or row[16] not in (" ","A"):
            continue
        name,group,rid=row[12:16].strip(),row[17:20].strip(),int(row[22:26])
        if name=="CA" and row.startswith("ATOM"):
            require(row[26]==" " and rid not in order,"Unresolved backbone indexing")
            order.append(rid)
        if not (name=="CA" and row.startswith("ATOM") or group=="RET" or (group=="LYS" and rid==296)):
            continue
        key=(rid,name)
        require(key not in atoms,"Ambiguous atom alternate/identifier")
        atoms[key]=[float(row[a:a+8]) for a in (30,38,46)]
        serials[key]=int(row[6:11])
    require(order==list(range(1,349)),"Expected 348 uniquely ordered chain-A C-alpha sites")
    ca=[atoms[n,"CA"] for n in order]
    distances=[math.dist(a,b) for a,b in zip(ca,ca[1:])]
    require(min(distances)>2.6 and max(distances)<4.3,"Backbone coordinates contain a gap")
    records=[(int(row[21:25]),int(row[33:37]),int(row[38:40])) for row in lines if row.startswith("HELIX") and row[19]=="A" and row[31]=="A"]
    # Resolve PDB HELIX records split by kinks into the corresponding TM runs.
    # The short pre-TM-V 3_10 helix and surface helix VIII are separate.
    groups=((0,),(1,2),(3,),(4,5),(7,8),(9,),(10,11,12))
    tm=[]
    for group in groups:
        segments=[records[i] for i in group]
        require(all(0<=b[0]-a[1]<=1 for a,b in zip(segments,segments[1:])),"Discontinuous deposited helical annotation")
        tm.append([segments[0][0],segments[-1][1]])
    require(tm==[[33,65],[70,101],[105,140],[149,173],[199,224],[241,278],[284,309]],"Unexpected transmembrane annotation")
    require(records[6]==(195,198,5) and records[13]==(310,322,1),"Unexpected auxiliary helical annotation")
    sheets=[[int(row[22:26]),int(row[33:37])] for row in lines if row.startswith("SHEET") and row[21]=="A" and row[32]=="A"]
    require(len(sheets)==4,"Unexpected sheet annotation")
    links=[row for row in lines if row.startswith("LINK") and row[12:16].strip()=="NZ" and row[17:20]=="LYS" and row[21]=="A" and int(row[22:26])==296 and row[42:46].strip()=="C15" and row[47:50]=="RET" and row[51]=="A"]
    require(len(links)==1,"Missing or ambiguous retinylidene/Lys296 covalent link")
    ligand_id=int(links[0][52:56])
    require(set(name for rid,name in atoms if rid==ligand_id)=={f"C{i}" for i in range(1,21)},"Unexpected set of deposited ligand heavy atoms")
    retinal=[atoms[ligand_id,f"C{i}"] for i in range(1,21)]
    lys=[atoms[296,name] for name in ("CA","CB","CG","CD","CE","NZ")]
    bonds=component_bonds(component.read_text().splitlines())
    require(len(bonds)==20 and sum(order==2 for _,_,order in bonds)==5,"Incorrect retinal connectivity or order")
    deposited=set()
    for row in lines:
        if row.startswith("CONECT"):
            ids=[int(row[pos:pos+5]) for pos in range(6,len(row.rstrip()),5) if row[pos:pos+5].strip()]
            deposited.update(tuple(sorted((ids[0],other))) for other in ids[1:])
    for a,b,_ in bonds:
        atom_pair=tuple(sorted((serials[ligand_id,f"C{a}"],serials[ligand_id,f"C{b}"])))
        require(atom_pair in deposited,"CCD connectivity disagrees with the deposited ligand")
        require(1.15<math.dist(retinal[a-1],retinal[b-1])<1.72,"Ligand atom coordinates disagree with bonds")
    link_distance=math.dist(lys[-1],retinal[14])
    require(abs(link_distance-float(links[0][73:78]))<.02,"Link coordinates disagree with deposited bond length")
    cis=dihedral(*retinal[9:13])
    require(abs(cis)<90,"Deposited C10-C11=C12-C13 dihedral is on the trans side")
    sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    data={"pdb":"1U19","chain":"A","unit":"angstrom","resolution":2.2,
          "source":"https://files.rcsb.org/download/1U19.pdb","sha256":sha(structure),
          "bondSource":"https://files.rcsb.org/ligands/download/RET.cif","bondSha256":sha(component),
          "paper":"https://doi.org/10.1016/j.jmb.2004.07.044","firstResidue":1,
          "ca":ca,"tm":tm,"shortHelix":[195,198],"helixVIII":[310,322],"sheet":sheets,
          "retinal":{"atomOrder":"C1 through C20","positions":retinal,"bonds":bonds,"lys296":["CA","CB","CG","CD","CE","NZ"],"lysPositions":lys,"link":["C15","NZ",2]}}
    return data,{"residueCount":len(ca),"helixIntervals":tm,"backboneStepAngstrom":[round(min(distances),4),round(max(distances),4)],
                "retinalAtoms":len(retinal),"retinalBonds":len(bonds),"retinalCarbonDoubleBonds":5,
                "chromophoreCisDihedralDegrees":round(cis,3),"retinalLysLinkAngstrom":round(link_distance,4),
                "coordinatesSha256":sha(structure),"componentSha256":sha(component)}


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("structure",type=Path)
    parser.add_argument("component",type=Path)
    parser.add_argument("--out",type=Path,default=Path("src/compare/models/data/rod-rhodopsin-1u19.json"))
    args=parser.parse_args()
    data,summary=extract(args.structure,args.component)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(data,separators=(",",":"))+"\n")
    print(json.dumps(summary,separators=(",",":")))
