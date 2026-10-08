import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
// Expected backbone inventories are independently reconstructed from official
// 8JIV 1.1, 8JIW 1.2, and 7K00 3.1 mmCIFs; fixture provenance is retained in
// docs/qa/science-review-2026-10-05/evidence/review_structure_molecular_fix/.
const expected = [
  {
    file: "ribosome-8jiv-largeSubunit.json",
    pdb: "8JIV",
    chainCount: 44,
    markerCount: 9325,
    sourceSha256:
      "84fe7283ac151c646822bca24ee6ed26fc1826571f4fbf66b0f9af3248966b53",
    originalChainsSha256:
      "86a15b555bc68a7349986e38c6461ed0e7982912f18044d22fd32774e55bf44c",
    expectedChainsSha256:
      "2de4e7a346c9cf5ebcf4b52c9c78d4824f1d9a27a99df14da25a2d9cc627537d",
    modifiedResidues: {
      A: [
        35, 48, 68, 144, 369, 378, 650, 654, 668, 669, 798, 809, 811, 821, 823,
        880, 889, 912, 940, 964, 995, 1009, 1047, 1057, 1061, 1126, 1127, 1128,
        1137, 1371, 1441, 1453, 1454, 1467, 1473, 1475, 1512, 1530, 1844, 1847,
        1852, 1857, 1868, 1889, 1904, 2111, 2121, 2122, 2124, 2132, 2134, 2189,
        2195, 2209, 2218, 2223, 2234, 2276, 2279, 2286, 2291, 2312, 2316, 2319,
        2335, 2345, 2347, 2363, 2389, 2393, 2407, 2408, 2414, 2419, 2430, 2518,
        2616, 2622, 2643, 2653, 2654, 2685, 2715, 2720, 2732, 2738, 2747, 2794,
        2796, 2818, 2829, 2839, 2857, 2868, 2873, 2882, 2883, 2886, 2914, 2920,
        2924, 2925, 2926, 2937, 2947, 2949, 2951, 2956, 2958, 2962, 2978, 2995,
        3108, 3113, 3296, 3305,
      ],
      C: [18, 43, 74, 75],
      E: [246],
      PA: [55],
    },
  },
  {
    file: "ribosome-8jiw-smallSubunit.json",
    pdb: "8JIW",
    chainCount: 33,
    markerCount: 5983,
    sourceSha256:
      "f360e0688eec1fe38ac8d67ea11c233826e20e2f5865575eee37694aa874860c",
    originalChainsSha256:
      "ce6f5904e311647edcc159d8588bdd2edeaa5944ea134dcffd7fde89f3425dd8",
    expectedChainsSha256:
      "9e075ed5ac12cf70d53d3118e9d1b9ab1ac78f7d7632f99d68b62e1fef5234d1",
    modifiedResidues: {
      A: [
        28, 38, 103, 111, 121, 123, 162, 208, 246, 255, 258, 300, 306, 362, 383,
        392, 418, 440, 451, 468, 473, 545, 585, 599, 606, 615, 623, 636, 755,
        764, 797, 802, 811, 914, 951, 952, 979, 1004, 1014, 1029, 1108, 1122,
        1648, 1761, 1792, 1793,
      ],
    },
  },
  {
    file: "ribosome-7k00-largeSubunit.json",
    pdb: "7K00",
    chainCount: 31,
    markerCount: 6049,
    sourceSha256:
      "147e624572f8fc2efaea6617ab99fb86843818bd8bfa08fbb9121fbd185e3897",
    originalChainsSha256:
      "0af016834dc1439586f65a009716aefc522454e654b60e02120f2bd4e989e97b",
    expectedChainsSha256:
      "5a296a0006300d713a3341f13aaf28ee968d86527e9882208d60f32c1eb4ff65",
    modifiedResidues: {
      V: [
        745, 746, 747, 955, 1618, 1835, 1911, 1915, 1917, 1939, 1962, 2030,
        2069, 2251, 2445, 2449, 2457, 2498, 2503, 2504, 2552, 2580, 2604, 2605,
      ],
      Y: [150],
      GA: [81, 82],
    },
  },
  {
    file: "ribosome-7k00-smallSubunit.json",
    pdb: "7K00",
    chainCount: 21,
    markerCount: 3929,
    sourceSha256:
      "147e624572f8fc2efaea6617ab99fb86843818bd8bfa08fbb9121fbd185e3897",
    originalChainsSha256:
      "353b8c1d869a571c25ba05ec8c34cb03be14011c01f654575be50b29c5d6441b",
    expectedChainsSha256:
      "064e62610ac5a6c535d3c578230f069aa94b8852d764732727df00ecd3b36ef5",
    modifiedResidues: {
      A: [516, 527, 966, 967, 1207, 1402, 1407, 1498, 1516, 1518, 1519],
      K: [119],
      L: [89],
    },
  },
];
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
let added = 0;
for (const entry of expected) {
  const data = JSON.parse(
    readFileSync(new URL("../src/scene/data/" + entry.file, import.meta.url)),
  );
  assert.equal(data.pdb, entry.pdb);
  assert.equal(
    data.chains.length,
    entry.chainCount,
    entry.file + " chain membership changed",
  );
  assert.equal(
    data.chains.reduce((n, c) => n + c.residues.length, 0),
    entry.markerCount,
    entry.file + " omits modeled modifications",
  );
  assert.equal(
    data.sha256,
    entry.sourceSha256,
    entry.file + " source provenance mismatch",
  );
  assert.equal(
    digest(data.chains),
    entry.expectedChainsSha256,
    entry.file + " differs from deposited backbones",
  );
  const old = data.chains.map((chain) => {
    const modified = new Set(entry.modifiedResidues[chain.chain] || []);
    added += modified.size;
    assert.equal(
      new Set(chain.residues.map((r) => r[0])).size,
      chain.residues.length,
      "duplicate residue marker",
    );
    return {
      ...chain,
      residues: chain.residues.filter((r) => !modified.has(r[0])),
    };
  });
  assert.equal(
    digest(old),
    entry.originalChainsSha256,
    entry.file + " changed an original coordinate, chain, or residue",
  );
}
assert.equal(added, 208);
console.log(
  "Ribosome modified-residue review: 208 source-backed additions; original coordinates and chain membership preserved.",
);

