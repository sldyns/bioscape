import { hollowInlet, collectingBladder } from "./scientificGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { membraneDetail } from "./fineStructure.js";

export default {
  id: "contractileVacuole",
  title: b("伸缩泡：集水与排水", "Contractile vacuole: collect and discharge"),
  intro: b(
    "多小核草履虫的一个伸缩泡复合体放大图：放射状集水管汇入中央泡，经皮层固定孔排水。海绵体管网简化显示；低渗程度影响循环，动画节律不代表实测时间。",
    "A magnified contractile-vacuole complex of P. multimicronucleatum: radial collecting canals feed a central bladder that discharges through a dedicated cortical pore. The spongiome is simplified; osmotic conditions change the cycle, whose timing is illustrative.",
  ),
  duration: 30,
  controls: [
    {
      id: "osmotic",
      label: b("外界低渗程度", "External hypotonicity"),
      default: "freshwater",
      options: [
        { value: "freshwater", label: b("较强低渗", "More hypotonic") },
        { value: "mild", label: b("较弱低渗", "Less hypotonic") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("渗透进入与分隔", "Osmotic entry and segregation"),
      description: b(
        "低渗水环境使水进入细胞；伸缩泡管网把多余的胞质水分隔到膜内腔。这里放大单个复合体。",
        "A hypotonic medium drives water into the cell. The vacuolar network segregates excess cytosolic water into its lumen. One complex is magnified here.",
      ),
    },
    {
      at: 0.18,
      title: b("集水管与壶腹", "Collecting canals and ampullae"),
      description: b(
        "海绵体管网围绕集水管；各放射臂通过近端壶腹将液体送入中央泡。",
        "The spongiome surrounds collecting canals; each radial arm delivers fluid through a proximal ampulla into the central bladder.",
      ),
    },
    {
      at: 0.42,
      title: b("中央泡充盈", "Central bladder fills"),
      description: b(
        "中央泡增大。较弱低渗下，进入细胞的净水量减少，模型中的充盈和排水循环相应减慢。",
        "The central bladder expands. Under less hypotonic conditions, net water entry is reduced and filling and discharge cycles in the model slow down.",
      ),
    },
    {
      at: 0.63,
      title: b("排水前的隔离", "Isolation before discharge"),
      description: b(
        "中央泡变圆，放射臂与它暂时分离；中央泡膜在固定排水孔处与质膜接通。不同条件下，这一步出现时间不同。",
        "The bladder rounds and temporarily separates from radial arms. Its membrane connects to the plasma membrane at the dedicated pore. The timing differs between conditions.",
      ),
    },
    {
      at: 0.8,
      title: b("排水与重新连接", "Discharge and reconnection"),
      description: b(
        "液体经孔排出细胞，中央泡缩小，随后孔关闭、放射臂重新连接。较强低渗时更早开始下一轮。",
        "Fluid exits through the pore and the bladder shrinks; the pore closes and radial arms reconnect. A more hypotonic condition starts the next round sooner.",
      ),
    },
  ],
  sources: [
    {
      title:
        "University of Hawaii: P. multimicronucleatum filling and expulsion cycles",
      url: "https://www6.pbrc.hawaii.edu/allen/ch09/video/vid-1/",
    },
    {
      title: "Tani et al. (2002): Membrane dynamics of the contractile vacuole",
      url: "https://doi.org/10.1006/cbir.2002.0937",
    },
    {
      title: "Ishida et al. (1996): Osmotic stress and vacuole expulsion rate",
      url: "https://pubmed.ncbi.nlm.nih.gov/8834807/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const canalMat = k.material("#86afad", {
      transparent: true,
      opacity: 0.57,
      depthWrite: false,
    });
    const edgeMat = k.material("#789f9b"),
      waterMat = k.material("#719bb7"),
      lipMat = k.material("#b8ad90");
    // The cortex lies above the luminal network, not around it as a second bladder.
    const cortexShape = new THREE.Shape();
    cortexShape.moveTo(-3.2, -2.9);
    cortexShape.lineTo(3.2, -2.9);
    cortexShape.lineTo(3.2, 2.9);
    cortexShape.lineTo(-3.2, 2.9);
    cortexShape.closePath();
    const poreHole = new THREE.Path();
    poreHole.absarc(0, 0, 0.2, 0, Math.PI * 2, true);
    cortexShape.holes.push(poreHole);
    const cortex = k.mesh(
      new THREE.ShapeGeometry(cortexShape),
      k.material("#b6c3aa", {
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      [0, 0, 1.55],
    );
    cortex.renderOrder = 2;
    for (const x of [-3.2, 3.2])
      k.segment([x, -2.9, 1.55], [x, 2.9, 1.55], 0.035, k.material("#a5b39a"));
    for (const y of [-2.9, 2.9])
      k.segment([-3.2, y, 1.55], [3.2, y, 1.55], 0.035, k.material("#a5b39a"));
    const canalOuter = new THREE.CylinderGeometry(
      0.105,
      0.105,
      1.3,
      20,
      1,
      true,
      Math.PI / 2,
      Math.PI,
    );
    const canalInner = new THREE.CylinderGeometry(
      0.076,
      0.076,
      1.3,
      20,
      1,
      true,
      Math.PI / 2,
      Math.PI,
    );
    const pumps = new THREE.InstancedMesh(k.sphere, k.material("#a49978"), 216);
    group.add(pumps);
    const pumpTemp = new THREE.Object3D();
    let pumpIndex = 0;
    const arms = [],
      inlets = [],
      ampullae = [],
      drops = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.22,
        c = Math.cos(a),
        s = Math.sin(a);
      const points = [
        [c * 0.95, s * 0.95, 0],
        [c * 1.5, s * 1.5, 0],
        [c * 2.25, s * 2.25, -0.04],
      ];
      const wall = k.mesh(
        canalOuter,
        k.material("#7fa8a5", { side: THREE.DoubleSide }),
        [c * 1.6, s * 1.6, -0.02],
      );
      wall.rotation.z = a - Math.PI / 2;
      const lumen = k.mesh(
        canalInner,
        k.material("#c0d9ca", { side: THREE.DoubleSide }),
        [c * 1.6, s * 1.6, -0.02],
      );
      lumen.rotation.z = a - Math.PI / 2;
      for (const end of [0.95, 2.25]) {
        const rim = k.ring([c * end, s * end, -0.02], 0.09, 0.017, edgeMat);
        rim.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(c, s, 0),
        );
      }
      // Connected looping branches represent smooth/decorated spongiome, not isolated beads.
      for (let side of [-1, 1])
        for (let j = 0; j < 9; j++) {
          const r = 1.25 + j * 0.105,
            pts = [];
          for (let q = 0; q <= 20; q++) {
            const t = q / 20,
              rad = r + 0.17 * t,
              across = side * Math.sin(Math.PI * t) * (0.22 + 0.07 * (j % 3));
            pts.push([
              c * rad - s * across,
              s * rad + c * across,
              -0.06 + 0.045 * Math.sin(t * Math.PI * 2),
            ]);
          }
          k.tube(
            pts,
            0.022,
            k.material(j % 2 ? "#9fbbb1" : "#8fada6"),
            group,
            24,
          );
          for (let q = 0; q < 2; q++) {
            const t = 0.33 + q * 0.33,
              rad = r + 0.17 * t,
              across = side * Math.sin(Math.PI * t) * (0.22 + 0.07 * (j % 3));
            pumpTemp.position.set(
              c * rad - s * across,
              s * rad + c * across,
              -0.003,
            );
            pumpTemp.scale.set(0.032, 0.032, 0.025);
            pumpTemp.updateMatrix();
            pumps.setMatrixAt(pumpIndex++, pumpTemp.matrix);
          }
        }
      const ampulla = k.ball(
        [c * 1.04, s * 1.04, 0],
        [0.18, 0.29, 0.17],
        canalMat,
      );
      ampulla.rotation.z = a - Math.PI / 2;
      membraneDetail(k, ampulla);
      ampullae.push(ampulla);
      const inlet = hollowInlet(
        k,
        group,
        k.material("#86afad", { side: THREE.DoubleSide }),
        `collecting-inlet-${i}`,
      );
      inlets.push(inlet);
      arms.push({ c, s });
      // Tubular spongiome branches retain luminal continuity with each collecting canal.
      for (let j = 0; j < 6; j++) {
        const r = 1.34 + j * 0.15,
          side = j % 2 ? 1 : -1;
        k.tube(
          [
            [c * r, s * r, 0],
            [c * r - s * 0.19 * side, s * r + c * 0.19 * side, -0.04],
            [
              c * (r + 0.16) - s * 0.34 * side,
              s * (r + 0.16) + c * 0.34 * side,
              -0.07,
            ],
          ],
          0.031,
          k.material("#a4bbb0"),
        );
      }
      for (let j = 0; j < 3; j++) {
        const o = k.ball([0, 0, 0], 0.04, waterMat);
        o.name = `radial-water-${i}-${j}`;
        drops.push({ o, i, j });
      }
    }
    pumps.instanceMatrix.needsUpdate = true;
    pumps.computeBoundingSphere();
    pumps.computeBoundingBox();
    const bladderMat = k.material("#7bafba", {
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const bladderSurface = collectingBladder(k, group, bladderMat),
      bladder = bladderSurface.mesh;
    const bladderRim = k.ring([0, 0, 0.24], 0.8, 0.035, k.material("#659aa6"));
    const duct = k.segment([0, 0, 0.3], [0, 0, 1.55], 0.13, canalMat);
    const pore = k.ring([0, 0, 1.57], 0.2, 0.057, lipMat);
    const poreInner = k.ring(
      [0, 0, 1.515],
      0.145,
      0.025,
      k.material("#d1d5b7"),
    );
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      k.tube(
        [
          [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 1.5],
          [Math.cos(a) * 0.28, Math.sin(a) * 0.28, 1.3],
          [Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0.98],
        ],
        0.017,
        k.material("#b4b49b"),
      );
    }
    const poreCover = k.ball(
      [0, 0, 1.57],
      [0.18, 0.18, 0.035],
      k.material("#a9baa0"),
    );
    const jet = [];
    for (let i = 0; i < 9; i++) jet.push(k.ball([0, 0, 0], 0.068, waterMat));
    const entry = [];
    for (let i = 0; i < 8; i++)
      entry.push(
        k.ball(
          [0, 0, 0],
          0.045,
          k.material("#8daebf", { transparent: true, opacity: 0.72 }),
        ),
      );
    const labels = [
      k.label([0.5, 0.7, 0.55], "中央伸缩泡", "Central bladder", 3),
      k.label([2.2, 0.65, 0.1], "放射状集水管", "Radial collecting canal", 3),
      k.label([-1.0, -0.7, 0.18], "壶腹", "Ampulla", 2),
      k.label([-2.0, 1.1, 0.05], "海绵体管网", "Spongiome tubules", 2),
      k.label([0, 0, 1.95], "固定排水孔", "Dedicated discharge pore", 3),
      k.label([2.35, 2.1, 1.8], "细胞外水环境", "External aqueous medium", 2),
      k.label([-2.4, -2.0, 0], "胞质侧", "Cytoplasmic side", 2),
      k.label(
        [2.65, -2.45, 1.55],
        "皮层 / 质膜",
        "Cortex / plasma membrane",
        1,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        condition = parameters.osmotic === "mild" ? "mild" : "freshwater";
      const speed = condition === "mild" ? 1.05 : 1.42,
        total = p * speed;
      const cycle = total >= 1 ? total - 1 : total;
      const filling = ease(cycle, 0, 0.7),
        discharge = ease(cycle, 0.76, 0.9);
      const open = cycle >= 0.76 && cycle < 0.91,
        disconnected = cycle >= 0.7 && cycle < 0.94;
      const volume = 0.12 + 0.88 * filling * (1 - discharge),
        radius = 0.79 * Math.cbrt(volume);
      bladder.scale.set(
        radius,
        radius,
        radius * (0.73 + 0.27 * ease(cycle, 0.62, 0.73)),
      );
      bladderRim.scale.setScalar(radius / 0.8);
      bladderRim.visible = disconnected;
      bladderSurface.update(!disconnected);
      duct.visible = open;
      poreCover.visible = !open;
      pore.scale.setScalar(open ? 1 : 0.74);
      inlets.forEach((o, i) => {
        o.group.visible = !disconnected;
        o.update(radius, bladder.scale.z, (i * Math.PI) / 3);
      });
      ampullae.forEach((o) => {
        const f = disconnected ? 1.3 : 0.82 + 0.18 * Math.sin(cycle * 8);
        o.scale.set(0.18 * f, 0.29 * f, 0.17 * f);
      });
      drops.forEach(({ o, i, j }) => {
        const t = (cycle * 2.3 + j / 3) % 1,
          r = 2.2 - t * (2.2 - (disconnected ? 1.1 : 0.12)),
          a = arms[i];
        const neckZ =
          r >= 0.94 ? 0 : 0.22 * Math.min(1, (0.94 - r) / (0.94 - radius));
        o.position.set(a.c * r, a.s * r, neckZ);
        o.visible = cycle < 0.96 && (condition === "freshwater" || j < 2);
      });
      jet.forEach((o, i) => {
        const t = (discharge + i / 9) % 1;
        o.position.set(
          Math.sin(i * 2.4) * 0.055 * t,
          Math.cos(i * 2.4) * 0.055 * t,
          1.64 + t * 1.18,
        );
        o.visible = open;
      });
      entry.forEach((o, i) => {
        const t = (p * (condition === "mild" ? 1.7 : 3.2) + i / 8) % 1;
        const a = i * 2.4;
        o.position.set(Math.cos(a) * 2.67, Math.sin(a) * 2.4, 2.1 - t * 2.0);
        o.visible = condition === "freshwater" || i % 2 === 0;
      });
      labels[0].position[1] = radius + 0.25;
      group.userData = {
        species: "Paramecium multimicronucleatum",
        condition,
        waterDirection:
          "cytoplasm > spongiome > collecting canals > bladder > external pore",
        radialArmCount: 6,
        radialArmsConnected: !disconnected,
        poreOpen: open,
        bladderRelativeVolume: volume,
        cyclePhase: cycle,
        completedCycles: Math.floor(total),
        osmoregulation: true,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [4, 3.3, 10.5], target: [0, 0, 0.7] },
    };
  },
};
