#!/usr/bin/env python3
"""Build the 8ZZC model 1 teaching surface. Requires Python 3 and NumPy.

    curl -fL https://files.rcsb.org/download/8ZZC.cif.gz -o 8zzc.cif.gz
    python3 scripts/extract-yeast-nuclear-pore.py 8zzc.cif.gz

No sequence, FG ensemble, fitted cross-deposit alignment or membrane is used.
"""

import argparse
import base64
from collections import defaultdict
import gzip
import hashlib
import io
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/scene/data/yeast-npc-8zzc.json"
SOURCE = "https://files.rcsb.org/download/8ZZC.cif.gz"
CIF_SHA256 = "321eace1bfbad132fa1d2897cd982e2797aa64d7e19600989a7938cf9cf8ee74"
STEP = 0.25  # Å per stored integer
GRID = 8.0  # Å; shared by the complete protein surfaces
SOFTNESS = 3.8  # Å; smooth union of the deposited spheres, per chain


def read_deposition(path):
    """The two selected loops have a single unquoted record per physical line in this entry."""
    packed = path.read_bytes()
    raw = gzip.decompress(packed) if packed.startswith(b"\x1f\x8b") else packed
    if hashlib.sha256(raw).hexdigest() != CIF_SHA256:
        raise ValueError("Unexpected 8ZZC mmCIF revision. Review the source before extracting.")
    chains = {}
    points = defaultdict(list)
    scope = ""
    fields = []
    for line in io.StringIO(raw.decode()):
        row = line.strip()
        if row == "loop_":
            scope, fields = "", []
        elif row.startswith("_"):
            scope, _, key = row.split()[0].partition(".")
            fields.append(key)
        elif row == "#":
            scope, fields = "", []
        elif scope == "_struct_asym" and row:
            r = dict(zip(fields, row.split()))
            chains[r["id"]] = (r["entity_id"], r["details"])
        elif scope == "_ihm_sphere_obj_site" and row:
            r = dict(zip(fields, row.split()))
            if r["model_id"] == "1":
                points[r["asym_id"]].append([float(r[key]) for key in (
                    "seq_id_begin", "seq_id_end", "Cartn_x", "Cartn_y", "Cartn_z", "object_radius"
                )])
    arrays = {}
    for cid, rows in points.items():
        a = np.asarray(rows)
        arrays[cid] = a[np.lexsort((a[:, 1], a[:, 0]))]
    return chains, arrays


def rotation(k):
    a = k * np.pi / 4
    c, s = np.cos(a), np.sin(a)
    # Row-vector convention
    return np.array([[c, s, 0], [-s, c, 0], [0, 0, 1]])


def validate_copies(chains, beads):
    """Find all 8 deposited copies and compare every (sequence interval, center, radius)."""
    rows = list(chains)
    master = rows[:rows.index(next(k for k in rows if chains[k][1] == "Nup84@2"))]
    means = {k: a[:, 2:5].mean(axis=0) for k, a in beads.items()}
    copies = {}
    covered = set()
    max_error = 0
    for cid in master:
        a = beads[cid]
        candidates = [k for k in rows if chains[k][0] == chains[cid][0] and len(beads[k]) == len(a)]
        copies[cid] = []
        for k in range(8):
            transform = rotation(k)
            expected = means[cid] @ transform
            matched = min(candidates, key=lambda key: np.linalg.norm(means[key] - expected))
            b = beads[matched]
            if matched in covered or not np.array_equal(a[:, [0, 1, 5]], b[:, [0, 1, 5]]):
                raise ValueError(f"Spoke correspondence failed for {cid}/{matched}")
            error = np.linalg.norm(a[:, 2:5] @ transform - b[:, 2:5], axis=1).max()
            max_error = max(max_error, error)
            covered.add(matched)
            copies[cid].append(matched)
    if covered != set(rows) or (len(master), len(covered)) != (68, 544) or max_error > 0.003:
        raise ValueError(f"Unexpected model 1 symmetry ({len(covered)} chains, {max_error} Å)")
    return copies, float(max_error)


def field_from_spheres(beads, pitch):
    """Evaluate a smooth union at lattice points. Each deposited bead retains its center and radius."""
    coords, radii = beads[:, 2:5], beads[:, 5]
    margin = radii.max() + 8 * SOFTNESS + pitch
    origin = np.floor((coords.min(axis=0) - margin) / pitch) * pitch
    shape = np.ceil((coords.max(axis=0) + margin - origin) / pitch).astype(int) + 1
    field = np.zeros(tuple(shape))
    for p, r in zip(coords, radii):
        reach = r + 8 * SOFTNESS
        lo = np.maximum(0, np.floor((p - reach - origin) / pitch).astype(int))
        hi = np.minimum(shape, np.ceil((p + reach - origin) / pitch).astype(int) + 1)
        axes = [(origin[i] + pitch * np.arange(lo[i], hi[i]) - p[i]) ** 2 for i in range(3)]
        d = np.sqrt(axes[0][:, None, None] + axes[1][None, :, None] + axes[2][None, None, :])
        field[tuple(slice(a, b) for a, b in zip(lo, hi))] += np.exp((r + 1.5 - d) / SOFTNESS)
    return origin, np.log(np.maximum(field, 1e-12))


