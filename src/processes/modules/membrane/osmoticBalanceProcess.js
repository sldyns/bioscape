import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { seeded, mix } from "./membraneGeometry.js";

export default {
  id: "osmoticBalance",
  title: b("红细胞的渗透响应", "Osmotic response of a red blood cell"),
  intro: b(
    "以成熟哺乳动物红细胞为例，比较外液中不透膜溶质造成的低渗、等渗和高渗响应。膜允许水交换，溶质保留在各自一侧。局部切窗显示膜内面与膜骨架的示意；仅表现短时形态变化，未模拟调节、定量体积或溶血。",
    "A mature mammalian red blood cell illustrates responses to hypotonic, isotonic, and hypertonic media containing impermeant solutes. Water exchanges across the membrane while solutes remain on their own side. A local cutaway shows the cytoplasmic membrane face and a schematic membrane skeleton. Short-term shape changes are schematic; regulation, quantitative volume, and hemolysis are not simulated.",
  ),
  duration: 28,
  stages: [
    {
      at: 0,
      title: b("初始双凹形", "Initial biconcave shape"),
      description: b(
        "成熟哺乳动物红细胞没有细胞核和细胞壁。外液张力相对于细胞内定义。",
        "A mature mammalian red cell has no nucleus or cell wall. External tonicity is defined relative to the cell interior.",
      ),
    },
    {
      at: 0.18,
      title: b("水持续双向交换", "Continuous bidirectional water exchange"),
      description: b(
        "水分子可向两个方向穿膜，箭头大小表示示意的相对通量。",
        "Water crosses in both directions; arrow size indicates schematic relative flux.",
      ),
    },
    {
      at: 0.38,
      title: b("张力决定净水流", "Tonicity determines net water movement"),
      description: b(
        "低渗外液使水净流入，高渗外液使水净流出；等渗没有净水流。",
        "Hypotonic medium drives net water entry; hypertonic medium drives net exit. Isotonic medium has no net water movement.",
      ),
    },
    {
      at: 0.63,
      title: b("膜轮廓与体积响应", "Membrane shape and volume respond"),
      description: b(
        "膜面积近似保留：吸水使细胞更饱满，失水通过皱褶容纳多余膜面积；等渗下形态保持稳定。",
        "Membrane area is approximately conserved: water gain makes the cell fuller, while folds accommodate excess area after water loss. Shape remains stable in isotonic medium.",
      ),
    },
    {
      at: 0.86,
      title: b("比较三个条件", "Compare the three conditions"),
      description: b(
        "此模型止于形态响应。更强或更久的低渗暴露可导致膜破裂；等渗仍存在动态水交换。",
        "This model stops at the shape response. Stronger or prolonged hypotonic exposure can rupture the membrane; isotonic conditions still allow dynamic water exchange.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Structural basis of membrane skeleton organization in red blood cells",
      url: "https://pubmed.ncbi.nlm.nih.gov/37044097/",
    },
    {
      title:
        "Geometric, osmotic, and membrane mechanical properties of density-separated human red cells",
      url: "https://pubmed.ncbi.nlm.nih.gov/7082818/",
    },
    {
      title: "Physiology, Osmosis — NCBI Bookshelf",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK557609/",
    },
    {
      title: "OpenStax Biology — Passive Transport",
      url: "https://openstax.org/books/biology/pages/5-2-passive-transport",
    },
  ],
  controls: [
    {
      id: "tonicity",
      label: b("外液张力", "External tonicity"),
      default: "hypotonic",
      options: [
        {
          value: "hypotonic",
          label: b("低渗 · 吸水", "Hypotonic · water gain"),
        },
        {
          value: "isotonic",
          label: b("等渗 · 净水流为零", "Isotonic · zero net flow"),
        },
        {
          value: "hypertonic",
          label: b("高渗 · 失水", "Hypertonic · water loss"),
        },
      ],
    },
  ],
  legend: [
    { color: "#bc8184", text: b("红细胞膜轮廓", "Red-cell membrane contour") },
    { color: "#80a9b5", text: b("水", "Water") },
    { color: "#b7a679", text: b("不透膜溶质", "Impermeant solute") },
  ],
  create() {
    const k = sceneKit();
    const geometry = new THREE.SphereGeometry(1, 64, 40);
    const base = Float32Array.from(geometry.attributes.position.array);
    const outerMat = k.material("#bc8184", { roughness: 0.43 });
    const windowMat = k.material("#d4a5a5", {
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const membrane = k.mesh(geometry, [outerMat, windowMat]);
    membrane.name = "deforming-red-cell-membrane";
    // A bounded front window reveals the cytoplasmic leaflet and membrane
    // skeleton; the rest of the cell remains opaque. Triangle topology is fixed.
    const ix = geometry.index;
    const inWindow = (i) =>
      base[i * 3 + 2] > 0.35 &&
      base[i * 3 + 1] > 0.12 &&
      Math.abs(base[i * 3]) < 0.62;
    geometry.clearGroups();
    let runStart = 0,
      runMaterial = -1;
    for (let i = 0; i < ix.count; i += 3) {
      const material = [0, 1, 2].every((j) => inWindow(ix.getX(i + j))) ? 1 : 0;
      if (material !== runMaterial) {
        if (i > runStart)
          geometry.addGroup(runStart, i - runStart, runMaterial);
        runStart = i;
        runMaterial = material;
      }
    }
    geometry.addGroup(runStart, ix.count - runStart, runMaterial);
    const innerGeometry = geometry.clone();
    const inner = k.mesh(innerGeometry, [
      k.material("#9c6f79", { roughness: 0.64 }),
      windowMat,
    ]);
    inner.name = "cytoplasmic-leaflet-continuous-shell";
    const cortexMat = k.material("#d7b88d");
    const cortexNodes = [];
    const cortexEdges = [];
    for (let lat = 4; lat < 38; lat += 3)
      for (let lon = 0; lon < 64; lon += 3) {
        const i = lat * 65 + lon;
        if (!inWindow(i)) continue;
        cortexNodes.push(i);
        for (const j of [i + 3, i + 3 * 65, i + 3 * 65 + 3])
          if (j < base.length / 3 && inWindow(j)) cortexEdges.push([i, j]);
      }
    const cortex = new THREE.InstancedMesh(
      k.cylinder,
      cortexMat,
      cortexEdges.length,
    );
    cortex.name = "schematic-spectrin-cortex";
    k.group.add(cortex);
    const junctions = new THREE.InstancedMesh(
      k.sphere,
      cortexMat,
      cortexNodes.length,
    );
    junctions.name = "cortical-junctions";
    k.group.add(junctions);
    const corticalTemp = new THREE.Object3D(),
      ca = new THREE.Vector3(),
      cb = new THREE.Vector3(),
      cd = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    const anchors = new THREE.InstancedMesh(
      k.cylinder,
      k.material("#a8b4a7"),
      cortexNodes.length,
    );
    anchors.name = "membrane-cortex-attachments";
    k.group.add(anchors);
    const waterMat = k.material("#80a9b5");
    const soluteMat = k.material("#b7a679");
    const water = Array.from({ length: 20 }, (_, i) => ({
      mesh: k.ball([0, 0, 0], 0.07, waterMat),
      angle: (i * Math.PI * 2) / 20,
    }));
    const solutes = Array.from({ length: 30 }, (_, i) => {
      const a = i * 2.39996,
        r = 2.8 + seeded(i, 13) * 0.6;
      return k.ball(
        [Math.cos(a) * r, (seeded(i, 17) - 0.5) * 1.5, Math.sin(a) * r],
        0.1,
        soluteMat,
      );
    });
    function arrow(x, direction) {
      const g = new THREE.Group();
      k.group.add(g);
      g.position.set(x, 0.2, 2.35);
      k.segment([0, 0, 0], [direction * 0.65, 0, 0], 0.045, waterMat, g);
      const head = k.mesh(
        new THREE.ConeGeometry(0.15, 0.28, 16),
        waterMat,
        [direction * 0.79, 0, 0],
        g,
      );
      head.rotation.z = (-direction * Math.PI) / 2;
      return g;
    }
    const into = arrow(-3.1, 1),
      out = arrow(2.3, 1);
    const labels = [
      k.label(
        [-2.9, 1.7, 0],
        "外液 · 不透膜溶质",
        "Medium · impermeant solute",
        2,
      ),
      k.label(
        [0, -1.85, 1.2],
        "成熟哺乳动物红细胞",
        "Mature mammalian red cell",
        2,
      ),
      k.label([0, 2.0, 0], "低渗 · 净吸水", "Hypotonic · net water gain", 2),
      k.label([-2.75, 0.5, 2.35], "入水", "Water in"),
      k.label([2.85, 0.5, 2.35], "出水", "Water out"),
      k.label(
        [1.62, 1.14, 1.45],
        "膜内面 · 皮层网示意",
        "Inner leaflet · schematic cortex",
        1,
      ),
    ];
    const vA = new THREE.Vector3(),
      vB = new THREE.Vector3(),
      vC = new THREE.Vector3(),
      cross = new THREE.Vector3();
    function volume() {
      let sum = 0;
      const pos = geometry.attributes.position,
        ix = geometry.index;
      for (let i = 0; i < ix.count; i += 3) {
        vA.fromBufferAttribute(pos, ix.getX(i));
        vB.fromBufferAttribute(pos, ix.getX(i + 1));
        vC.fromBufferAttribute(pos, ix.getX(i + 2));
        sum += vA.dot(cross.crossVectors(vB, vC));
      }
      return Math.abs(sum / 6);
    }
    function surfaceArea() {
      let sum = 0;
      const pos = geometry.attributes.position;
      for (let i = 0; i < ix.count; i += 3) {
        vA.fromBufferAttribute(pos, ix.getX(i));
        vB.fromBufferAttribute(pos, ix.getX(i + 1));
        vC.fromBufferAttribute(pos, ix.getX(i + 2));
        sum += cross.crossVectors(vB.sub(vA), vC.sub(vA)).length() / 2;
      }
      return sum;
    }
    let initialVolume = 0;
    let initialArea = 0;
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        mode = ["hypotonic", "isotonic", "hypertonic"].includes(
          parameters.tonicity,
        )
          ? parameters.tonicity
          : "hypotonic";
      const shape = ease(p, 0.15, 0.9),
        hypo = mode === "hypotonic" ? shape : 0,
        hyper = mode === "hypertonic" ? shape : 0;
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < base.length; i += 3) {
        const x = base[i],
          y = base[i + 1],
          z = base[i + 2],
          r2 = x * x + z * z,
          a = Math.atan2(z, x);
        const crenation = 1 + hyper * 0.22 * Math.cos(a * 11) * r2;
        const flatten = 1 - hyper * 0.25;
        arr[i] = mix(x * 2.1, x * 1.72, hypo) * crenation;
        arr[i + 1] =
          mix(y * (0.27 + 1.35 * r2 - 0.55 * r2 * r2), y * 1.72, hypo) *
          flatten *
          (1 + hyper * 0.16 * Math.cos(a * 11) * r2);
        arr[i + 2] = mix(z * 2.1, z * 1.72, hypo) * crenation;
      }
      // Osmotic shape changes redistribute an approximately inextensible
      // membrane. Normalize the actual triangulated area, not only a radius.
      // Corrugation and flattening lower enclosed volume at conserved area.
      const area = surfaceArea();
      if (!initialArea) initialArea = area;
      const areaScale = Math.sqrt(initialArea / area);
      for (let i = 0; i < arr.length; i++) arr[i] *= areaScale;
      const innerArray = innerGeometry.attributes.position.array;
      for (let i = 0; i < arr.length; i++) innerArray[i] = arr[i] * 0.935;
      innerGeometry.attributes.position.needsUpdate = true;
      innerGeometry.computeVertexNormals();
      innerGeometry.computeBoundingBox();
      innerGeometry.computeBoundingSphere();
      const point = (index, out, r = 0.9) =>
        out.set(
          arr[index * 3] * r,
          arr[index * 3 + 1] * r,
          arr[index * 3 + 2] * r,
        );
      const edge = (mesh, index, a, b, radius) => {
        cd.subVectors(b, a);
        const length = cd.length();
        corticalTemp.position.copy(a).add(b).multiplyScalar(0.5);
        corticalTemp.quaternion.setFromUnitVectors(
          up,
          cd.divideScalar(length || 1),
        );
        corticalTemp.scale.set(radius, length, radius);
        corticalTemp.updateMatrix();
        mesh.setMatrixAt(index, corticalTemp.matrix);
      };
      cortexEdges.forEach(([i, j], n) => {
        point(i, ca);
        point(j, cb);
        edge(cortex, n, ca, cb, 0.012);
      });
      cortexNodes.forEach((i, n) => {
        point(i, ca);
        corticalTemp.position.copy(ca);
        corticalTemp.quaternion.identity();
        corticalTemp.scale.setScalar(0.027);
        corticalTemp.updateMatrix();
        junctions.setMatrixAt(n, corticalTemp.matrix);
        point(i, cb, 0.935);
        edge(anchors, n, ca, cb, 0.012);
      });
      for (const mesh of [cortex, junctions, anchors]) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const v = volume();
      if (!initialVolume) initialVolume = v;
      const soluteCount =
        mode === "hypotonic" ? 8 : mode === "isotonic" ? 17 : 30;
      solutes.forEach((m, i) => {
        m.visible = i < soluteCount;
      });
      water.forEach(({ mesh, angle }, i) => {
        const inward =
          mode === "isotonic"
            ? i % 2 === 0
            : mode === "hypotonic"
              ? i % 5 !== 0
              : i % 5 === 0;
        const t = (p * 2.2 + seeded(i, 23)) % 1;
        const radius = inward ? mix(3.3, 1.1, t) : mix(1.1, 3.3, t);
        mesh.position.set(
          Math.cos(angle) * radius,
          0.05 + Math.sin(angle * 3) * 0.15,
          Math.sin(angle) * radius,
        );
        // Opaque membrane naturally hides intracellular tracers; solutes never move across it.
      });
      into.scale.setScalar(
        mode === "hypertonic" ? 0.6 : mode === "hypotonic" ? 1.3 : 1,
      );
      out.scale.setScalar(
        mode === "hypotonic" ? 0.6 : mode === "hypertonic" ? 1.3 : 1,
      );
      labels[2].text =
        mode === "hypotonic"
          ? b("低渗 · 净吸水", "Hypotonic · net water gain")
          : mode === "hypertonic"
            ? b("高渗 · 净失水", "Hypertonic · net water loss")
            : b("等渗 · 双向平衡", "Isotonic · balanced exchange");
      k.group.userData = {
        process: "osmoticBalance",
        specimen: "mature-mammalian-erythrocyte",
        tonicity: mode,
        netWaterDirection:
          mode === "hypotonic" ? "in" : mode === "hypertonic" ? "out" : "none",
        geometricVolumeRatio: v / initialVolume,
        impermeantSoluteCrossings: 0,
        nucleusPresent: false,
        membraneLayers: 2,
        cortexEdges: cortexEdges.length,
        boundedCutaway: true,
        cortexDeformsWithMembrane: true,
        lysisSimulated: false,
      };
    }
    update(0);
    return {
      group: k.group,
      update,
      labels,
      camera: { position: [0, 5.6, 8.7], target: [0, 0, 0] },
    };
  },
};
