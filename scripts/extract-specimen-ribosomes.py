"""Extract deposited model-1 ribosome backbones without bridging residue gaps.

Usage: python3 scripts/extract-specimen-ribosomes.py /directory/of/mmCIF/files
8JIV: wheat LSU; 8JIW: wheat SSU; 7K00: E. coli 70S, excluding tRNA/mRNA.
The selected deposits use single-line entity and atom records.
"""

import hashlib
import json
import shlex
import sys
from pathlib import Path

DEPOSITS = (("8JIV", "largeSubunit"), ("8JIW", "smallSubunit"), ("7K00", None))
LARGE_RNAS = {"23S ribosomal RNA", "5S ribosomal RNA", "23S rRNA", "5S rRNA"}
SMALL_RNAS = {"16S ribosomal RNA", "16S rRNA"}


def extract(source, pdb, forced_subunit):
    lines = source.read_text().splitlines()
    entities, entity_headers, atom_headers = {}, [], []
    in_entity = False
    for line in lines:
        if line.startswith("_entity."):
            entity_headers.append(line.split()[0])
            in_entity = True
            continue
        if in_entity:
            if line.startswith("#"):
                in_entity = False
                continue
            row = shlex.split(line)
            if row:
                assert len(entity_headers) == len(row), "Unsupported multiline entity record"
                entity = dict(zip(entity_headers, row))
                entities[entity["_entity.id"]] = entity
        if line.startswith("_atom_site."):
            atom_headers.append(line.split()[0])

    columns = {header.removeprefix("_atom_site."): i for i, header in enumerate(atom_headers)}
    chains = {}
    for line in lines:
        if not line.startswith("ATOM "):
            continue
        row = line.split()

        def value(name):
            return row[columns[name]]

        entity_id = value("label_entity_id")
        name = entities[entity_id]["_entity.pdbx_description"]
        kind = "rna" if "rRNA" in name or "ribosomal RNA" in name else "protein"
        atom = value("label_atom_id").strip('"')
        if (
            atom != ("C4'" if kind == "rna" else "CA")
            or value("label_alt_id") not in (".", "A")
            or value("pdbx_PDB_model_num") != "1"
        ):
            continue
        subunit = forced_subunit
        if subunit is None:
            if "50S" in name or name in LARGE_RNAS:
                subunit = "largeSubunit"
            elif "30S" in name or name in SMALL_RNAS:
                subunit = "smallSubunit"
        if subunit is None or value("label_seq_id") in (".", "?"):
            continue
        chain_id = value("label_asym_id")
        chain = chains.setdefault(chain_id, {
            "chain": chain_id,
            "entity": entity_id,
            "name": name,
            "kind": kind,
            "subunit": subunit,
            "residues": [],
        })
        chain["residues"].append([
            int(value("label_seq_id")),
            *[float(value(axis)) for axis in ("Cartn_x", "Cartn_y", "Cartn_z")],
        ])

    for subunit in sorted({chain["subunit"] for chain in chains.values()}):
        selected = [chain for chain in chains.values() if chain["subunit"] == subunit]
        assert {chain["kind"] for chain in selected} == {"rna", "protein"}
        result = {
            "pdb": pdb,
            "source": f"https://files.rcsb.org/download/{pdb}.cif",
            "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "atoms": "RNA C4 prime; protein C alpha",
            "chains": selected,
        }
        target = Path(f"src/scene/data/ribosome-{pdb.lower()}-{subunit}.json")
        target.write_text(json.dumps(result, separators=(",", ":")) + "\n")
        print(pdb, subunit, len(selected), sum(len(c["residues"]) for c in selected), target.stat().st_size)


if __name__ == "__main__":
    source_dir = Path(sys.argv[1])
    for pdb, subunit in DEPOSITS:
        extract(source_dir / f"{pdb}.cif", pdb, subunit)