def contour(field, pitch, origin):
    """One vertex per crossed cell. Each sign-changing grid edge contributes a closed surface quad."""
    shape = np.array(field.shape) - 1
    cell = np.zeros(tuple(shape) + (3,))
    count = np.zeros(tuple(shape), dtype=np.uint8)
    corners = list(np.ndindex(2, 2, 2))
    values = {c: field[tuple(slice(v, v + n) for v, n in zip(c, shape))] for c in corners}
    for c in corners:
        for axis in range(3):
            if c[axis] != 0:
                continue
            end = list(c)
            end[axis] = 1
            a, b = values[c], values[tuple(end)]
            crossed = (a > 0) != (b > 0)
            t = np.divide(a, a - b, out=np.zeros_like(a), where=crossed)
            cell += crossed[..., None] * np.array(c)
            cell[..., axis] += t
            count += crossed
    active = count > 0
    vertices = (np.argwhere(active) + cell[active] / count[active, None]) * pitch + origin
    ids = np.full(tuple(shape), -1, dtype=int)
    ids[active] = np.arange(len(vertices))
    faces = []
    for axis in range(3):
        u, v = (axis + 1) % 3, (axis + 2) % 3
        start = [slice(None)] * 3
        end = start.copy()
        start[axis], end[axis] = slice(None, -1), slice(1, None)
        inside = field[tuple(start)] > 0
        points = np.argwhere(inside != (field[tuple(end)] > 0))
        p0, p1, p3 = points.copy(), points.copy(), points.copy()
        p0[:, [u, v]] -= 1
        p1[:, v] -= 1
        p3[:, u] -= 1
        quad = np.stack([ids[tuple(i.T)] for i in (p0, p1, points, p3)], axis=1)
        if np.any(quad < 0):
            raise ValueError("Open density boundary")
        reverse = ~inside[tuple(points.T)]
        quad[reverse] = quad[reverse][:, [0, 3, 2, 1]]
        a = vertices[quad[:, 0]] - vertices[quad[:, 2]]
        b = vertices[quad[:, 1]] - vertices[quad[:, 3]]
        flip = (b * b).sum(axis=1) < (a * a).sum(axis=1)
        quad[flip] = quad[flip][:, [1, 2, 3, 0]]
        faces.extend((quad[:, [0, 1, 2]], quad[:, [0, 2, 3]]))
    return vertices, np.concatenate(faces)


def simplify(vertices, faces):
    """Collapse independent mesh edges using surface-plane quadrics, separately per protein.

    Reject flips and changes in the one-ring topology. The section can therefore remove
    whole molecular copies without opening, bridging or capping their individual contours.
    """
    target = max(24, int(np.ceil(len(vertices) * 0.19)))
    xyz = vertices.copy()
    v0, v1, v2 = xyz[faces].transpose(1, 0, 2)
    normal = np.cross(v1 - v0, v2 - v0)
    area = np.linalg.norm(normal, axis=1)
    normal /= np.maximum(area, 1e-15)[:, None]
    plane = np.column_stack((normal, -np.einsum("ij,ij->i", normal, v0)))
    weight = area[:, None, None] * plane[:, :, None] * plane[:, None, :]
    quadrics = np.zeros((len(xyz), 4, 4))
    for i in range(3):
        np.add.at(quadrics, faces[:, i], weight)
    while len(xyz) > target:
        edges = np.sort(np.concatenate((faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]])), axis=1)
        edges, incidence = np.unique(edges, axis=0, return_counts=True)
        edges = edges[incidence == 2]
        adjacent = [set() for _ in xyz]
        incident = [[] for _ in xyz]
        for u, v in edges:
            adjacent[u].add(v)
            adjacent[v].add(u)
        for i, face in enumerate(faces):
            for vertex in face:
                incident[vertex].append(i)
        a, b = edges.T
        q = quadrics[a] + quadrics[b]
        delta = np.column_stack((xyz[b] - xyz[a], np.zeros(len(a))))
        base = np.column_stack((xyz[a], np.ones(len(a))))
        qd = np.einsum("ijk,ik->ij", q, delta)
        denom = np.einsum("ij,ij->i", delta, qd)
        numer = -np.einsum("ij,ij->i", base, qd)
        t = np.clip(np.divide(numer, denom, out=np.full_like(denom, 0.5), where=denom > 1e-10), 0, 1)
        replacement = base + t[:, None] * delta
        cost = np.einsum("ij,ijk,ik->i", replacement, q, replacement)
        cost += 0.02 * np.einsum("ij,ij->i", delta, delta)
        mapping = np.arange(len(xyz))
        blocked = set()
        removed = 0
        for e in np.argsort(cost, kind="stable"):
            u, v = edges[e]
            if u in blocked or v in blocked or min(len(adjacent[u]), len(adjacent[v])) < 4:
                continue
            if len(adjacent[u] & adjacent[v]) != 2:
                continue
            nearby = sorted(set(incident[u]) ^ set(incident[v]))
            faces_here = faces[nearby]
            old = xyz[faces_here]
            new = old.copy()
            new[(faces_here == u) | (faces_here == v)] = replacement[e, :3]
            n0 = np.cross(old[:, 1] - old[:, 0], old[:, 2] - old[:, 0])
            n1 = np.cross(new[:, 1] - new[:, 0], new[:, 2] - new[:, 0])
            if np.any(np.einsum("ij,ij->i", n0, n1) <= 0):
                continue
            xyz[u] = replacement[e, :3]
            quadrics[u] += quadrics[v]
            mapping[v] = u
            blocked.update(adjacent[u] | adjacent[v] | {u, v})
            removed += 1
            if len(xyz) - removed <= target:
                break
        if not removed:
            break
        faces = mapping[faces]
        keep = (faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 2] != faces[:, 0])
        used, inverse = np.unique(faces[keep].ravel(), return_inverse=True)
        xyz, quadrics, faces = xyz[used], quadrics[used], inverse.reshape(-1, 3)
    return xyz, faces


