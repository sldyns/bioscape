import { vesicle, beads, anchorLabel } from "./structuralDetail.js";
import { fieldMembrane } from "./cellPlateMembrane.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
function create() {
  const k = sceneKit(),
    { group } = k;
  const wall = k.material("#c4b18f", {
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    pm = k.material("#9fae9d", {
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    septum = k.material("#b8a282"),
    cargo = k.material("#c79b75"),
    chitin = k.material("#dec197"),
    nucleus = k.material("#a297b5"),
    actin = k.material("#98aca6");
  const outer = k.mesh(
      new THREE.CylinderGeometry(
        0.77,
        0.77,
        1,
        48,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      wall,
    ),
    inner = k.mesh(
      new THREE.CylinderGeometry(
        0.69,
        0.69,
        1,
        48,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      pm,
    );
  outer.rotation.z = inner.rotation.z = Math.PI / 2;
  const cap = k.mesh(
    new THREE.SphereGeometry(0.77, 40, 24, Math.PI, Math.PI, 0, Math.PI / 2),
    wall,
  );
  const fusionMembrane = fieldMembrane(k, pm, {
    nx: 40,
    ny: 56,
    nz: 28,
    lo: [0, -0.84, -0.84],
    hi: [0.88, 0.84, 0],
    maxVertices: 150000,
    name: "Apical plasma membrane continuous with exocytotic vesicle lumens",
  });
  const memCap = fusionMembrane.mesh;
  cap.name = "Advancing hyphal apical wall";
  cap.rotation.z = -Math.PI / 2;
  const wallMatrix = k.material("#d6c29d", { side: THREE.DoubleSide });
  const middle = k.mesh(
    new THREE.CylinderGeometry(
      0.735,
      0.735,
      1,
      48,
      1,
      true,
      Math.PI / 2,
      Math.PI,
    ),
    wallMatrix,
  );
  middle.rotation.z = Math.PI / 2;
  const middleCap = k.mesh(
    new THREE.SphereGeometry(0.735, 40, 24, Math.PI, Math.PI, 0, Math.PI / 2),
    wallMatrix,
  );
  middleCap.rotation.z = -Math.PI / 2;
  const cutRails = [];
  for (const y of [-0.77, -0.735, -0.69, 0.69, 0.735, 0.77]) {
    const m = k.segment(
      [0, y, 0],
      [1, y, 0],
      0.014,
      Math.abs(y) > 0.75 ? chitin : actin,
    );
    cutRails.push(m);
  }
  const septa = [];
  for (const x of [-2.8, -1.4]) {
    const s = k.mesh(new THREE.RingGeometry(0.18, 0.72, 40), septum, [x, 0, 0]);
    s.name = "Septal solid wall with central pore";
    septa.push(s);
    s.rotation.y = Math.PI / 2;
    s.material.side = THREE.DoubleSide;
    const pore = k.ring([x, 0, 0], 0.185, 0.036, chitin);
    pore.rotation.y = Math.PI / 2;
    pore.name = "Septal pore rim with lumen";
    for (const dx of [-0.035, 0.035]) {
      const face = k.mesh(new THREE.RingGeometry(0.19, 0.7, 40), septum, [
        x + dx,
        0,
        0,
      ]);
      face.rotation.y = Math.PI / 2;
    }
    for (let n = 0; n < 16; n++) {
      const a = (n * Math.PI) / 8;
      k.segment(
        [x - 0.035, 0.2 * Math.sin(a), 0.2 * Math.cos(a)],
        [x + 0.035, 0.2 * Math.sin(a), 0.2 * Math.cos(a)],
        0.01,
        actin,
      );
    }
  }
  for (const [x, y] of [
    [-2.2, 0.2],
    [-0.7, -0.16],
    [0.2, 0.2],
  ])
    k.ball([x, y, 0], [0.25, 0.18, 0.2], nucleus);
  // Cytoskeletal routes terminate within each compartment; no cable pierces
  // the solid cross-wall. Vesicles pass the central pores between routes.
  for (const [start, end] of [
    [-3.2, -2.92],
    [-2.68, -1.52],
    [-1.28, 1.2],
  ])
    for (const y of [-0.42, 0.42]) {
      const cable = k.segment([start, y, -0.13], [end, y, -0.13], 0.025, actin);
      cable.name = "Compartment-local transport cable";
    }
  const spk = new THREE.Group();
  group.add(spk);
  spk.name =
    "Stratified Spitzenkorper with microvesicle core and macrovesicle periphery";
  const small = [];
  for (let i = 0; i < 54; i++) {
    const a = i * 2.39996,
      r = 0.22 * Math.sqrt((i + 0.5) / 54);
    small.push([Math.cos(a) * r, Math.sin(a) * r, 0.1 * Math.sin(i * 1.8)]);
  }
  beads(k, spk, small, 0.025, cargo, "Chitin synthase microvesicle core");
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const v = vesicle(k, cargo, chitin);
    group.remove(v);
    spk.add(v);
    v.scale.setScalar(0.065);
    v.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.02);
  }
  const vesicles = [];
  for (let i = 0; i < 20; i++) {
    const m = vesicle(k, pm, chitin);
    m.scale.setScalar(0.073);
    vesicles.push({
      m,
      index: i,
      shells: m.children.filter((n) => n.name.startsWith("Vesicle membrane")),
      cargo: m.children.filter((n) => n.name === "Vesicle lumen wall cargo"),
    });
  }
  // Cohorts receive released lumen material and stay on the expanding wall.
  // Shared geometry retains the strand detail without duplicating GPU buffers.
  const cohortGeometry = [];
  for (let strand = 0; strand < 3; strand++) {
    const pts = [];
    for (let j = 0; j <= 20; j++) {
      const t = j / 20;
      pts.push(
        new THREE.Vector3(
          0.012 * Math.sin(t * Math.PI * 6 + strand),
          -0.045 + t * 0.09,
          0.012 * Math.cos(t * Math.PI * 6 + strand),
        ),
      );
    }
    cohortGeometry.push(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        24,
        0.009,
        8,
        false,
      ),
    );
  }
  const deliveredCohorts = [];
  for (let i = 0; i < 20; i++)
    for (let cycle = 0; cycle < 3; cycle++) {
      const g = new THREE.Group();
      group.add(g);
      g.name = "Delivered wall matrix cohort";
      for (const geometry of cohortGeometry)
        k.mesh(geometry, chitin, [0, 0, 0], g);
      deliveredCohorts.push({ m: g, index: i, cycle });
    }
  const synthases = [],
    deposits = [];
  for (let i = 0; i < 15; i++) {
    const theta = -Math.PI * 0.44 + (i / 14) * Math.PI * 0.88;
    const m = new THREE.Group();
    group.add(m);
    m.name = "Apical membrane wall-synthase subunits";
    for (let n = 0; n < 3; n++)
      k.ball([-0.02, (n - 1) * 0.055, 0.015], [0.065, 0.032, 0.075], actin, m);
    k.ball([-0.085, 0, 0], [0.055, 0.08, 0.07], actin, m);
    synthases.push({ m, theta });
    const d = new THREE.Group();
    group.add(d);
    d.name = "Extracellular wall polymer bundle";
    for (let n = 0; n < 3; n++) {
      const pts = [];
      for (let j = 0; j <= 20; j++) {
        const t = j / 20;
        pts.push([
          0.02 * Math.sin(t * Math.PI * 6 + n),
          -0.085 + t * 0.17,
          0.02 * Math.cos(t * Math.PI * 6 + n),
        ]);
      }
      k.tube(pts, 0.012, chitin, d, 24);
    }
    deposits.push({
      m: d,
      theta,
      birth: 0.3 + (i / 14) * 0.6,
      side: i % 2 ? -1 : 1,
    });
  }
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0.3, -1.2, 0),
    1,
    0x96aaa9,
    0.2,
    0.13,
  );
  group.add(arrow);
  const labels = [
    k.label(
      [-2.4, 1.26, 0.5],
      "粗糙脉孢菌 · 有隔菌丝",
      "Neurospora crassa · septate hypha",
      3,
    ),
    k.label([-1.35, -1.0, 0.6], "带孔隔膜", "Porous septum", 2),
    k.label(
      [0.85, 0.78, 0.7],
      "顶体：囊泡聚集区",
      "Spitzenkörper: vesicle cluster",
      3,
    ),
    k.label(
      [2.1, 1.17, 0.4],
      "顶端膜融合与壁合成",
      "Apical fusion and wall synthesis",
      3,
    ),
    k.label(
      [-1.2, -1.45, 0.2],
      "膨压推动可延展的顶端壁",
      "Turgor expands the yielding tip wall",
      2,
    ),
  ];
  const fusing = new Float64Array(20 * 3);
  let fusionCount = 0;
  let membraneKey = "";
  const fusionAnchor = new THREE.Vector3();
  function update(value, parameters = {}) {
    const p = clamp(value),
      active = parameters.delivery !== "reduced",
      delivery = active ? 1 : 0.24,
      extension = ease(p, 0.28, 1) * 1.65 * delivery,
      tip = 1.15 + extension,
      length = tip + 3.3;
    [outer, inner, middle].forEach((m) => {
      m.position.x = (tip - 3.3) / 2;
      m.scale.y = length;
    });
    cap.position.x = memCap.position.x = middleCap.position.x = tip;
    cutRails.forEach((m) => {
      m.position.x = (tip - 3.3) / 2;
      m.scale.y = length;
    });
    spk.position.set(tip - 0.27, 0, 0);
    spk.scale.setScalar(0.65 + 0.35 * delivery);
    fusionCount = 0;
    vesicles.forEach(({ m, index: i, shells, cargo: contents }) => {
      const t = (p * 1.5 * delivery + i / 20) % 1;
      m.visible = active || i % 4 === 0;
      const emergence = ease(t, 0, 0.045);
      m.scale.setScalar(0.073 * emergence);
      const theta = -1.1 + ((i % 7) / 6) * 2.2;
      m.rotation.z = theta * ease(t, 0.68, 0.86);
      // Converge to the central septal pores rather than crossing solid septal walls.
      if (t < 0.68) {
        const transport = ease(t, 0, 0.68);
        m.position.set(
          -2.8 + (tip + 2.53) * transport,
          0.3 * Math.sin(i * 1.7) * (1 - transport),
          0.2 * Math.cos(i * 2.1) * (1 - transport),
        );
      } else if (t < 0.86) {
        const u = ease(t, 0.68, 0.86);
        m.position.set(
          tip - 0.27 + (0.27 + 0.617 * Math.cos(theta)) * u,
          0.617 * Math.sin(theta) * u,
          0,
        );
      } else {
        // The exterior and vesicle lumen share one isosurface; moving its
        // remaining cup outward incorporates its membrane into the apical PM.
        const radius = 0.617 + 0.17 * ease(t, 0.86, 0.98);
        m.position.set(
          tip + radius * Math.cos(theta),
          radius * Math.sin(theta),
          0,
        );
      }
      shells.forEach((shell) => {
        shell.visible = t < 0.84;
      });
      contents.forEach((body) => {
        body.scale.setScalar(0.19 * (1 - ease(t, 0.94, 0.98)));
      });
      if (m.visible && t >= 0.84 && t < 0.98) {
        fusing[fusionCount * 3] = m.position.x - tip;
        fusing[fusionCount * 3 + 1] = m.position.y;
        fusing[fusionCount * 3 + 2] = 0.073;
        fusionCount++;
      }
    });
    const nextMembraneKey = `${delivery}:${p}`;
    if (membraneKey !== nextMembraneKey) {
      fusionMembrane.update(
        (x, y, z) => {
          let field = 0.69 - Math.sqrt(x * x + y * y + z * z);
          for (let i = 0; i < fusionCount; i++) {
            const dx = x - fusing[i * 3],
              dy = y - fusing[i * 3 + 1],
              r = fusing[i * 3 + 2];
            const bound = field + r;
            if (
              bound > 0 &&
              Math.abs(dx) < bound &&
              Math.abs(dy) < bound &&
              Math.abs(z) < bound
            )
              field = Math.min(field, Math.sqrt(dx * dx + dy * dy + z * z) - r);
          }
          return field;
        },
        1,
        1,
      );
      membraneKey = nextMembraneKey;
    }
    deliveredCohorts.forEach(({ m, index: i, cycle }) => {
      const birth = (cycle + 0.94 - i / 20) / (1.5 * delivery);
      const live = birth >= 0 && birth <= p && (active || i % 4 === 0);
      const theta = -1.1 + ((i % 7) / 6) * 2.2,
        side = theta < 0 ? -1 : 1;
      const birthTip = 1.15 + ease(birth, 0.28, 1) * 1.65 * delivery;
      const x = birthTip + 0.79 * Math.cos(theta);
      const localX = Math.max(0, Math.min(0.79, x - tip));
      m.position.set(
        x,
        side * Math.sqrt(Math.max(0, 0.79 ** 2 - localX ** 2)),
        0,
      );
      m.rotation.z = Math.atan2(m.position.y, localX);
      m.scale.setScalar(ease(p, birth, birth + 0.04 / (1.5 * delivery)));
      m.visible = live;
    });
    vesicles.forEach(({ m }) => {
      const distance = Math.min(
        Math.abs(m.position.x + 2.8),
        Math.abs(m.position.x + 1.4),
      );
      const gate =
        0.12 + 0.88 * Math.min(1, Math.max(0, distance - 0.13) / 0.4);
      m.position.y *= gate;
      m.position.z *= gate;
    });
    synthases.forEach(({ m, theta }) => {
      m.position.set(tip + 0.69 * Math.cos(theta), 0.69 * Math.sin(theta), 0);
      m.visible = p >= 0.18;
      m.rotation.z = theta;
    });
    deposits.forEach(({ m, birth, side }, i) => {
      const birthTip = 1.15 + ease(birth, 0.28, 1) * 1.65 * delivery;
      m.position.set(birthTip, side * 0.766, 0.13);
      m.visible = p >= birth && (active || i % 4 === 0);
      m.scale.set(1, 1, 1);
      m.rotation.z = (side * Math.PI) / 2;
    });
    arrow.position.x = tip - 0.7;
    arrow.visible = p >= 0.3;
    labels[0].position.splice(0, 3, -2.4, 0.77, 0);
    anchorLabel(labels[1], septa[1], group);
    anchorLabel(labels[2], spk.children[0], group);
    labels[3].active = p >= 0.18;
    let fusionTarget = -1;
    for (let i = 0; i < fusionCount; i++) {
      const r = Math.hypot(fusing[i * 3], fusing[i * 3 + 1]);
      if (r > 0.635 && r < 0.75) {
        fusionTarget = i;
        break;
      }
    }
    if (fusionTarget >= 0) {
      const x = fusing[fusionTarget * 3],
        y = fusing[fusionTarget * 3 + 1],
        r = Math.hypot(x, y);
      fusionAnchor.set((0.69 * x) / r, (0.69 * y) / r, -0.025);
      const attr = memCap.geometry.attributes.position;
      let nearest = 0,
        distance = Infinity;
      for (let i = 0; i < memCap.geometry.drawRange.count; i++) {
        const dx = attr.getX(i) - fusionAnchor.x,
          dy = attr.getY(i) - fusionAnchor.y,
          dz = attr.getZ(i) - fusionAnchor.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < distance) {
          distance = d;
          nearest = i;
        }
      }
      anchorLabel(labels[3], memCap, group, nearest);
    } else anchorLabel(labels[3], synthases[7].m.children[0], group);
    labels[4].position.splice(0, 3, arrow.position.x + 0.85, -1.2, 0);
    labels[4].active = p >= 0.3;
    group.userData = {
      mechanism: "Spitzenkorper-mediated polarized hyphal tip growth",
      species: "Neurospora crassa",
      notBuddingYeast: true,
      selectedCondition: active ? "normal" : "reduced",
      tipPosition: tip + 0.77,
      extension,
      vesicleDeliveryFraction: delivery,
      wallSynthesisSide: "extracellular",
      septaHavePores: true,
      progress: p,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [3.8, 2.5, 9.5], target: [0.15, 0, 0] },
  };
}
export default {
  id: "fungalHyphae",
  title: b("丝状真菌的菌丝顶端生长", "Filamentous fungal tip growth"),
  duration: 32,
  intro: b(
    "粗糙脉孢菌（Neurospora crassa）的有隔菌丝，归入图谱的真菌入口；这里不是酿酒酵母。壁面剖切显示带孔隔膜、顶体和顶端膜，融合开口及释放的壁材料为放大示意。比较囊泡供应充分与减少的概念条件，比例不表示实验测量。",
    "A septate Neurospora crassa hypha, grouped under the atlas fungal entry; this is not budding yeast. The cutaway wall reveals porous septa, Spitzenkörper, and apical membrane; fusion openings and released wall material are enlarged schematics. Adequate versus reduced supply is a conceptual comparison, not measured kinetics.",
  ),
  controls: [
    {
      id: "delivery",
      label: b("顶端囊泡供应", "Apical vesicle supply"),
      default: "normal",
      options: [
        { value: "normal", label: b("供应充分", "Adequate supply") },
        { value: "reduced", label: b("供应减少", "Reduced supply") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("有方向的菌丝", "A polarized hypha"),
      description: b(
        "菌丝包含多个核与带孔隔膜。新长度主要从顶端增加；后方已有的壁与隔膜保持位置。",
        "The hypha contains multiple nuclei and porous septa. New length is added mainly at the tip; existing rear wall and septa retain their positions.",
      ),
    },
    {
      at: 0.16,
      title: b("囊泡运向顶端", "Vesicles move toward the apex"),
      description: b(
        "运输系统向顶端供应膜成分和壁合成相关货物。示意轨迹强调定向递送，不代表每个囊泡都沿同一条路径。",
        "Transport supplies membrane and wall-synthesis cargo toward the apex. Trajectories illustrate directed delivery rather than one obligatory route for every vesicle.",
      ),
    },
    {
      at: 0.32,
      title: b("顶体暂时组织囊泡", "The Spitzenkörper organizes vesicles"),
      description: b(
        "囊泡在顶端附近的顶体聚集后再递送到质膜。顶体是动态囊泡聚集区，不是由膜包裹的细胞器。",
        "Vesicles accumulate transiently in the Spitzenkörper before delivery to the plasma membrane. It is a dynamic cluster, not a membrane-bound organelle.",
      ),
    },
    {
      at: 0.49,
      title: b("膜融合与新壁沉积", "Fusion and wall deposition"),
      description: b(
        "囊泡与顶端质膜融合，补充膜并递送合酶。几丁质和葡聚糖等壁聚合物在质膜外形成新的壁材料。",
        "Apical exocytosis supplies membrane and synthases. Wall polymers including chitin and glucans form new material outside the plasma membrane.",
      ),
    },
    {
      at: 0.67,
      title: b("顶端伸展", "The tip extends"),
      description: b(
        "膨压推动可延展的顶端壁扩张；持续供膜与壁合成支持极性生长。供应减少时，模型显示较少的递送与较短的伸长。",
        "Turgor expands the yielding apical wall; membrane supply and wall synthesis sustain polarized growth. Reduced supply produces less delivery and less extension in this model.",
      ),
    },
    {
      at: 0.87,
      title: b("新壁逐渐成为侧壁", "New wall becomes lateral wall"),
      description: b(
        "顶端前进时，肩部新沉积的浅色壁束保留在后方，逐渐成为侧壁；成熟壁限制横向扩张。该场景省略内吞回收、分支与新隔膜生成。",
        "As the tip advances, pale wall bundles deposited at its shoulders remain behind as lateral wall; maturation limits lateral expansion. Endocytic recycling, branching, and new septum formation are omitted.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Spitzenkörper Localization and Intracellular Traffic of CHS-3 and CHS-6 in Living Hyphae of Neurospora crassa",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2043383/",
    },
    {
      title:
        "The Neurospora crassa exocyst complex tethers Spitzenkörper vesicles to the apical plasma membrane during polarized growth",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3982996/",
    },
    {
      title:
        "Traffic of Chitin Synthase 1 to the Spitzenkörper and Developing Septa in Hyphae of Neurospora crassa",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3127655/",
    },
  ],
  create,
};
