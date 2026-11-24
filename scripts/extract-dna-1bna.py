#!/usr/bin/env python3
"""Extract the deposited polymer coordinates and canonical contacts from 1BNA."""

import argparse
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKBONE = ["P", "OP1", "OP2", "O5'", "C5'", "C4'", "O4'", "C1'", "C2'", "C3'", "O3'"]
BASE_ATOMS = {
    "A": ["N9", "C8", "N7", "C5", "C6", "N6", "N1", "C2", "N3", "C4"],
    "G": ["N9", "C8", "N7", "C5", "C6", "O6", "N1", "C2", "N2", "N3", "C4"],
    "C": ["N1", "C2", "O2", "N3", "C4", "N4", "C5", "C6"],
    "T": ["N1", "C2", "O2", "N3", "C4", "O4", "C5", "C7", "C6"],
}
# Each donor/acceptor pair is named on the purine and pyrimidine respectively.
CONTACTS = {
    ("A", "T"): [("N6", "O4"), ("N1", "N3")],
    ("G", "C"): [("O6", "N4"), ("N1", "N3"), ("N2", "O2")],
}


def extract(source):
    lines = source.read_text(encoding="ascii").splitlines()
    assert lines[0][62:66] == "1BNA"
    assert any("1.90 ANGSTROMS" in line for line in lines if line.startswith("REMARK   2"))
    residues = {"A": {}, "B": {}}
    for line in lines:
        if not line.startswith("ATOM  "):
            continue
        chain, num = line[21], int(line[22:26])
        assert line[16] == " " and line[26] == " "
        assert line[17:20].strip() in {"D" + base for base in BASE_ATOMS}
        base, atom = line[19], line[12:16].strip()
        assert chain in residues and line[76:78].strip() in ("C", "N", "O", "P")
        item = residues[chain].setdefault(num, {"number": num, "base": base, "atoms": {}})
        assert atom not in item["atoms"] and base == item["base"]
        item["atoms"][atom] = [int(round(float(line[c:c + 8]) * 1000)) for c in (30, 38, 46)]

    chains = []
    for chain, chain_residues in residues.items():
        rows = []
        for index, number in enumerate(sorted(chain_residues)):
            residue = chain_residues[number]
            names = BACKBONE + BASE_ATOMS[residue["base"]]
            atoms = residue["atoms"]
            assert set(names) - set(atoms) == ({"P", "OP1", "OP2"} if index == 0 else set())
            assert set(atoms) - set(names) == set()
            rows.append({"number": number, "base": residue["base"], "xyz": [
                v for name in names for v in atoms.get(name, (None, None, None))
            ]})
        chains.append({"id": chain, "residues": rows})

    pairs, distances = [], []
    for a in residues["A"].values():
        partners = []
        for b in residues["B"].values():
            pair = (a["base"], b["base"])
            names = CONTACTS.get(pair)
            if not names:
                names = [(y, x) for x, y in CONTACTS.get(pair[::-1], [])]
            if not names:
                continue
            lengths = [math.dist(a["atoms"][x], b["atoms"][y]) / 1000 for x, y in names]
            if all(2.4 < length < 3.5 for length in lengths):
                partners.append(b["number"])
                pairs.append([a["number"], b["number"], names])
                distances.extend(lengths)
        assert len(partners) == 1, f"Ambiguous pair for chain A residue {a['number']}"
    assert [p[1] for p in pairs] == sorted(residues["B"], reverse=True)
    assert len(pairs) == 12 and len(distances) == 32
    assert sum(len(r["atoms"]) for chain in residues.values() for r in chain.values()) == 486
    return {
        "entry": "1BNA", "method": "X-ray diffraction", "resolutionAngstrom": 1.9,
        "coordinateUnitAngstrom": 0.001, "backboneAtoms": BACKBONE, "baseAtoms": BASE_ATOMS,
        "chains": chains, "pairs": pairs,
    }, distances


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdb", type=Path, help="local copy of https://files.rcsb.org/download/1BNA.pdb")
    parser.add_argument("--out", type=Path, default=ROOT / "src/scene/data/dna-1bna.json")
    args = parser.parse_args()
    data, lengths = extract(args.pdb)
    args.out.parent.mkdir(exist_ok=True, parents=True)
    args.out.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="ascii")
    print(f"1BNA: 486 DNA heavy atoms, 12 pairs, {len(lengths)} canonical contacts, "
          f"{min(lengths):.3f}–{max(lengths):.3f} Å")
