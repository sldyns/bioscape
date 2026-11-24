"""Extract the joint 8B2L assembly from the deposited .cif or .cif.gz.

Usage: python3 scripts/extract-plant-80s.py 8B2L.cif.gz output.json
Only model-1 polymer C4' and C-alpha positions are retained, in angstroms.
"""
import gzip
import hashlib
import json
import shlex
import sys
from pathlib import Path


def extract(path):
    blob = path.read_bytes()
    cif = gzip.decompress(blob) if path.suffix == ".gz" else blob
    text = cif.decode()
    assert text.startswith("data_8B2L")
    entities, chains = {}, {}
    entity_columns, atom_columns = [], []
    in_entities = False
    for line in text.splitlines():
        if line.startswith("_entity."):
            entity_columns.append(line.split()[0].split(".")[1])
            in_entities = True
        elif in_entities and line.startswith("#"):
            in_entities = False
        elif in_entities:
            row = dict(zip(entity_columns, shlex.split(line)))
            entities[row["id"]] = row["pdbx_description"]
        elif line.startswith("_atom_site."):
            atom_columns.append(line.split()[0].split(".")[1])
        elif line.startswith(("ATOM ", "HETATM ")):
            row = dict(zip(atom_columns, line.split()))
            seq = row["label_seq_id"]
            if (seq in (".", "?") or row["pdbx_PDB_model_num"] != "1"
                    or row["label_alt_id"] not in (".", "A")):
                continue
            name = entities[row["label_entity_id"]]
            if name == "nascent chain":
                continue
            is_rna = name.endswith("rRNA") or name in ("mRNA", "tRNA")
            marker = "C4'" if is_rna else "CA"
            if row["label_atom_id"].strip('"') != marker:
                continue
            # In this deposit auth asym IDs ending in 1 or 3 designate the
            # SSU or LSU, respectively. The endogenous ligands are separate.
            author = row["auth_asym_id"]
            role = (name.lower() if name in ("mRNA", "tRNA") else
                    {"1": "plant40S", "3": "plant60S"}[author[-1]])
            key = row["label_asym_id"]
            chain = chains.setdefault(key, {
                "chain": key, "author": author, "name": name, "role": role,
                "kind": "rna" if is_rna else "protein", "residues": [],
            })
            chain["residues"].append([int(seq)] +
                                      [float(row["Cartn_" + a]) for a in "xyz"])
    assert len(chains) == 82 and len([c for c in chains.values() if c["role"] == "trna"]) == 2
    for chain in chains.values():
        seq = [r[0] for r in chain["residues"]]
        assert seq == sorted(set(seq))
    return {
        "pdb": "8B2L", "assembly": 1,
        "source": "https://files.rcsb.org/download/8B2L.cif",
        "sha256": hashlib.sha256(cif).hexdigest(), "units": "angstrom",
        "atoms": "RNA C4 prime; protein C alpha", "chains": list(chains.values()),
    }


if __name__ == "__main__":
    data = extract(Path(sys.argv[1]))
    Path(sys.argv[2]).write_text(json.dumps(data, separators=(",", ":")) + "\n")
