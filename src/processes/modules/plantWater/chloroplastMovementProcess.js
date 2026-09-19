import * as THREE from "three";
import { sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { chloroplastFactory } from "./structuralDetail.js";
const process = {
  id: "chloroplastMovement",
  title: b("叶绿体光定位运动", "Chloroplast photorelocation"),
  intro: b(
    "拟南芥叶肉细胞的三维剖示。光沿箭头向下入射；弱蓝光下叶绿体积聚在垂直于入射光的平周壁，强蓝光下转移至平行于光的垂周壁。叶绿体沿细胞皮层迁移，不穿过中央液泡；比较野生型与 phot2 缺失。",
    "Three-dimensional cutaway of an Arabidopsis mesophyll cell. Light enters downward: weak blue light favors chloroplast accumulation on periclinal walls perpendicular to the beam; strong blue light favors anticlinal walls parallel to it. Chloroplasts move along the cell cortex, not through the vacuole. Compare wild type with phot2 loss.",
  ),
  duration: 32,
  controls: [
    {
      id: "genotype",
      label: b("蓝光响应", "Blue-light response"),
      default: "wild",
      options: [
        { value: "wild", label: b("野生型", "Wild type") },
        { value: "phot2", label: b("phot2 缺失", "phot2 loss") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("叶肉细胞的皮层", "Mesophyll cortex"),
      description: b(
        "大液泡占据中央，叶绿体分布于外周薄层细胞质。光束方向用于区分平周壁与垂周壁。",
        "A central vacuole leaves a thin peripheral cytoplasm containing chloroplasts. The beam defines periclinal and anticlinal wall orientations.",
      ),
    },
    {
      at: 0.13,
      title: b("弱蓝光积聚", "Weak-light accumulation"),
      description: b(
        "弱蓝光促进叶绿体在垂直于光的平周壁积聚，有利于捕光。phot1 与 phot2 可参与积聚响应。",
        "Weak blue light favors accumulation on periclinal walls perpendicular to the beam, increasing light interception. Both phot1 and phot2 can contribute.",
      ),
    },
    {
      at: 0.36,
      title: b("平周壁上的叶绿体", "Periclinal distribution"),
      description: b(
        "扁盘状叶绿体沿壁展开；本模型示意下侧平周壁，并未显示所有叶绿体或全部壁面。",
        "Flattened chloroplasts spread along the wall. This model shows a lower periclinal surface, not every chloroplast or wall surface.",
      ),
    },
    {
      at: 0.51,
      title: b("强蓝光与 phot2", "Strong blue light and phot2"),
      description: b(
        "强蓝光通过 phot2 主导的途径触发避让；缺失 phot2 时强光避让受损。",
        "Strong blue light triggers avoidance through a pathway dominated by phot2. Loss of phot2 impairs the strong-light avoidance response.",
      ),
    },
    {
      at: 0.69,
      title: b("沿皮层重新定位", "Cortical relocation"),
      description: b(
        "野生型叶绿体沿壁缘转向垂周壁；与叶绿体相关的短肌动蛋白丝参与运动，本图仅示意皮层路线。",
        "Wild-type chloroplasts move around the wall edge toward anticlinal surfaces. Short chloroplast-associated actin filaments participate; only the cortical route is schematized here.",
      ),
    },
    {
      at: 0.9,
      title: b("避让减少截光", "Avoidance reduces interception"),
      description: b(
        "平行于光的壁面排列减少强光下的截光，有助于避免光损伤。phot2 缺失分支保持积聚型排列；光强与时间均非实验标定值。",
        "Alignment on walls parallel to the beam reduces interception under strong light and helps limit photodamage. The phot2-loss branch retains an accumulation-type distribution. Light intensity and timing are not experimentally calibrated.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Kadota et al. — Short actin-based mechanism for light-directed chloroplast movement",
      url: "https://pubmed.ncbi.nlm.nih.gov/19620714/",
    },
    {
      title:
        "Jarillo et al. — Phototropin-related NPL1 controls chloroplast relocation induced by blue light",
      url: "https://www.nature.com/articles/35073622",
    },
    {
      title:
        "Kasahara et al. — Chloroplast avoidance movement reduces photodamage in plants",
      url: "https://www.nature.com/articles/nature01213",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const wall = k.material("#aabb8d"),
      mem = k.material("#a2b1a0", {
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    for (const x of [-2.5, 2.5])
      for (const z of [-1.5, 1.5])
        k.segment([x, -2.65, z], [x, 2.65, z], 0.065, wall);
    for (const y of [-2.65, 2.65])
      for (const z of [-1.5, 1.5])
        k.segment([-2.5, y, z], [2.5, y, z], 0.065, wall);
    for (const x of [-2.5, 2.5])
      for (const y of [-2.65, 2.65])
        k.segment([x, y, -1.5], [x, y, 1.5], 0.065, wall);
    const plasmaMembrane = k.mesh(new THREE.BoxGeometry(5, 5.3, 3), mem);
    plasmaMembrane.name = "cell plasma membrane boundary";
    const vac = k.ball(
      [0, 0, 0],
      [2.02, 2.14, 1.17],
      k.material("#bad8d4", {
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
      }),
    );
    vac.name = "central vacuole";
    const bottom = k.mesh(
      new THREE.PlaneGeometry(4.85, 2.85),
      k.material("#c6d2ba", {
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
      [0, -2.6, 0],
    );
    bottom.rotation.x = -Math.PI / 2;
    const chloroplasts = [],
      makeChloroplast = chloroplastFactory(k);
    for (let i = 0; i < 16; i++) chloroplasts.push(makeChloroplast(group));
    const rays = [];
    for (let i = 0; i < 5; i++) {
      const ray = new THREE.Group();
      group.add(ray);
      k.segment([0, 0, 0], [0, -0.85, 0], 0.021, k.material("#98bfd5"), ray);
      const head = k.mesh(
        new THREE.ConeGeometry(0.08, 0.2, 12),
        k.material("#98bfd5"),
        [0, -0.95, 0],
        ray,
      );
      head.rotation.z = Math.PI;
      rays.push(ray);
    }
    const labels = [
      k.label([-2.7, 2.85, 0], "光向下入射", "Light enters downward", 3),
      k.label(
        [-0.7, -2.9, 1.65],
        "平周壁：垂直于光",
        "Periclinal: perpendicular to light",
        3,
      ),
      k.label(
        [2.8, 0.8, 0.4],
        "垂周壁：平行于光",
        "Anticlinal: parallel to light",
        3,
      ),
      k.label([-0.6, 0.5, 1.4], "中央液泡", "Central vacuole", 1),
      k.label([-2.55, -1.8, 1.6], "皮层内的叶绿体", "Cortical chloroplasts", 2),
    ];
    // A rounded cortical path accounts for the complete finite-size plastid,
    // not just its center. Its tangent turns the disk before either wall.
    const sideX = 2.26,
      floorY = -2.4,
      bendRadius = 0.46;
    const cornerX = sideX - bendRadius,
      cornerY = floorY + bendRadius;
    const arcLength = (Math.PI * bendRadius) / 2;
    const routes = chloroplasts.map((c, i) => {
      const col = i % 4,
        row = Math.floor(i / 4),
        targetX = -1.74 + col * 1.16;
      const side = col < 2 ? -1 : 1;
      // Plastids heading farther inward start nearer the corner, preserving
      // their order instead of translating two organelles to one corner point.
      const sideY = Math.abs(targetX) > 1 ? 1.05 : -0.95;
      const descentLength = sideY - cornerY;
      const floorLength = cornerX - Math.abs(targetX);
      return {
        side,
        sideY,
        z: -1.04 + row * 0.69,
        descentLength,
        totalLength: descentLength + arcLength + floorLength,
      };
    });
    function update(value, parameters = {}) {
      const p = clamp(value),
        mutant = parameters.genotype === "phot2",
        acc = ease(p, 0.1, 0.35),
        avoid = mutant ? 0 : ease(p, 0.54, 0.92),
        strong = p >= 0.5;
      const travel = acc * (1 - avoid);
      chloroplasts.forEach((c, i) => {
        const r = routes[i],
          distance = r.totalLength * travel;
        let x, y, angle;
        if (distance <= r.descentLength) {
          x = sideX;
          y = r.sideY - distance;
          angle = Math.PI / 2;
        } else if (distance <= r.descentLength + arcLength) {
          const turn = (distance - r.descentLength) / bendRadius;
          x = cornerX + bendRadius * Math.cos(turn);
          y = cornerY - bendRadius * Math.sin(turn);
          angle = Math.PI / 2 - turn;
        } else {
          x = cornerX - (distance - r.descentLength - arcLength);
          y = floorY;
          angle = 0;
        }
        c.position.set(r.side * x, y, r.z);
        c.rotation.set(0, 0, -r.side * angle);
      });
      rays.forEach((r, i) => {
        r.visible = strong || i % 2 === 0;
        r.position.set(
          -1.8 + i * 0.9,
          3.75 - ((p * 2 + i * 0.13) % 1) * 0.18,
          -0.4,
        );
      });
      group.userData = {
        process: "chloroplastMovement",
        specimen: "Arabidopsis mesophyll",
        genotype: mutant ? "phot2-loss" : "wild-type",
        illumination: strong ? "strong-blue" : "weak-blue",
        lightDirection: [0, -1, 0],
        avoidanceFraction: avoid,
        chloroplastCount: 16,
        envelopeMembranes: 2,
        granaPerChloroplast: 3,
        thylakoidsPerGranum: 5,
        route: "peripheral-cortex",
        crossesVacuole: false,
        orientation:
          avoid > 0.8
            ? "anticlinal"
            : acc < 0.1
              ? "anticlinal-initial"
              : avoid > 0 || acc < 1
                ? "cortical-transit"
                : "periclinal",
        accumulationFraction: acc,
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [7.3, 5.3, 10], target: [0, 0.3, 0] },
      labels,
    };
  },
};
export default process;
