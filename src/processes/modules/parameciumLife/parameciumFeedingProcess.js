import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { addParamecium } from "./anatomy.js";
import { fusionVacuole } from "./scientificGeometry.js";

const process = {
  id: "parameciumFeeding",
  title: b(
    "草履虫：摄食与食物泡成熟",
    "Paramecium feeding and food-vacuole maturation",
  ),
  intro: b(
    "以多小核草履虫为例，打开腹侧皮层追踪一个食物泡。口沟摄入细菌，胞内酸化与消化后，在后部胞肛排出残渣；轨迹和时间均为示意。",
    "An opened ventral view of P. multimicronucleatum follows one food vacuole from bacterial uptake through acidification and digestion to posterior cytoproct egestion. The trajectory and timing are schematic.",
  ),
  duration: 36,
  stages: [
    {
      at: 0,
      title: b("纤毛汇集食物", "Cilia collect food"),
      description: b(
        "口沟纤毛将含细菌的水流引向胞口，再进入胞咽。摄入口与后部胞肛位置不同。",
        "Oral cilia guide bacteria toward the cytostome and cytopharynx. This intake site is separate from the posterior cytoproct.",
      ),
    },
    {
      at: 0.18,
      title: b("食物泡形成", "Food vacuole forms"),
      description: b(
        "胞咽末端的膜围住食物并缢断，生成具有独立膜腔的食物泡。",
        "Membrane at the cytopharyngeal end encloses the food and pinches off as a membrane-bounded food vacuole.",
      ),
    },
    {
      at: 0.34,
      title: b("酸化与浓缩", "Acidification and condensation"),
      description: b(
        "代表性的酸性小泡停靠在新食物泡表面，经可见融合颈递送内容物，先使泡腔酸化；这一步发生在后续溶酶体融合之前。",
        "A representative acidosome docks at the young vacuole and delivers contents through a visible fusion neck, acidifying its lumen before lysosomal fusion.",
      ),
    },
    {
      at: 0.51,
      title: b("溶酶体融合与消化", "Lysosomal fusion and digestion"),
      description: b(
        "代表性的溶酶体在食物泡表面融合并输送水解酶，食物在泡腔内分解；小分子营养随后转移到胞质。",
        "A representative lysosome fuses at the vacuole surface and delivers hydrolytic enzymes. Food is digested inside the lumen and small nutrients are transferred to the cytoplasm.",
      ),
    },
    {
      at: 0.73,
      title: b("残余食物泡靠近胞肛", "Spent vacuole reaches cytoproct"),
      description: b(
        "剩余不可消化物仍封闭在食物泡内，随胞内运输到后部腹侧的胞肛。",
        "Indigestible residues remain enclosed as the spent vacuole is transported to the posterior ventral cytoproct.",
      ),
    },
    {
      at: 0.88,
      title: b("排渣与膜回收", "Egestion and membrane retrieval"),
      description: b(
        "食物泡膜在胞肛与表面膜融合，残渣排到细胞外；泡膜在细胞内回收，不随残渣整泡排出。",
        "Vacuole and surface membranes fuse at the cytoproct. Residues exit while vacuole membrane is retrieved inside the cell rather than expelled as an intact vesicle.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Allen microscopy: acidosome fusion necks at the phagosome perimeter",
      url: "https://www6.pbrc.hawaii.edu/allen/ch06/12-pmdv780609-7.html",
    },
    {
      title: "University of Hawaii: P. multimicronucleatum digestive vacuoles",
      url: "https://www6.pbrc.hawaii.edu/allen/ch06/20-pmdv.html",
    },
    {
      title: "Fok et al. (1987): Phagosomal acidification and lysosomal fusion",
      url: "https://pubmed.ncbi.nlm.nih.gov/3622528/",
    },
    {
      title: "University of Hawaii: open cytoproct and membrane retrieval",
      url: "https://www6.pbrc.hawaii.edu/allen/ch07/02-pmcyp820525-17.html",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const { cilia } = addParamecium(k);
    const oral = k.material("#c79872"),
      dark = k.material("#665e55");
    const oralCore = k.tube(
      [
        [1.24, 1.28, 0.25],
        [0.88, 0.76, 0.32],
        [0.65, 0.18, 0.4],
        [0.4, -0.52, 0.4],
      ],
      0.15,
      dark,
    );
    k.tube(
      [
        [1.4, 1.25, 0.35],
        [1.0, 0.8, 0.42],
        [0.82, 0.18, 0.46],
        [0.51, -0.52, 0.47],
      ],
      0.052,
      oral,
    );
    k.tube(
      [
        [1.02, 1.27, 0.35],
        [0.69, 0.73, 0.42],
        [0.48, 0.15, 0.46],
        [0.3, -0.52, 0.47],
      ],
      0.052,
      oral,
    );
    oralCore.visible = false;
    const grooveGeometry = new THREE.BufferGeometry(),
      grooveVertices = [],
      grooveIndices = [];
    for (let row = 0; row <= 28; row++)
      for (let col = 0; col <= 12; col++) {
        const t = row / 28,
          v = col / 6 - 1,
          width = 0.25 * (1 - t) + 0.095 * t;
        grooveVertices.push(
          1.18 - 0.78 * t + v * width,
          1.28 - 1.83 * t,
          0.43 - 0.18 * (1 - v * v),
        );
        if (row < 28 && col < 12) {
          const a = row * 13 + col;
          grooveIndices.push(a, a + 1, a + 13, a + 1, a + 14, a + 13);
        }
      }
    grooveGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(grooveVertices, 3),
    );
    grooveGeometry.setIndex(grooveIndices);
    grooveGeometry.computeVertexNormals();
    k.mesh(grooveGeometry, k.material("#b49978", { side: THREE.DoubleSide }));
    // Oral membranelles run in three coordinated rows down the invaginated surface.
    const oralBasal = new THREE.InstancedMesh(
      new THREE.TorusGeometry(0.022, 0.007, 5, 10),
      k.material("#8b795e"),
      54,
    );
    group.add(oralBasal);
    const oralHair = new THREE.InstancedMesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(),
          new THREE.Vector3(0.05, -0.04, 0.06),
          new THREE.Vector3(0.08, -0.11, 0.09),
        ]),
        8,
        0.009,
        5,
        false,
      ),
      k.material("#d2ba94"),
      54,
    );
    group.add(oralHair);
    const oralTemp = new THREE.Object3D();
    for (let i = 0; i < 54; i++) {
      const row = i % 3,
        t = Math.floor(i / 3) / 17;
      oralTemp.position.set(
        1.17 - 0.77 * t + (row - 1) * 0.09,
        1.21 - 1.6 * t,
        0.33 + Math.abs(row - 1) * 0.055,
      );
      oralTemp.updateMatrix();
      oralBasal.setMatrixAt(i, oralTemp.matrix);
      oralHair.setMatrixAt(i, oralTemp.matrix);
    }
    for (const m of [oralBasal, oralHair]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      m.computeBoundingBox();
    }
    const oralCilia = [];
    for (let i = 0; i < 11; i++) {
      const y = 1.2 - i * 0.135,
        x = 0.86 + y * 0.28;
      const o = k.segment(
        [x, y, 0.5],
        [x + 0.22, y - 0.12, 0.57],
        0.014,
        k.material("#b6a079"),
      );
      oralCilia.push({ o, angle: o.rotation.z });
    }
    const mouth = k.ring([0.4, -0.48, 0.48], 0.19, 0.04, oral);
    mouth.scale.y = 0.6;
    const cytoproct = k.ring(
      [1.05, -1.72, 0.36],
      0.22,
      0.043,
      k.material("#967d74"),
    );
    cytoproct.scale.set(0.38, 1, 1);
    const fusionNeck = k.segment(
      [0.82, -1.65, 0.43],
      [1.06, -1.72, 0.4],
      0.15,
      oral,
    );
    const neck = k.ball([0.4, -0.57, 0.42], [0.15, 0.28, 0.15], oral);
    const vacGroup = new THREE.Group();
    group.add(vacGroup);
    const vacMat = k.material("#d6b06b", {
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const vacShell = k.ball([0, 0, 0], [0.38, 0.42, 0.3], vacMat, vacGroup);
    vacShell.visible = false;
    const membrane = new THREE.Group();
    membrane.scale.set(0.38, 0.42, 0.3);
    vacGroup.add(membrane);
    const vacLeaflets = fusionVacuole(k, membrane);
    vacGroup.name = "tracked-food-vacuole";
    membrane.name = "food-vacuole-fusion-assembly";
    const enzymes = new THREE.Group();
    vacGroup.add(enzymes);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        g = new THREE.Group();
      enzymes.add(g);
      g.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.25, 0.08);
      k.ball([-0.024, 0, 0], [0.033, 0.044, 0.027], k.material("#ad7c87"), g);
      k.ball([0.028, 0.006, 0], [0.028, 0.036, 0.03], k.material("#c59ba5"), g);
      k.ball([0, -0.022, 0.016], 0.013, k.material("#dfc28a"), g);
    }
    const foodMembranePumps = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.017, 0.022, 0.09, 8),
      k.material("#9d8969"),
      18,
    );
    membrane.add(foodMembranePumps);
    const pumpTemp = new THREE.Object3D();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      pumpTemp.position.set(Math.cos(a) * 0.97, Math.sin(a) * 0.97, -0.015);
      pumpTemp.rotation.z = a - Math.PI / 2;
      pumpTemp.updateMatrix();
      foodMembranePumps.setMatrixAt(i, pumpTemp.matrix);
    }
    foodMembranePumps.instanceMatrix.needsUpdate = true;
    foodMembranePumps.computeBoundingSphere();
    foodMembranePumps.computeBoundingBox();
    const vacRim = k.ring(
      [0, 0, 0.04],
      0.39,
      0.022,
      k.material("#b59054"),
      vacGroup,
    );
    const food = [];
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      const o = k.ball(
        [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.06],
        [0.056, 0.095, 0.05],
        k.material("#807e53"),
        group,
      );
      o.name = `tracked-food-${i}`;
      o.rotation.z = a;
      food.push(o);
    }
    const foodOffsets = food.map((o) => o.position.clone());
    const arrivals = food.map((_, i) => 0.205 + i * 0.008);
    const intakePaths = food.map((_, i) => {
      const scale = 0.22 + 0.78 * ease(arrivals[i], 0.14, 0.28),
        offset = foodOffsets[i];
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.2 + 0.25 * Math.sin(i), 1.6 + i * 0.11, 0.53),
        new THREE.Vector3(1.18, 1.28, 0.43),
        new THREE.Vector3(0.8, 0.42, 0.4),
        new THREE.Vector3(0.4, -0.48, 0.45),
        new THREE.Vector3(
          0.4 + offset.x * scale,
          -0.82 + offset.y * scale,
          0.45 + offset.z * scale,
        ),
      ]);
    });
    const nutrients = [],
      residue = [],
      recycle = [];
    for (let i = 0; i < 5; i++) {
      nutrients.push(k.ball([0, 0, 0], 0.042, k.material("#b8a565")));
      residue.push(
        k.ball([0, 0, 0], [0.05, 0.075, 0.04], k.material("#85735e")),
      );
      recycle.push(k.ball([0, 0, 0], [0.055, 0.03, 0.025], oral));
    }
    const route = new THREE.CatmullRomCurve3(
      [
        [0.4, -0.82, 0.45],
        [-0.32, -1.42, 0.4],
        [-0.84, -0.85, 0.38],
        [-0.88, 0.45, 0.39],
        [-0.13, 1.55, 0.38],
        [0.42, 0.57, 0.45],
        [0.81, -1.65, 0.45],
      ].map((p) => new THREE.Vector3(...p)),
    );
    const loc = new THREE.Vector3(),
      gold = new THREE.Color("#d6b06b"),
      acidColor = new THREE.Color("#c78e61"),
      lateColor = new THREE.Color("#b4a28d");
    const labels = [
      k.label(
        [1.38, 1.43, 0.4],
        "口沟 · 纤毛汇食",
        "Oral groove · ciliary feeding",
        3,
      ),
      k.label([0.52, -0.46, 0.5], "胞口 / 胞咽", "Cytostome / cytopharynx", 3),
      k.label([1.18, -1.75, 0.4], "胞肛 · 排渣", "Cytoproct · egestion", 3),
      k.label([-0.6, 0.9, 0.4], "大核", "Macronucleus", 0),
      k.label([0, -1, 0.8], "食物泡", "Food vacuole", 3),
      k.label([-1.0, -1.5, 0.6], "酸性小泡", "Acidosomes", 2),
      k.label([-1.1, 1.3, 0.6], "溶酶体", "Lysosomes", 2),
    ];
    function update(progress) {
      const p = clamp(progress),
        forming = ease(p, 0.14, 0.28),
        travel = ease(p, 0.27, 0.87),
        egest = ease(p, 0.88, 0.98);
      route.getPoint(travel, loc);
      vacGroup.position.copy(loc);
      vacGroup.scale.setScalar((0.22 + 0.78 * forming) * (1 - 0.94 * egest));
      vacGroup.visible = p < 0.99;
      neck.visible = p < 0.29;
      neck.scale.set(
        0.15 * (1 - ease(p, 0.24, 0.29)),
        0.28,
        0.15 * (1 - ease(p, 0.24, 0.29)),
      );
      vacMat.color
        .copy(gold)
        .lerp(acidColor, ease(p, 0.34, 0.48))
        .lerp(lateColor, ease(p, 0.58, 0.83));
      vacRim.material.color.copy(vacMat.color).multiplyScalar(0.8);
      vacLeaflets.outer.material.color.copy(vacMat.color);
      enzymes.visible = p >= 0.57 && p < 0.84;
      foodMembranePumps.visible = p >= 0.34 && p < 0.87;
      vacLeaflets.update(p);
      vacRim.visible = !(p >= 0.34 && p < 0.47) && !(p >= 0.51 && p < 0.62);
      food.forEach((o, i) => {
        if (p < arrivals[i])
          intakePaths[i].getPoint(ease(p, i * 0.008, arrivals[i]), o.position);
        else
          o.position
            .copy(foodOffsets[i])
            .multiplyScalar(vacGroup.scale.x)
            .add(loc);
        o.scale
          .set(0.056, 0.095, 0.05)
          .multiplyScalar(1 - 0.75 * ease(p, 0.56, 0.74));
        o.visible = p < 0.95;
      });
      nutrients.forEach((o, i) => {
        const a = i * 1.256,
          r = 0.24 + ease(p, 0.6, 0.74) * 0.65;
        o.position.set(loc.x + Math.cos(a) * r, loc.y + Math.sin(a) * r, 0.5);
        o.visible = p > 0.59 && p < 0.76;
      });
      residue.forEach((o, i) => {
        o.position.set(
          0.9 + egest * (0.95 + 0.14 * i),
          -1.72 + Math.sin(i) * 0.18,
          0.5,
        );
        o.visible = p >= 0.89;
      });
      recycle.forEach((o, i) => {
        const t = ease(p, 0.92, 1);
        o.position.set(
          1.03 - t * (0.27 + i * 0.1),
          -1.72 + t * (i - 2) * 0.15,
          0.3,
        );
        o.visible = p >= 0.93;
      });
      fusionNeck.visible = p >= 0.88 && p < 0.97;
      cytoproct.scale.x = 0.38 + egest * 0.62;
      cilia.forEach(({ object, angle }, i) => {
        object.rotation.z = angle + Math.sin(p * 40 + i * 0.4) * 0.14;
      });
      oralCilia.forEach(({ o, angle }, i) => {
        o.rotation.z = angle + Math.sin(p * 60 + i * 0.4) * 0.25;
      });
      labels[4].position[0] = loc.x;
      labels[4].position[1] = loc.y - 0.5;
      labels[4].active = p < 0.95;
      labels[5].position[0] = loc.x - 0.6;
      labels[5].position[1] = loc.y + 0.5;
      labels[5].active = p >= 0.28 && p < 0.47;
      labels[6].position[0] = loc.x - 0.6;
      labels[6].position[1] = loc.y + 0.5;
      labels[6].active = p >= 0.47 && p < 0.62;
      group.userData = {
        species: "Paramecium multimicronucleatum",
        intakeSite: "oral groove / cytopharynx",
        egestionSite: "posterior ventral cytoproct",
        vacuoleStage:
          p < 0.28
            ? "formation"
            : p < 0.5
              ? "acidification"
              : p < 0.73
                ? "digestion"
                : p < 0.88
                  ? "transport"
                  : "egestion",
        acidificationBeforeLysosomalFusion: true,
        membraneRetrieved: egest,
        progress: p,
      };
    }
    update(0);
    const materials = new Set(vacLeaflets.materials);
    group.traverse((o) => {
      if (o.material) materials.add(o.material);
    });
    return {
      group,
      update,
      labels,
      materials: [...materials],
      camera: { position: [0, 0.6, 11.5], target: [0.25, 0, 0] },
    };
  },
};
export default process;
