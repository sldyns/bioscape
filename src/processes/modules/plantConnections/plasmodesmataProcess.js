import { THREE, sceneKit, bilingual as b, clamp, ease } from "../../kit.js";
import { anatomy } from "./anatomy.js";

function create() {
  const k = sceneKit(),
    { group, material, mesh, ball, segment, tube, ring, label } = k;
  const detail = anatomy(k);
  const wall = material("#cabc99"),
    wall2 = material("#d9cdae"),
    pm = material("#86a99a", { side: THREE.DoubleSide }),
    er = material("#ac899f");
  const calloseMat = material("#cba65e"),
    cargoMat = material("#718eab"),
    smallMat = material("#af705e");
  const box = new THREE.BoxGeometry(1, 1, 1);
  const slab = (position, scale, mat) => {
    const o = mesh(box, mat, position);
    o.scale.set(...scale);
    return o;
  };
  // Two facing cell walls and middle lamella. Front wall material is cut away.
  for (const s of [-1, 1]) {
    for (const y of [-1.61, 1.61])
      slab([s * 0.52, y, 0], [0.92, 1.16, 2.5], s < 0 ? wall : wall2);
    slab([s * 0.52, 0, -1.14], [0.92, 2.05, 0.27], s < 0 ? wall : wall2);
    for (const y of [-1.63, 1.63])
      slab([s * 1.015, y, 0], [0.05, 1.18, 2.5], pm);
    slab([s * 1.015, 0, -1.29], [0.05, 2.05, 0.05], pm);
    for (let i = 0; i < 6; i++)
      tube(
        [
          [s * 0.97, 1.14 + i * 0.17, -1.21],
          [s * 0.53, 1.12 + i * 0.17, -1.23],
          [s * 0.1, 1.15 + i * 0.17, -1.2],
        ],
        0.026,
        wall2,
      );
    const cyto = slab(
      [s * 2.45, 0, -0.55],
      [2.75, 4.35, 1.65],
      material(s < 0 ? "#aacbbb" : "#b8d1bc", {
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    );
    cyto.renderOrder = -1;
  }
  slab([0, 1.61, 0], [0.045, 1.16, 2.5], material("#b1a57f"));
  slab([0, -1.61, 0], [0.045, 1.16, 2.5], material("#b1a57f"));
  // Longitudinal partial cylinder; explicit radii allow callose to narrow necks.
  const vertices = [],
    indices = [],
    segments = 48,
    slices = 16;
  for (let i = 0; i <= slices; i++)
    for (let j = 0; j <= segments; j++) {
      const a = 0.72 + (j * (Math.PI * 2 - 1.44)) / segments;
      vertices.push(
        -1.06 + (2.12 * i) / slices,
        0.84 * Math.sin(a),
        0.84 * Math.cos(a),
      );
      if (i < slices && j < segments) {
        const n = i * (segments + 1) + j;
        indices.push(
          n,
          n + 1,
          n + segments + 1,
          n + 1,
          n + segments + 2,
          n + segments + 1,
        );
      }
    }
  const shellGeometry = new THREE.BufferGeometry();
  shellGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  shellGeometry.setIndex(indices);
  shellGeometry.computeVertexNormals();
  mesh(shellGeometry, pm).name = "pore-cytosolic-leaflet";
  const secondLeaflet = shellGeometry.clone();
  mesh(secondLeaflet, material("#a8bdae", { side: THREE.DoubleSide })).name =
    "pore-wall-facing-leaflet";
  const lipidRows = 11,
    lipidAngles = 24,
    lipidCount = lipidRows * lipidAngles * 2;
  const poreHeads = new THREE.InstancedMesh(
    k.sphere,
    material("#bfd0b5"),
    lipidCount,
  );
  const poreTails = new THREE.InstancedMesh(
    k.cylinder,
    material("#b4bea0"),
    lipidCount,
  );
  poreHeads.name = "pore-paired-headgroups";
  poreTails.name = "pore-paired-lipid-tails";
  group.add(poreHeads, poreTails);
  const lipidTemp = new THREE.Object3D(),
    radial = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  poreHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  poreTails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const membraneLips = [];
  for (const side of [-1, 1]) {
    const lip = mesh(
      new THREE.RingGeometry(0.84, 1.45, 48, 1, 0.72, Math.PI * 2 - 1.44),
      pm,
      [side * 1.06, 0, 0],
    );
    lip.rotation.y = -Math.PI / 2;
    membraneLips.push(lip);
  }
  // The compressed ER is continuous with cortical ER on both sides, not a cargo pipe.
  const compressed = mesh(
    new THREE.CylinderGeometry(
      0.2,
      0.2,
      2.5,
      40,
      1,
      true,
      0.72,
      Math.PI * 2 - 1.44,
    ),
    er,
  );
  compressed.rotation.z = Math.PI / 2;
  compressed.scale.x = 0.6;
  const compressedInner = mesh(
    new THREE.CylinderGeometry(
      0.13,
      0.13,
      2.5,
      40,
      1,
      true,
      0.72,
      Math.PI * 2 - 1.44,
    ),
    material("#d2b7c4", { side: THREE.DoubleSide }),
  );
  compressedInner.rotation.z = Math.PI / 2;
  compressedInner.scale.x = 0.12;
  compressedInner.name = "appressed-ER-narrow-lumen";
  compressed.name = "appressed-ER-desmotubule";
  for (const side of [-1, 1])
    tube(
      [
        [-1.25, side * 0.105, 0.1],
        [0, side * 0.105, 0.11],
        [1.25, side * 0.105, 0.1],
      ],
      0.035,
      material("#d2b7c4"),
    );
  // Compressed lumen is a narrow seam, not an open cargo conduit.
  tube(
    [
      [-1.25, 0, 0.17],
      [0, 0, 0.18],
      [1.25, 0, 0.17],
    ],
    0.014,
    material("#ead4dc"),
  );
  for (let row = 0; row < 11; row++)
    for (const sign of [-1, 1]) {
      const y = sign * (1.1 + row * 0.095);
      detail.cellulose(
        group,
        [-0.98, y, 1.265],
        [0.97, y + 0.024, 1.265],
        0.02,
        4,
      );
      for (const side of [-1, 1])
        detail.cellulose(
          group,
          [side * 0.52, y, -1.15],
          [side * 0.56, y + 0.04, 1.24],
          0.024,
          4,
        );
    }
  for (const x of [-0.76, -0.36, 0.04, 0.44, 0.84])
    for (const side of [-1, 1])
      tube(
        [
          [x, side * 1.14, 1.28],
          [x + 0.04, side * 1.45, 1.29],
          [x - 0.03, side * 1.81, 1.27],
        ],
        0.012,
        material("#aaab81"),
      );

  for (const s of [-1, 1]) {
    tube(
      [
        [s * 1.1, 0, 0],
        [s * 1.6, -0.08, -0.14],
        [s * 2.05, -0.58, -0.32],
        [s * 3.35, -0.65, -0.38],
      ],
      0.14,
      er,
    );
    tube(
      [
        [s * 1.57, -0.08, -0.14],
        [s * 2.02, 0.57, -0.42],
        [s * 3.36, 0.72, -0.48],
      ],
      0.13,
      er,
    );
    for (let i = 0; i < 3; i++)
      tube(
        [
          [s * (2.2 + i * 0.4), -0.63, -0.33],
          [s * (2.3 + i * 0.4), 0, -0.48],
          [s * (2.25 + i * 0.4), 0.68, -0.44],
        ],
        0.07,
        er,
      );
  }
  for (const side of [-1, 1]) {
    for (const y of [-0.6, 0.7]) {
      const rib = detail.protein(
        group,
        [side * 2.7, y, -0.35],
        0.16,
        "#a690a0",
        "ER-associated-ribosome-schematic",
        2,
      );
      rib.rotation.y = side * 0.4;
      tube(
        [
          [side * 2.03, y, -0.3],
          [side * 2.3, y + 0.14, -0.35],
          [side * 2.72, y + 0.1, -0.35],
        ],
        0.023,
        material("#d2b5c4"),
      );
    }
  }
  for (const x of [-0.48, 0.42])
    for (const a of [1.6, 2.8, 4.2, 5.1])
      segment(
        [x, 0.22 * Math.sin(a), 0.22 * Math.cos(a)],
        [x, 0.77 * Math.sin(a), 0.77 * Math.cos(a)],
        0.026,
        material("#b2b3a4"),
      );
  const collars = [];
  for (const x of [-1, 1]) {
    const collar = ring([x, 0, 0], 1.057, 0.17, calloseMat);
    collar.rotation.y = Math.PI / 2;
    collars.push(collar);
  }
  const small = [];
  for (let i = 0; i < 4; i++)
    small.push(ball([-3.35 - i * 0.06, 0.43, 0.38], 0.095, smallMat));
  const large = new THREE.Group();
  group.add(large);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    ball(
      [Math.cos(a) * 0.14, Math.sin(a) * 0.14, ((i % 3) - 1) * 0.12],
      0.16,
      cargoMat,
      large,
    );
  }
  const labels = [
    label([-2.85, 1.95, 0.7], "相邻细胞 A", "Neighboring cell A", 3),
    label([2.85, 1.95, 0.7], "相邻细胞 B", "Neighboring cell B", 3),
    label(
      [0, 2.3, 0.3],
      "两侧细胞壁 · 中胶层",
      "Cell walls · middle lamella",
      2,
    ),
    label([0.15, 0.95, 0.72], "连续的质膜", "Continuous plasma membrane", 3),
    label([0, 0.35, 0.43], "胞质套筒", "Cytoplasmic sleeve", 3),
    label(
      [0.4, -0.3, 0.15],
      "中央连丝管（压缩内质网）",
      "Desmotubule (appressed ER)",
      3,
    ),
    label([-1.05, -1.02, 0.8], "胼胝质颈环", "Callose neck collar", 2),
    label(
      [-2.8, -1.35, 0.6],
      "大分子：受尺寸与调控限制",
      "Large cargo: size and regulation limit passage",
      2,
    ),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      restricted = parameters.gate === "callose";
    const gate = restricted ? ease(p, 0.35, 0.6) : 0,
      neckRadius = 0.84 - 0.35 * gate;
    // Deform the actual lumen, while the center remains wide.
    const pos = shellGeometry.attributes.position;
    for (let i = 0; i <= slices; i++) {
      const x = -1.06 + (2.12 * i) / slices,
        neck = Math.pow(Math.abs(x) / 1.06, 5),
        r = 0.84 - 0.35 * gate * neck;
      for (let j = 0; j <= segments; j++) {
        const a = 0.72 + (j * (Math.PI * 2 - 1.44)) / segments;
        pos.setXYZ(i * (segments + 1) + j, x, r * Math.sin(a), r * Math.cos(a));
      }
    }
    const outer = secondLeaflet.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i),
        r = Math.hypot(y, z);
      outer.setXYZ(i, x, (y * (r + 0.047)) / r, (z * (r + 0.047)) / r);
    }
    outer.needsUpdate = true;
    secondLeaflet.computeVertexNormals();
    secondLeaflet.computeBoundingBox();
    secondLeaflet.computeBoundingSphere();
    let lipidIndex = 0;
    for (let i = 0; i < lipidRows; i++)
      for (let j = 0; j < lipidAngles; j++) {
        const x = -1.02 + (i / (lipidRows - 1)) * 2.04,
          a = 0.75 + (j / (lipidAngles - 1)) * (Math.PI * 2 - 1.5),
          r = 0.84 - 0.35 * gate * Math.pow(Math.abs(x) / 1.06, 5);
        radial.set(0, Math.sin(a), Math.cos(a));
        for (let side = 0; side < 2; side++) {
          const radius = r + side * 0.047;
          lipidTemp.position.set(x, radius * Math.sin(a), radius * Math.cos(a));
          lipidTemp.quaternion.identity();
          lipidTemp.scale.setScalar(0.022);
          lipidTemp.updateMatrix();
          poreHeads.setMatrixAt(lipidIndex, lipidTemp.matrix);
          lipidTemp.position.set(
            x + (side ? -0.009 : 0.009),
            (r + 0.0235) * Math.sin(a),
            (r + 0.0235) * Math.cos(a),
          );
          lipidTemp.quaternion.setFromUnitVectors(up, radial);
          lipidTemp.scale.set(0.008, 0.035, 0.008);
          lipidTemp.updateMatrix();
          poreTails.setMatrixAt(lipidIndex++, lipidTemp.matrix);
        }
      }
    for (const item of [poreHeads, poreTails]) {
      item.instanceMatrix.needsUpdate = true;
      item.computeBoundingBox();
      item.computeBoundingSphere();
    }
    pos.needsUpdate = true;
    shellGeometry.computeVertexNormals();
    shellGeometry.computeBoundingSphere();
    shellGeometry.computeBoundingBox();
    membraneLips.forEach((lip) => {
      const positions = lip.geometry.attributes.position;
      for (let j = 0; j <= 48; j++) {
        const a = 0.72 + (j * (Math.PI * 2 - 1.44)) / 48;
        positions.setXYZ(
          j,
          neckRadius * Math.cos(a),
          neckRadius * Math.sin(a),
          0,
        );
      }
      positions.needsUpdate = true;
      lip.geometry.computeBoundingSphere();
      lip.geometry.computeBoundingBox();
    });
    collars.forEach((c) => {
      const positions = c.geometry.attributes.position,
        thickness = 0.17 + 0.35 * gate;
      for (let j = 0; j <= 10; j++)
        for (let i = 0; i <= 56; i++) {
          const u = (i / 56) * Math.PI * 2,
            v = (j / 10) * Math.PI * 2,
            r = 1.057 + thickness * Math.cos(v);
          positions.setXYZ(
            j * 57 + i,
            r * Math.cos(u),
            r * Math.sin(u),
            thickness * Math.sin(v),
          );
        }
      positions.needsUpdate = true;
      c.geometry.computeVertexNormals();
      c.geometry.computeBoundingSphere();
      c.geometry.computeBoundingBox();
    });
    // Small solutes move through sleeve, always outside compressed ER.
    for (let i = 0; i < small.length; i++) {
      const t =
        i === 0
          ? ease(p, 0.16, 0.41)
          : ease(p, 0.5 + i * 0.035, 0.78 + i * 0.06);
      const late = i > 0 && restricted;
      const x = late ? Math.min(-1.65, -3.3 + 6.5 * t) : -3.3 + 6.5 * t;
      small[i].position.set(x, 0.43 + (i % 2) * 0.04, 0.38 - (i % 2) * 0.05);
    }
    // This untargeted bulky probe remains excluded even in the open model.
    const approach = ease(p, 0.25, 0.53),
      retreat = ease(p, 0.7, 0.93);
    large.position.set(
      -3.25 + (1.8 - 0.5 * gate) * approach - 0.45 * retreat,
      -0.46,
      0.43,
    );
    large.rotation.set(0.15 * Math.sin(p * 4), p * 0.65, 0);
    group.userData = {
      process: "plasmodesmata",
      structuralDetail:
        "two pore leaflets with lipid tails; compressed ER lumen seam; layered cellulose and pectin cut walls",
      species: "Arabidopsis thaliana",
      condition: restricted ? "callose accumulation" : "low callose",
      topology: "cytosol A to cytosol B via plasma-membrane-lined sleeve",
      erContinuity: true,
      cargoRoute: "outside desmotubule within cytoplasmic sleeve",
      callose: gate,
      neckRadius,
      largeUntargetedCargoPasses: false,
      smallSoluteCompleted: small.filter((o) => o.position.x > 1.2).length,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [3.3, 2.6, 10.5], target: [0, 0, 0] },
  };
}
export default {
  id: "plasmodesmata",
  title: b("胞间连丝的选择性通行", "Selective traffic through plasmodesmata"),
  intro: b(
    "拟南芥相邻根细胞间单个胞间连丝的放大剖面。小溶质沿胞质套筒交换；中央连丝管连接两侧内质网。胼胝质积累会收窄颈部。演示一种未被主动转运的大分子被排除，不为所有蛋白或 RNA 设统一尺寸阈值；比例和时序均为示意。",
    "An enlarged cutaway of one plasmodesma between neighboring Arabidopsis root cells. Small solutes exchange through the cytoplasmic sleeve; the desmotubule connects the ER. Callose accumulation narrows the neck. One untargeted bulky cargo is excluded; no universal size cutoff is assigned to proteins or RNA. Dimensions and timing are schematic.",
  ),
  duration: 32,
  controls: [
    {
      id: "gate",
      label: b("颈部状态", "Neck state"),
      default: "open",
      options: [
        { value: "open", label: b("低胼胝质 · 通行", "Low callose · passage") },
        {
          value: "callose",
          label: b("胼胝质积累 · 收窄", "Callose accumulation · narrowing"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("穿过细胞壁的胞质连接", "A cytoplasmic connection across walls"),
      description: b(
        "孔道穿过相邻细胞的壁与中胶层。连续的质膜把孔内胞质与壁空间分开。",
        "The pore crosses the neighboring walls and middle lamella. A continuous plasma membrane separates its cytoplasm from the wall space.",
      ),
    },
    {
      at: 0.16,
      title: b("小溶质进入套筒", "Small solutes enter the sleeve"),
      description: b(
        "小溶质沿中央连丝管与质膜之间的胞质空间移动，不需要穿越脂双层。画面只跟踪从左到右的分子，交换本身可双向进行。",
        "Small solutes move between the desmotubule and plasma membrane without crossing a lipid bilayer. Left-to-right trajectories track selected molecules; exchange can occur in either direction.",
      ),
    },
    {
      at: 0.34,
      title: b("孔径限制与选择性", "Aperture and selectivity"),
      description: b(
        "示意的大体积货物不能被动穿过本孔道。部分蛋白与 RNA 的移动另受靶向、结合蛋白和组织状态调节。",
        "The illustrated bulky cargo cannot passively cross this pore. Movement of some proteins and RNA is additionally regulated by targeting, binding partners, and tissue state.",
      ),
    },
    {
      at: 0.52,
      title: b("胼胝质调节颈部", "Callose regulates the neck"),
      description: b(
        "切换为积累条件时，壁侧胼胝质颈环增厚并使膜内的可用通路收窄，后续小溶质也受阻。",
        "Under the accumulation condition, the wall-side callose collar thickens and reduces the available passage inside the membrane, blocking subsequent small solutes in this schematic.",
      ),
    },
    {
      at: 0.74,
      title: b(
        "内质网连续，通路有别",
        "ER continuity and a distinct cargo route",
      ),
      description: b(
        "中央的压缩内质网连接两细胞；本模型的可溶性货物始终在其外侧的胞质套筒中移动。",
        "The central appressed ER connects both cells; soluble cargo in this model always travels through the cytoplasmic sleeve outside it.",
      ),
    },
    {
      at: 0.91,
      title: b("组织间通透性可调", "Tissue permeability is adjustable"),
      description: b(
        "低胼胝质时小溶质到达相邻胞质；积累时通行减少。真实通透性依赖发育与环境，不能仅凭分子质量判定。",
        "With low callose, small solutes reach the neighboring cytosol; accumulation reduces passage. Actual permeability depends on development and environment, not molecular mass alone.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Callose biosynthesis regulates symplastic trafficking during root development (Vatén et al., 2011)",
      url: "https://pubmed.ncbi.nlm.nih.gov/22172675/",
    },
    {
      title:
        "The structure of plasmodesmata as revealed by plasmolysis, detergent extraction, and protease digestion (1991)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2288846/",
    },
  ],
  create,
};