// Exercise extraction as well as the checked-in output. The tiny synthetic
// mmCIF tests record classes, true sequence gaps, model/alt filtering, and
// rejection of non-polymer CA-like records without downloading anything.
const { spawnSync } = await import("node:child_process");
const { fileURLToPath } = await import("node:url");
const extractCheck = spawnSync(
  "python3",
  [
    "-c",
    `import importlib.util, json, pathlib, sys, tempfile, os
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("ribosomes", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
source = '''data_fixture
#
loop_
_entity.id
_entity.type
_entity.pdbx_description
1 polymer '23S rRNA'
2 polymer '50S ribosomal protein L3'
3 polymer '16S rRNA'
4 polymer '30S ribosomal protein S3'
5 non-polymer 'Calcium-like ligand'
6 water 'Water'
7 polymer 'tRNA-Phe'
#
loop_
_atom_site.group_PDB
_atom_site.label_atom_id
_atom_site.label_alt_id
_atom_site.label_asym_id
_atom_site.label_entity_id
_atom_site.label_seq_id
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.pdbx_PDB_model_num
ATOM "C4'" . A 1 1 0 0 0 1
HETATM "C4'" . A 1 2 1 0 0 1
ATOM "C4'" . A 1 4 3 0 0 1
HETATM "C4'" B A 1 2 9 9 9 1
HETATM "C4'" . A 1 5 9 9 9 2
HETATM "C4'" . A 1 ? 9 9 9 1
ATOM CA . B 2 1 0 1 0 1
HETATM CA . B 2 2 1 1 0 1
ATOM "C4'" . C 3 1 0 2 0 1
HETATM "C4'" . C 3 2 1 2 0 1
ATOM CA . D 4 1 0 3 0 1
HETATM CA . D 4 2 1 3 0 1
HETATM CA . X 5 1 9 9 9 1
HETATM CA . Y 6 1 9 9 9 1
HETATM "C4'" . T 7 1 9 9 9 1
#
'''
with tempfile.TemporaryDirectory(prefix="bioscape-ribosome-test-") as temp:
    os.chdir(temp)
    pathlib.Path("src/scene/data").mkdir(parents=True)
    path = pathlib.Path("fixture.cif")
    path.write_text(source)
    for pdb, forced in (("8JIV", "largeSubunit"), ("8JIW", "smallSubunit"), ("7K00", None)):
        module.extract(path, pdb, forced)
        result = []
        for data in pathlib.Path("src/scene/data").glob(f"ribosome-{pdb.lower()}-*.json"):
            result.extend(json.loads(data.read_text())["chains"])
        by_chain = {c["chain"]: c for c in result}
        assert set(by_chain) == {"A", "B", "C", "D"}, "non-polymer or tRNA leaked into backbones"
        assert [r[0] for r in by_chain["A"]["residues"]] == [1, 2, 4], "modified RNA lost or true gap filled"
        assert by_chain["A"]["residues"][1] == [2, 1.0, 0.0, 0.0], "wrong alternate or model"
        assert [r[0] for r in by_chain["B"]["residues"]] == [1, 2], "modified protein lost"
print("Synthetic extractor fixture passed")
`,
    fileURLToPath(
      new URL("../scripts/extract-specimen-ribosomes.py", import.meta.url),
    ),
  ],
  { encoding: "utf8" },
);
assert.equal(
  extractCheck.status,
  0,
  extractCheck.stderr || extractCheck.stdout,
);
console.log(
  "Extractor fixture: modified RNA/protein retained; true gaps and ligand/model/alternate exclusions preserved.",
);
