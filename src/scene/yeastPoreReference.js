import * as THREE from "three";
import reference from "./data/yeast-npc-8zzc.json";

const ID = "yeastNuclearPores";
const ANGSTROM = 0.0021;
const colors = {
  cytoplasmicCoat: "#8ca5ae",
  nuclearCoat: "#c7b8a9",
  cytoplasmicPlatform: "#b69879",
  channelLining: "#6f9091",
  innerScaffold: "#88aaa5",
  peripheralScaffold: "#a5b8ad",
  membraneRing: "#cabd9e",
  associatedDomains: "#a79c9d",
};

// Face numbers are local to the named molecular copy. A barycenter stays on the
// corresponding surface through the presentation merger, picking and worker transfer.
const observations = [
  {
    id: "Q",
    spoke: 3,
    face: 165,
    zh: "细胞质侧 Nup82 复合物",
    en: "Cytoplasmic Nup82 complex",
  },
  {
    id: "J",
    spoke: 5,
    face: 304,
    zh: "核质侧外环 · Nup84 复合物",
    en: "Nuclear outer ring · Nup84 complex",
  },
  {
    id: "AY",
    spoke: 0,
    face: 503,
    zh: "Pom152 膜腔侧拱",
    en: "Lumenal Pom152 arch",
  },
  {
    id: "AP",
    spoke: 0,
    face: 111,
    zh: "内环支架 Nup192",
    en: "Inner-ring scaffold Nup192",
    visibleModes: ["section"],
  },
];

function words(text, signed) {
  const bytes = atob(text);
  const result = signed
    ? new Int16Array(bytes.length / 2)
    : new Uint16Array(bytes.length / 2);
  for (let i = 0; i < result.length; i++)
    result[i] = bytes.charCodeAt(2 * i) | (bytes.charCodeAt(2 * i + 1) << 8);
  return result;
}

function spokeGeometry(data) {
  const pdb = words(data.positionsI16LE, true);
  const positions = new Float32Array(pdb.length);
  const colorsRGB = new Uint8Array(pdb.length);
  const scale = ANGSTROM * data.quantumAngstrom;
  // A proper rotation maps deposited +Z (cytoplasm) to Three +Y and preserves handedness.
  for (let i = 0; i < pdb.length; i += 3) {
    positions[i] = pdb[i] * scale;
    positions[i + 1] = pdb[i + 2] * scale;
    positions[i + 2] = -pdb[i + 1] * scale;
  }
  let first = 0;
  const color = new THREE.Color();
  for (const chain of data.chains) {
    color.set(colors[chain.family]);
    // A small luminance change separates neighboring subunits within one palette family.
    const protein = chain.name.split(/[.@]/)[0];
    if (
      ["Nup85", "Nup192", "Nup159", "Nup170", "Pom34", "Nup57"].includes(
        protein,
      )
    )
      color.multiplyScalar(0.84);
    if (["Sec13", "Seh1", "Dyn2", "Pom152"].includes(protein))
      color.multiplyScalar(1.1);
    const rgb = color.toArray().map((c) => Math.round(Math.min(1, c) * 255));
    for (let j = first; j < first + chain.vertices; j++)
      colorsRGB.set(rgb, 3 * j);
    first += chain.vertices;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colorsRGB, 3, true));
  geometry.setIndex(
    new THREE.BufferAttribute(words(data.indicesU16LE, false), 1),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function yeastPoreReference(data = reference) {
  const root = new THREE.Group();
  const geometry = spokeGeometry(data);
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.59,
    metalness: 0.055,
    clearcoat: 0.1,
    clearcoatRoughness: 0.65,
  });
  for (let spoke = 0; spoke < 8; spoke++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = (spoke * Math.PI) / 4;
    mesh.userData.hitId = ID;
    // With two adjacent molecular spokes removed, the cut exposes intact protein
    // interfaces and the central channel. Proteins spanning a sector retain their shapes.
    mesh.userData.cap = spoke === 6 || spoke === 7;
    root.add(mesh);
  }
  let firstFace = 0;
  const ranges = new Map();
  for (const chain of data.chains) {
    ranges.set(chain.id, { chain, firstFace });
    firstFace += chain.triangles;
  }
  const vertices = geometry.getAttribute("position");
  const index = geometry.index;
  root.userData.landmarks = observations.map(
    ({ id, spoke, face, ...label }) => {
      const { chain, firstFace } = ranges.get(id);
      const first = 3 * (firstFace + face);
      const point = new THREE.Vector3();
      const vertex = new THREE.Vector3();
      for (let k = 0; k < 3; k++)
        point.add(vertex.fromBufferAttribute(vertices, index.getX(first + k)));
      point.divideScalar(3).applyQuaternion(root.children[spoke].quaternion);
      return {
        ...label,
        position: point.toArray(),
        reference: "8ZZC/1",
        asymId: chain.copies[spoke],
      };
    },
  );
  root.rotation.x = 0.8;
  return root;
}
