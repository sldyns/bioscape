#!/usr/bin/env python3
"""Extract occupied backbone and ring coordinates from the archived PDB 1KX5.

Usage: python3 scripts/extract-nucleosome-1kx5.py 1kx5.pdb.gz src/scene/data/nucleosome-1kx5.json
Only the Python standard library is required. Coordinates are centiångström integers.
"""
import argparse
from collections import defaultdict
import gzip
import hashlib
import json
import math
from pathlib import Path
from statistics import mean

SOURCE_SHA = "6f99aa27cffb3174d0406ebd644eba6475bed61047305aac94fb844d3718112a"
FAMILIES = ("H3", "H4", "H2A", "H2B") * 2
SUGAR = ("C4'", "O4'", "C1'", "C2'", "C3'")
PURINE = ("N9", "C8", "N7", "C5", "C6", "N1", "C2", "N3", "C4")
PYRIMIDINE = ("N1", "C2", "N3", "C4", "C5", "C6")


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(v):
    length = math.sqrt(dot(v, v))
    return tuple(x / length for x in v)


def average(points):
    return tuple(map(mean, zip(*points)))


def project(v, axis):
    return tuple(x - dot(v, axis) * n for x, n in zip(v, axis))


def frame(points):
    # The deposited DNA is bent. Average signed curvature vectors around its
    # smoothed centerline to determine a disc normal without assuming planarity.
    smoothed = [average(points[i - 4:i + 5]) for i in range(4, len(points) - 4)]
    normals = [cross(sub(smoothed[i], smoothed[i - 6]), sub(smoothed[i + 6], smoothed[i]))
               for i in range(6, len(smoothed) - 6)]
    axis = unit(average(normals))
    center = average(points)
    x = unit(project(sub(points[len(points) // 2], center), axis))
    y = unit(cross(axis, x))
    # Proper rotations around the canonical Z and X axes; keep the handedness.
    roll, pitch = map(math.radians, (-28, -48))
    a = tuple(math.cos(roll) * u - math.sin(roll) * v for u, v in zip(x, y))
    b = tuple(math.sin(roll) * u + math.cos(roll) * v for u, v in zip(x, y))
    c = tuple(math.cos(pitch) * u - math.sin(pitch) * v for u, v in zip(b, axis))
    d = tuple(math.sin(pitch) * u + math.cos(pitch) * v for u, v in zip(b, axis))
    assert abs(dot(a, cross(c, d)) - 1) < 1e-6
    return center, (a, c, d), axis


def parse(raw):
    atoms = defaultdict(dict)
    secondary = defaultdict(list)
    for line in raw.decode("ascii").splitlines():
        if line.startswith("HELIX "):
            chain, start, end, klass = line[19], int(line[21:25]), int(line[33:37]), int(line[38:40])
            assert chain == line[31] and klass in (1, 5)
            secondary[chain].append(["alpha" if klass == 1 else "310", start, end])
        if line.startswith("SHEET "):
            assert line[21] == line[32]
            secondary[line[21]].append(["strand", int(line[22:26]), int(line[33:37])])
        if not line.startswith("ATOM  "):
            continue
        assert line[26] == " ", "Unexpected insertion code"
        chain, residue, atom = line[21], int(line[22:26]), line[12:16].strip()
        occupancy = float(line[54:60])
        if occupancy <= 0:
            continue
        # Choose the best populated conformer, then blank/A for a tie.
        rank = (occupancy, line[16] == " ", line[16] == "A")
        target = atoms[(chain, residue)]
        if atom not in target or rank > target[atom][0]:
            target[atom] = (rank, tuple(float(line[i:i + 8]) for i in (30, 38, 46)))
    return {key: {k: v[1] for k, v in values.items()} for key, values in atoms.items()}, secondary


def extract(raw):
    source_sha = hashlib.sha256(raw).hexdigest()
    if source_sha != SOURCE_SHA:
        raise ValueError("PDB archive revision changed; review the source before updating the pinned hash.")
    atoms, secondary = parse(raw)
    residue_numbers = list(range(-73, 74))
    pairs = [average((atoms["I", n]["C1'"], atoms["J", -n]["C1'"])) for n in residue_numbers]
    center, rotation, axis = frame(pairs)

    def encode(p):
        return [round(100 * dot(row, sub(p, center))) for row in rotation]

    def flatten(points):
        return [n for p in points for n in encode(p)]

    proteins = []
    for chain, family in zip("ABCDEFGH", FAMILIES):
        runs, last = [], None
        for residue in sorted(n for ch, n in atoms if ch == chain):
            ca = atoms[chain, residue].get("CA")
            if ca is None:
                continue
            if last is None or last[0] + 1 != residue or math.dist(last[1], ca) > 4.5:
                runs.append({"start": residue, "ca": []})
            runs[-1]["ca"].extend(encode(ca))
            last = (residue, ca)
        # Keep the continuous occupied trace that contains the central histone
        # fold. Distal, disconnected tail islands cannot be joined reliably.
        main = next(r for r in runs if r["start"] <= 65 < r["start"] + len(r["ca"]) // 3)
        occupied = sum(len(r["ca"]) // 3 for r in runs)
        proteins.append({"chain": chain, "family": family, "start":main["start"], "ca":main["ca"],
                         "occupiedCa":occupied, "secondary":sorted(secondary[chain], key=lambda s: s[1])})

    strands = []
    for chain in "IJ":
        path, sugars, rings = [], [], []
        for n in residue_numbers:
            res = atoms[chain, n]
            # The deposited 5' ends have an O5' but no terminal phosphate.
            marker = res["O5'"] if n == residue_numbers[0] else res["P"]
            path.extend(flatten((marker, res["C4'"])))
            sugars.extend(flatten(res[k] for k in SUGAR))
            ring = PURINE if "N9" in res else PYRIMIDINE
            rings.append(flatten(res[k] for k in ring))
        path.extend(encode(atoms[chain, residue_numbers[-1]]["O3'"]))
        strands.append({"chain": chain, "first": -73, "last": 73,
                        "path": path, "sugars": sugars, "rings": rings})
    # One representative Watson-Crick contact per base pair. N1 of the purine
    # and N3 of the pyrimidine belong to the outlines retained above.
    contacts = []
    for n in residue_numbers:
        left, right = atoms["I", n], atoms["J", -n]
        contact = tuple(r["N1" if "N9" in r else "N3"] for r in (left, right))
        assert ("N9" in left) != ("N9" in right) and 2.4 < math.dist(*contact) < 4.3
        contacts.extend(flatten(contact))
    # Select one contiguous window from the front rail in the presentation frame.
    # Retain both physical ends, plus all eight histones, in the nucleosome cutaway.
    z = [encode(p)[2] for p in pairs]
    count = 31
    start = max(range(7, len(z) - count - 7), key=lambda i: sum(z[i:i + count]))
    dimer_pairs = (("C", "D"), ("G", "H"))
    def depth(chains):
        return mean(encode(res["CA"])[2] for (chain, n), res in atoms.items()
                    if chain in chains and 35 <= n <= 95 and "CA" in res)
    resolution = next(float(line.split()[3]) for line in raw.splitlines()
                      if line.startswith(b"REMARK   2 RESOLUTION."))
    data = {
        "pdb":"1KX5", "resolutionAngstrom":resolution, "coordinateScale":100,
        "sourceSha256":source_sha, "sourceCenter":center, "rotation":rotation,
        "discAxis":[dot(axis, row) for row in rotation],
        "pairing":"I[i] to J[146-i]; both strand arrays run 5-prime to 3-prime",
        "window":[start, start + count - 1], "frontDimer":list(max(dimer_pairs, key=depth)),
        "histones":proteins, "dna":strands, "contacts":contacts,
    }
    assert sum(h["occupiedCa"] for h in proteins) == 860
    assert sum(len(h["ca"]) // 3 for h in proteins) == 789
    assert all(len(d["rings"]) == 147 and len(d["path"]) == 295 * 3 for d in strands)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdb", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    raw = args.pdb.read_bytes()
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    data = extract(raw)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, separators=(",", ":")) + "\n")
    print(f"1KX5: 789 fold-connected C-alpha sites of 860 occupied, 294 sugars, 147 paired positions; window {data['window']}; dimer {''.join(data['frontDimer'])}")


if __name__ == "__main__":
    main()
