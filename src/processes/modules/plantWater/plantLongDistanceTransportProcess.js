import * as THREE from "three";
import { sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { pittedVesselWall, chloroplastFactory } from "./structuralDetail.js";
const process = {
  id: "plantLongDistanceTransport",
  title: b("木质部运输与蒸腾", "Xylem transport and transpiration"),
  intro: b(
    "被子植物根—茎—叶的组织级纵向剖示，多个细胞与器官组合，比例经过压缩。连续木质部水柱连接根部吸水与叶片湿细胞壁蒸发；蒸腾产生张力，木质部本身没有主动水泵。比较中途闭孔与持续开放；忽略根压、栓塞及不同植物的解剖差异。",
    "A compressed tissue-level longitudinal section across an angiosperm root, stem and leaf, combining multiple cells and organs. A continuous xylem water column links root uptake to evaporation from wet leaf walls. Transpiration generates tension; xylem contains no active water pump. Compare mid-sequence stomatal closure with continued opening. Root pressure, embolism and anatomical variation are omitted.",
  ),
  duration: 34,
  controls: [
    {
      id: "stomata",
      label: b("叶片气孔", "Leaf stomata"),
      default: "close",
      options: [
        { value: "close", label: b("中途收窄气孔", "Narrow stomata midway") },
        { value: "open", label: b("保持开放", "Keep stomata open") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("根—茎—叶的连续通路", "A continuous root–stem–leaf path"),
      description: b(
        "成熟导管由多个失去原生质体的细胞连接而成。木质化壁支撑开放管腔；蓝色透明体表示连续液态水。",
        "Mature vessel elements are connected cells that have lost their protoplasts. Lignified walls support open lumina; translucent blue represents continuous liquid water.",
      ),
    },
    {
      at: 0.15,
      title: b("湿叶肉细胞壁蒸发", "Evaporation from wet mesophyll walls"),
      description: b(
        "水从叶肉细胞的湿壁蒸发到胞间气隙，再以水蒸气经气孔扩散到空气。液水并非直接从根以蒸气形式上升。",
        "Water evaporates from wet mesophyll walls into intercellular air spaces, then diffuses as vapor through stomata. Water rising from the roots is liquid, not vapor.",
      ),
    },
    {
      at: 0.31,
      title: b("张力牵引水柱", "Tension pulls the water column"),
      description: b(
        "蒸发降低叶片水势；内聚力使木质部水柱传递张力，黏附与木质化壁有助于保持通路。",
        "Evaporation lowers leaf water potential. Cohesion transmits tension through the xylem water column; adhesion and lignified walls help maintain the path.",
      ),
    },
    {
      at: 0.47,
      title: b("根吸水补充", "Root uptake replenishes water"),
      description: b(
        "在土壤水分可用的条件下，水沿总体水势梯度从土壤穿过根组织进入木质部。根的径向屏障和并行路径在此压缩表示。",
        "With water available in soil, water enters xylem through root tissues along the overall water-potential gradient. Radial root barriers and parallel routes are condensed here.",
      ),
    },
    {
      at: 0.65,
      title: b("气孔改变蒸腾通量", "Stomata regulate transpiration"),
      description: b(
        "选择闭孔时，出口变窄使蒸气扩散和木质部体积流减慢；持续开放分支维持较强水流。",
        "In the closure scenario, the narrower pore reduces vapor diffusion and xylem bulk flow. Continued opening maintains stronger flow.",
      ),
    },
    {
      at: 0.88,
      title: b("连续水柱仍然存在", "The water column remains"),
      description: b(
        "减弱蒸腾不会把导管中的水抽空。示意保留连续水柱并降低示踪速度，不表示真实流速或压力测量。",
        "Reduced transpiration does not empty the vessel. The model retains the continuous water column while reducing tracer speed; it provides no measured flow rate or pressure.",
      ),
    },
  ],
  sources: [
    {
      title: "OpenStax Biology 2e — Transport of Water and Solutes in Plants",
      url: "https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const lignin = k.material("#ae9975"),
      waterMat = k.material("#7eaec5", {
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
      cellMat = k.material("#b9c6a1", {
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      wallMat = k.material("#93a77d");
    // Each element has a cut edge, side-wall pit apertures and an open end plate.
    const vesselGeometry = pittedVesselWall(),
      makeChloroplast = chloroplastFactory(k);
    const pitMembranes = new THREE.InstancedMesh(
        k.sphere,
        k.material("#d1c7a8"),
        90,
      ),
      pitTemp = new THREE.Object3D();
    group.add(pitMembranes);
    pitMembranes.name = "thin primary-wall pit membranes";
    let pitIndex = 0;
    for (let i = 0; i < 3; i++) {
      const center = -1.65 + i * 1.84,
        shell = k.mesh(
          vesselGeometry,
          k.material("#b9ac8b", { side: THREE.DoubleSide }),
          [-0.85, center, 0],
        );
      shell.name = "pitted lignified vessel wall, open lumen";
      const helix = [];
      for (let j = 0; j <= 180; j++) {
        const t = j / 180,
          angle = t * Math.PI * 8;
        helix.push([
          -0.85 + 0.51 * Math.sin(angle),
          center - 0.88 + t * 1.76,
          0.51 * Math.cos(angle),
        ]);
      }
      k.tube(helix, 0.035, lignin).name = "helical secondary wall thickening";
      for (const dy of [-0.91, 0.91]) {
        const end = k.ring(
          [-0.85, center + dy, 0],
          0.462,
          0.027,
          k.material("#948366"),
        );
        end.rotation.x = Math.PI / 2;
        end.name = "open simple perforation plate rim";
      }
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 6; col++) {
          const u = 0.085 + col * 0.165 + (row % 2) * 0.023,
            a = 0.35 + Math.PI * 1.7 * u;
          pitTemp.position.set(
            -0.85 + 0.443 * Math.sin(a),
            center - 0.7 + row * 0.35,
            0.443 * Math.cos(a),
          );
          pitTemp.rotation.set(0, a, 0);
          pitTemp.scale.set(0.052, 0.087, 0.008);
          pitTemp.updateMatrix();
          pitMembranes.setMatrixAt(pitIndex++, pitTemp.matrix);
        }
    }
    pitMembranes.instanceMatrix.needsUpdate = true;
    pitMembranes.computeBoundingSphere();
    k.segment([-0.85, -2.56, 0], [-0.85, 2.79, 0], 0.33, waterMat).name =
      "continuous liquid water column";
    k.tube(
      [
        [-0.85, 2.65, 0],
        [-0.35, 2.78, 0],
        [0.45, 2.8, 0],
        [1.25, 2.77, 0],
      ],
      0.19,
      waterMat,
    );
    // Root tissue: multiple living cortical cells and a narrow hair contacting soil water.
    for (let i = 0; i < 4; i++) {
      k.mesh(new THREE.BoxGeometry(0.67, 0.89, 0.56), cellMat, [
        -3.65 + i * 0.73,
        -2.66,
        0,
      ]);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(0.67, 0.89, 0.56)),
        new THREE.LineBasicMaterial({ color: "#a2af8b" }),
      );
      edges.position.set(-3.65 + i * 0.73, -2.66, 0);
      group.add(edges);
    }
    k.tube(
      [
        [-3.94, -2.65, 0],
        [-4.3, -2.67, 0],
        [-4.5, -3.12, 0],
      ],
      0.09,
      wallMat,
    );
    const rootPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, -3.1, 0.15),
      new THREE.Vector3(-3.7, -2.67, 0.15),
      new THREE.Vector3(-2.2, -2.66, 0.15),
      new THREE.Vector3(-0.85, -2.5, 0.15),
    ]);
    k.mesh(new THREE.TubeGeometry(rootPath, 64, 0.037, 8, false), waterMat);
    for (let i = 0; i < 9; i++)
      k.ball(
        [-4.5 + (i % 3) * 0.38, -3.6 + Math.floor(i / 3) * 0.24, -0.25],
        [0.14, 0.08, 0.12],
        k.material("#b4a78f"),
      );
    // Leaf section: chloroplast-bearing mesophyll cells border an actual air space.
    for (let i = 0; i < 4; i++) {
      const x = 0.5 + (i % 2) * 1.2,
        y = 1.4 + Math.floor(i / 2) * 2;
      k.ball([x, y, 0], [0.54, 0.5, 0.34], cellMat);
      for (let j = 0; j < 4; j++) {
        const t = (j * Math.PI) / 2;
        const plastid = makeChloroplast(group, 0.29);
        plastid.position.set(
          x + 0.34 * Math.cos(t),
          y + 0.29 * Math.sin(t),
          0.28,
        );
        plastid.rotation.x = Math.PI / 2;
      }
    }
    k.tube(
      [
        [0.2, 2.75, 0.05],
        [0.65, 2.9, 0.05],
        [1.15, 2.75, 0.05],
        [1.6, 2.92, 0.05],
      ],
      0.046,
      k.material("#72a6bc"),
    );
    const guardTop = k.ball([3.16, 2.88, 0], [0.32, 0.3, 0.26], wallMat),
      guardBottom = k.ball([3.16, 1.88, 0], [0.32, 0.3, 0.26], wallMat);
    k.segment([3.17, 3.48, 0], [3.17, 4.05, 0], 0.08, k.material("#c1c7a8"));
    k.segment([3.17, 0.74, 0], [3.17, 1.33, 0], 0.08, k.material("#c1c7a8"));
    const xylem = [];
    for (let i = 0; i < 14; i++)
      xylem.push(
        k.ball([0, 0, 0], [0.055, 0.14, 0.055], k.material("#427fa7")),
      );
    const uptake = [];
    for (let i = 0; i < 6; i++)
      uptake.push(k.ball([0, 0, 0], 0.05, k.material("#5b98bb")));
    const vapor = [];
    for (let i = 0; i < 15; i++)
      vapor.push(k.ball([0, 0, 0], 0.052, k.material("#a9c6d4")));
    const labels = [
      k.label(
        [-3.5, -3.34, 0.6],
        "根组织 · 吸水",
        "Root tissue · water uptake",
        2,
      ),
      k.label(
        [-1.6, -0.2, 0.7],
        "木质部：连续液水",
        "Xylem: continuous liquid water",
        3,
      ),
      k.label([0.45, 3.9, 0.6], "叶肉组织 · 湿壁", "Mesophyll · wet walls", 2),
      k.label([1.75, 2.12, 0.6], "胞间气隙", "Intercellular air space", 2),
      k.label([3.6, 1.25, 0.6], "气孔 → 空气", "Stoma → atmosphere", 3),
    ];
    const point = new THREE.Vector3();
    function update(value, parameters = {}) {
      const p = clamp(value),
        close = parameters.stomata !== "open",
        closure = close ? ease(p, 0.65, 0.85) : 0,
        activity = ease(p, 0.12, 0.32),
        flow = activity * (1 - 0.83 * closure),
        t = Math.max(0, Math.min(1, (p - 0.65) / 0.2)),
        integral =
          p <= 0.65
            ? 0
            : p >= 0.85
              ? p - 0.75
              : 0.2 * (t * t * t - 0.5 * t * t * t * t),
        distance = 4 * p - (close ? 3.32 * integral : 0);
      guardTop.position.y = 2.94 - 0.25 * closure;
      guardBottom.position.y = 1.8 + 0.25 * closure;
      xylem.forEach((m, i) => {
        m.visible = p > 0.28;
        m.position.set(
          -0.85 + Math.sin(i * 2.4) * 0.16,
          -2.5 + ((distance + i / 14) % 1) * 5.14,
          0.1,
        );
      });
      uptake.forEach((m, i) => {
        m.visible = p > 0.43;
        rootPath.getPoint((distance + i / 6) % 1, point);
        m.position.copy(point);
      });
      vapor.forEach((m, i) => {
        const t = (distance + i / 15) % 1;
        m.visible = p > 0.14 && (closure < 0.7 || i < 3);
        m.position.set(
          1.25 + t * 3.37,
          2.36 +
            Math.sin(i * 2) * 0.1 * (1 - 0.9 * closure) +
            (t > 0.65 ? (t - 0.65) * 0.7 : 0),
          0.15 + Math.cos(i) * 0.09,
        );
      });
      group.userData = {
        process: "plantLongDistanceTransport",
        scale: "multicellular-root-stem-leaf",
        condition: close ? "stomatal-narrowing" : "stomata-open",
        poreOpening: 1 - closure,
        relativeFlow: flow,
        continuousWaterColumn: true,
        vesselStructure:
          "helical thickening, membrane-covered lateral pits, open simple perforation plates",
        xylemContents: "liquid",
        airSpaceContents: "water-vapor",
        drivingForce: "transpiration-cohesion-tension",
        activeXylemPump: false,
        flowDirection: "root-to-leaf",
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0, 1.2, 14.5], target: [-0.1, 0.1, 0] },
      labels,
    };
  },
};
export default process;