def family(cid, name):
    protein = name.split("@")[0].split(".")[0]
    if protein in {"Nup84", "Nup85", "Nup120", "Nup133", "Nup145c", "Seh1", "Sec13"}:
        return "nuclearCoat" if "@" in name else "cytoplasmicCoat"
    if protein in {"Nup82", "Nup159", "Dyn2", "Gle1"} or cid in {"U", "V"}:
        return "cytoplasmicPlatform"
    if protein in {"Nsp1", "Nup49", "Nup57"}:
        return "channelLining"
    if protein in {"Nup188", "Nup192", "Nic96"}:
        return "innerScaffold"
    if protein in {"Pom152", "Ndc1", "Pom34"}:
        return "membraneRing"
    if protein in {"Nup157", "Nup170", "Nup53", "Nup59"}:
        return "peripheralScaffold"
    return "associatedDomains"


def encoded(array, dtype):
    return base64.b64encode(np.ascontiguousarray(array, dtype=dtype).tobytes()).decode("ascii")


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("cif", type=Path)
    cli.add_argument("--output", type=Path, default=OUTPUT)
    options = cli.parse_args()
    chains, beads = read_deposition(options.cif)
    copies, error = validate_copies(chains, beads)
    xyz, indices, records = [], [], []
    vertex_count = 0
    for cid, members in copies.items():
        a = beads[cid]
        # A finer grid keeps the sparsely represented membrane/basket segments visible.
        pitch = GRID / 2 if len(a) < 20 else GRID
        origin, field = field_from_spheres(a, pitch)
        vertices, tris = simplify(*contour(field, pitch, origin))
        xyz.append(np.rint(vertices / STEP))
        indices.append(tris + vertex_count)
        vertex_count += len(vertices)
        mid = a[np.argmin(np.linalg.norm(a[:, 2:5] - a[:, 2:5].mean(axis=0), axis=1))]
        records.append({
            "id": cid, "name": chains[cid][1], "family": family(cid, chains[cid][1]),
            "copies": members, "beads": len(a),
            "sample": [int(mid[0]), int(mid[1]), *mid[2:].tolist()],
            "vertices": len(vertices), "triangles": len(tris),
        })
    xyz, indices = np.concatenate(xyz), np.concatenate(indices)
    if xyz.min() < -32768 or xyz.max() > 32767 or len(xyz) > 65535:
        raise ValueError("Atlas exceeds its 16-bit coordinate or index format")
    asset = {
        "entry": "8ZZC", "model": 1, "organism": "Saccharomyces cerevisiae",
        "study": "Kim et al., Nature (2018)", "doi": "https://doi.org/10.1038/nature26003",
        "entryUrl": "https://www.rcsb.org/structure/8ZZC", "coordinateUrl": SOURCE,
        "cifSha256": CIF_SHA256, "sourceCategory": "_ihm_sphere_obj_site",
        "scope": "Model 1 Scaffold cluster 1. All modeled chains; model 2 FG ensemble excluded.",
        "orientation": "Deposited right-handed XYZ, +Z cytoplasmic (Nup82 complex), -Z nuclear.",
        "surface": "Per-chain smooth bead envelopes. Eight verified C8 copies. Display surfaces, not measured EM density.",
        "gridAngstrom": GRID, "quantumAngstrom": STEP, "copyMaxDeviationAngstrom": round(error, 6),
        "sourceBeads": sum(len(a) for a in beads.values()), "chains": records,
        "positionsI16LE": encoded(xyz, "<i2"), "indicesU16LE": encoded(indices, "<u2"),
    }
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(asset, separators=(",", ":")) + "\n")
    print(f"{len(xyz)} vertices and {len(indices)} triangles per spoke; {options.output.stat().st_size} bytes")


if __name__ == "__main__":
    main()
