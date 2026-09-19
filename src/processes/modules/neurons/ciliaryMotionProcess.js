import { THREE, sceneKit, clamp, phase, bilingual as b } from "../../kit.js";
import { arcLengthTracks } from "./axonemeKinematics.js";
export default {
  id: "ciliaryMotion",
  title: b("纤毛的滑动与弯曲", "Ciliary sliding and bending"),
  intro: b(
    "草履虫（Paramecium）运动纤毛：9 对外周微管与中央 2 根微管组成轴丝。ATP 驱动动力蛋白，相邻双联微管受约束滑动而产生弯曲。它不是细菌旋转鞭毛；图示不模拟拍动频率。",
    "A motile Paramecium cilium: nine outer microtubule doublets surround two central microtubules. ATP-driven dynein produces constrained interdoublet sliding and bending. This is not a bacterial rotary flagellum; beat frequency is not modeled.",
  ),
  duration: 32,
  controls: [
    {
      id: "atp",
      label: b("ATP 供应", "ATP supply"),
      default: "available",
      options: [
        { value: "available", label: b("可用", "Available") },
        {
          value: "absent",
          label: b("无 ATP（停动示意）", "Absent (arrest schematic)"),
        },
      ],
    },
  ],
  stages: [
    [
      0,
      "9 + 2 轴丝",
      "The 9 + 2 axoneme",
      "左侧为纤毛纵向剖示，右侧为放大横截面。外周是九组双联微管，中央为两根单微管，外面包裹纤毛膜。",
      "Left: longitudinal cutaway. Right: magnified cross-section. Nine outer doublets surround two central singlets, enclosed by the ciliary membrane.",
    ],
    [
      0.17,
      "动力蛋白消耗 ATP",
      "Dynein uses ATP",
      "轴丝动力蛋白锚定于一根双联微管，周期性接触相邻双联微管。ATP 周期使其产生相对滑动力。",
      "Axonemal dynein is anchored to one doublet and cyclically contacts its neighbor. Its ATP cycle generates relative sliding forces.",
    ],
    [
      0.34,
      "受约束的相对滑动",
      "Constrained relative sliding",
      "动力蛋白朝相邻微管的负端作用。基部锚定和双联微管间连接限制自由滑脱；微管不是被解聚而缩短。",
      "Dynein acts toward the minus end of the neighboring microtubule. Basal anchoring and interdoublet links restrict free sliding; microtubules are not shortened by depolymerization.",
    ],
    [
      0.51,
      "滑动转为弯曲",
      "Sliding becomes bending",
      "几何约束把局部滑动力转为整根轴丝的弯曲。金色连接表示双联微管间的机械耦联。",
      "Geometric constraints convert local sliding forces into bending of the axoneme. Gold links represent mechanical coupling between doublets.",
    ],
    [
      0.7,
      "活动侧交替",
      "Alternating active sides",
      "不同侧动力蛋白的协调活动改变曲率，形成有效冲程与恢复冲程。这里只保留定性的弯曲波。",
      "Coordinated activity on different sides changes curvature, producing effective and recovery strokes. Only a qualitative bending wave is shown.",
    ],
    [
      0.89,
      "拍动推动流体",
      "Beating moves fluid",
      "大量纤毛的协调拍动帮助草履虫游动和取食。此处展示单根纤毛；无 ATP 条件只示意动力停止，不代表完整细胞的所有后果。",
      "Coordinated beating of many cilia supports swimming and feeding. One cilium is shown; ATP removal illustrates motor arrest, not all consequences in a whole cell.",
    ],
  ].map(([at, z, e, dz, de]) => ({
    at,
    title: b(z, e),
    description: b(dz, de),
  })),
  sources: [
    {
      title:
        "Novel Insights into the Development and Function of Cilia Using the Advantages of the Paramecium Cell and Its Many Cilia",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4588038/",
    },
    {
      title: "NCBI Bookshelf — Molecular Motors",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26888/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const mt = k.material("#6f9f99"),
      central = k.material("#a7bba5"),
      dynein = k.material("#ad8596"),
      links = k.material("#c0a575"),
      membrane = k.material("#b4c8bd", {
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    const longitudinal = new THREE.Group();
    group.add(longitudinal);
    const N = 44,
      L = 4.4,
      baseY = -2.15,
      baseX = -1.8;
    const tubes = [];
    function rod(
      ox,
      oz,
      r,
      mat,
      partial = false,
      start = 0,
      length = Math.PI * 2,
    ) {
      const geometry = new THREE.CylinderGeometry(
        r,
        r,
        L,
        partial ? 28 : 16,
        N,
        true,
        partial ? Math.PI * 0.15 : start,
        partial ? Math.PI * 1.35 : length,
      );
      const initial = geometry.attributes.position.array.slice();
      const mesh = k.mesh(geometry, mat, [0, 0, 0], longitudinal);
      mesh.name =
        r > 0.5 ? "ciliary membrane cutaway" : `axonemal tube ${tubes.length}`;
      tubes.push({ mesh, initial, ox, oz, isMembrane: r > 0.5 });
      return mesh;
    }
    const innerWall = k.material("#bfd0bf", { side: THREE.DoubleSide });
    mt.side = THREE.DoubleSide;
    for (let j = 0; j < 9; j++) {
      const a = (j * Math.PI * 2) / 9,
        ax = 0.4 * Math.cos(a),
        az = 0.4 * Math.sin(a),
        bx = ax - 0.085 * Math.sin(a),
        bz = az + 0.085 * Math.cos(a);
      rod(ax, az, 0.052, mt);
      rod(ax, az, 0.037, innerWall);
      // B is an incomplete wall meeting the adjacent complete A wall.
      const start = Math.PI - a + 0.57,
        length = Math.PI * 2 - 1.14;
      rod(bx, bz, 0.047, mt, false, start, length);
      rod(bx, bz, 0.033, innerWall, false, start, length);
    }
    for (const x of [-0.105, 0.105]) {
      rod(x, 0, 0.05, central);
      rod(x, 0, 0.035, innerWall);
    }
    rod(0, 0, 0.57, membrane, true);
    const basal = k.mesh(
      new THREE.CylinderGeometry(0.61, 0.68, 0.23, 36),
      k.material("#91a49a"),
      [baseX, baseY - 0.16, 0],
    );
    const surface = k.mesh(
      new THREE.BoxGeometry(2.6, 0.12, 1.45),
      k.material("#c5d1c6"),
      [baseX, baseY - 0.34, -0.1],
    );
    const armRows = [];
    for (let row = 1; row < 7; row++)
      for (let j = 0; j < 9; j++) {
        const a = (j * Math.PI * 2) / 9;
        const arm = k.ball([0, 0, 0], [0.075, 0.065, 0.065], dynein.clone());
        const link = k.segment([0, 0, 0], [0, 1, 0], 0.019, links);
        const tail = k.segment([0, 0, 0], [0, 1, 0], 0.014, dynein);
        const stalk = k.segment([0, 0, 0], [0, 1, 0], 0.011, dynein);
        const collar = k.ring([0, 0, 0], 0.052, 0.017, k.material("#c4a7b6"));
        armRows.push({ arm, link, tail, stalk, collar, t: row / 7, a, j });
      }
    // Separate magnified transverse section retains explicit doublet topology.
    const cx = 2.15,
      cy = 0.1;
    k.ring([cx, cy, 0], 1.19, 0.045, k.material("#a1b5a8"));
    const crossArms = [];
    for (let j = 0; j < 9; j++) {
      const a = (j * Math.PI * 2) / 9,
        x = cx + 0.85 * Math.cos(a),
        y = cy + 0.85 * Math.sin(a);
      const bx = x - 0.18 * Math.sin(a),
        by = y + 0.18 * Math.cos(a),
        towardA = a - Math.PI / 2;
      const tubulinA = new THREE.InstancedMesh(k.sphere, mt, 13 * 4);
      const tubulinB = new THREE.InstancedMesh(
        k.sphere,
        k.material("#a8c2af"),
        10 * 4,
      );
      group.add(tubulinA, tubulinB);
      const item = new THREE.Object3D();
      for (let row = 0; row < 4; row++) {
        for (let q = 0; q < 13; q++) {
          const angle = (q * Math.PI * 2) / 13;
          item.position.set(
            x + 0.12 * Math.cos(angle),
            y + 0.12 * Math.sin(angle),
            -0.1 + row * 0.065,
          );
          item.scale.set(0.031, 0.031, 0.034);
          item.updateMatrix();
          tubulinA.setMatrixAt(row * 13 + q, item.matrix);
        }
        for (let q = 0; q < 10; q++) {
          const angle = towardA + 0.7 + (q * (Math.PI * 2 - 1.4)) / 9;
          item.position.set(
            bx + 0.108 * Math.cos(angle),
            by + 0.108 * Math.sin(angle),
            -0.1 + row * 0.065,
          );
          item.scale.set(0.033, 0.033, 0.034);
          item.updateMatrix();
          tubulinB.setMatrixAt(row * 10 + q, item.matrix);
        }
      }
      tubulinA.instanceMatrix.needsUpdate =
        tubulinB.instanceMatrix.needsUpdate = true;
      tubulinA.computeBoundingSphere();
      tubulinB.computeBoundingSphere();
      k.segment(
        [cx + 0.29 * Math.cos(a), cy + 0.29 * Math.sin(a), -0.015],
        [x - 0.15 * Math.cos(a), y - 0.15 * Math.sin(a), -0.015],
        0.019,
        links,
      );
      const an = ((j + 1) * Math.PI * 2) / 9;
      k.segment(
        [x, y, -0.05],
        [cx + 0.85 * Math.cos(an), cy + 0.85 * Math.sin(an), -0.05],
        0.015,
        links,
      );
      const arm = k.ball(
        [x - 0.18 * Math.sin(a), y + 0.18 * Math.cos(a), 0.13],
        [0.1, 0.055, 0.065],
        dynein.clone(),
      );
      arm.rotation.z = a;
      k.ring(
        [arm.position.x, arm.position.y, 0.19],
        0.054,
        0.018,
        k.material("#c9aebe"),
      );
      const nx = cx + 0.85 * Math.cos(an),
        ny = cy + 0.85 * Math.sin(an);
      k.segment(
        [x, y, 0.12],
        [arm.position.x, arm.position.y, 0.13],
        0.02,
        dynein,
      );
      k.segment(
        [arm.position.x, arm.position.y, 0.13],
        [nx - 0.15 * Math.sin(an), ny + 0.15 * Math.cos(an), 0.13],
        0.015,
        dynein,
      );
      crossArms.push({ arm, j });
    }
    k.ring([cx - 0.16, cy, 0.04], 0.105, 0.04, central);
    k.ring([cx + 0.16, cy, 0.04], 0.105, 0.04, central);
    const tubulinRows = [];
    for (let row = 0; row < 30; row++)
      for (let d = 0; d < 9; d++)
        for (let q = 0; q < 6; q++) {
          const a = (d * Math.PI * 2) / 9,
            theta = (q * Math.PI) / 3;
          tubulinRows.push({
            t: row / 29,
            x: 0.4 * Math.cos(a) + 0.052 * Math.cos(theta),
            z: 0.4 * Math.sin(a) + 0.052 * Math.sin(theta),
            row,
            ox: 0.4 * Math.cos(a),
          });
        }
    const tubulinBeads = new THREE.InstancedMesh(
      k.sphere,
      k.material("#8eafa4"),
      tubulinRows.length,
    );
    group.add(tubulinBeads);
    tubulinBeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const beadTransform = new THREE.Object3D();
    const labels = [
      k.label(
        [-1.8, 2.75, 0],
        "草履虫运动纤毛 · 纵向剖示",
        "Paramecium motile cilium · cutaway",
        2,
      ),
      k.label(
        [2.15, 1.66, 0],
        "9 对外周 + 2 根中央微管",
        "9 outer doublets + 2 central singlets",
        2,
      ),
      k.label(
        [2.15, -1.58, 0.1],
        "横截面放大图 · 非同一比例",
        "Enlarged cross-section · different scale",
        1,
      ),
      k.label(
        [-1.8, -2.95, 0],
        "基部固定 · 微管负端朝基部",
        "Anchored base · microtubule minus ends basal",
        2,
      ),
      k.label(
        [2.15, 2.31, 0.1],
        "紫色：动力蛋白　金色：连接与辐条",
        "Purple: dynein · gold: links and spokes",
        1,
      ),
      k.label(
        [-3.2, 0.5, 0.3],
        "滑动受约束 → 弯曲",
        "Constrained sliding → bending",
        1,
      ),
    ];
    const motion = arcLengthTracks(
      tubes.filter((t) => !t.isMembrane).map((t) => t.ox),
      { length: L, segments: N, baseX, baseY },
    );
    tubes.forEach((t) => {
      if (!t.isMembrane) t.track = motion.track(t.ox);
    });
    const sampleX = motion.X,
      sampleY = motion.Y;
    const materialPoint = new THREE.Vector3(),
      anchorPoint = new THREE.Vector3(),
      neighborPoint = new THREE.Vector3(),
      contactPoint = new THREE.Vector3();
    const v1 = new THREE.Vector3(),
      v2 = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    const activeColor = new THREE.Color("#c18ea4"),
      idleColor = new THREE.Color("#a99a9f");
    function setSegment(m, x1, y1, z1, x2, y2, z2) {
      v1.set(x1, y1, z1);
      v2.set(x2, y2, z2);
      m.position.copy(v1).add(v2).multiplyScalar(0.5);
      v2.sub(v1);
      m.scale.set(0.019, Math.max(v2.length(), 0.00001), 0.019);
      m.quaternion.setFromUnitVectors(up, v2.normalize());
    }
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        enabled = parameters.atp !== "absent";
      const gain = enabled ? phase(p, 0.17, 0.36) : 0,
        time = phase(p, 0.17, 1) * Math.PI * 4;
      motion.update(gain, time);
      let membraneTip = N;
      for (const t of motion.tracks)
        membraneTip = Math.max(membraneTip, t.endParameter);
      for (const r of tubes) {
        const pos = r.mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const fraction = clamp((r.initial[i * 3 + 1] + L / 2) / L);
          if (r.isMembrane)
            motion.geometric(0, fraction * membraneTip, materialPoint);
          else motion.point(r.track, fraction, materialPoint);
          const a = materialPoint.z,
            radialX = r.initial[i * 3];
          pos.setXYZ(
            i,
            materialPoint.x + radialX * Math.cos(a),
            materialPoint.y - radialX * Math.sin(a),
            r.initial[i * 3 + 2] + r.oz,
          );
        }
        pos.needsUpdate = true;
        r.mesh.geometry.computeVertexNormals();
        r.mesh.geometry.computeBoundingSphere();
        r.mesh.geometry.computeBoundingBox();
      }
      tubulinRows.forEach((v, i) => {
        motion.point(motion.track(v.ox), v.t, materialPoint);
        const a = materialPoint.z,
          radialX = v.x - v.ox;
        beadTransform.position.set(
          materialPoint.x + radialX * Math.cos(a),
          materialPoint.y - radialX * Math.sin(a),
          v.z,
        );
        beadTransform.rotation.set(0, 0, -a);
        beadTransform.scale.set(0.02, 0.058, 0.02);
        beadTransform.updateMatrix();
        tubulinBeads.setMatrixAt(i, beadTransform.matrix);
      });
      tubulinBeads.instanceMatrix.needsUpdate = true;
      tubulinBeads.computeBoundingSphere();
      tubulinBeads.computeBoundingBox();
      const side = Math.sin(time) >= 0 ? 1 : -1;
      armRows.forEach((r) => {
        const active = enabled && p >= 0.17 && Math.cos(r.a) * side > 0,
          rx = 0.4 * Math.cos(r.a),
          rz = 0.4 * Math.sin(r.a),
          an = r.a + (Math.PI * 2) / 9,
          rx2 = 0.4 * Math.cos(an),
          rz2 = 0.4 * Math.sin(an);
        const u = motion.point(motion.track(rx), r.t, anchorPoint);
        motion.geometric(rx2, u, neighborPoint);
        const bx = rx2 - 0.085 * Math.sin(an),
          bz = rz2 + 0.085 * Math.cos(an),
          neighborTrack = motion.track(bx),
          cycle = ((time / (Math.PI * 2)) * 3 + r.j * 0.13) % 1,
          engaged = !active || cycle < 0.65;
        const contactDistance =
          motion.materialAt(neighborTrack, u) -
          (active ? 0.055 * Math.min(1, cycle / 0.65) : 0);
        motion.point(neighborTrack, contactDistance / L, contactPoint);
        r.arm.position.set(
          anchorPoint.x * 0.65 + neighborPoint.x * 0.35,
          anchorPoint.y * 0.65 + neighborPoint.y * 0.35,
          rz * 0.65 + rz2 * 0.35,
        );
        r.arm.material.color.copy(active ? activeColor : idleColor);
        setSegment(
          r.link,
          anchorPoint.x,
          anchorPoint.y,
          rz,
          neighborPoint.x,
          neighborPoint.y,
          rz2,
        );
        r.collar.position.copy(r.arm.position);
        r.collar.position.z += 0.03;
        setSegment(
          r.tail,
          anchorPoint.x,
          anchorPoint.y,
          rz,
          r.arm.position.x,
          r.arm.position.y,
          r.arm.position.z,
        );
        r.tail.scale.x = r.tail.scale.z = 0.014;
        // Contact is on the neighboring B-tubule surface; material rows slide
        // past one another. A minus-end stroke is followed by detached reset.
        const surfaceZ = bz - 0.035 * Math.cos(an),
          surfaceX =
            contactPoint.x + 0.035 * Math.sin(an) * Math.cos(contactPoint.z),
          surfaceY =
            contactPoint.y - 0.035 * Math.sin(an) * Math.sin(contactPoint.z);
        setSegment(
          r.stalk,
          r.arm.position.x,
          r.arm.position.y,
          r.arm.position.z,
          surfaceX,
          surfaceY,
          surfaceZ,
        );
        r.stalk.scale.x = r.stalk.scale.z = 0.011;
        r.stalk.visible = engaged;
      });
      crossArms.forEach((r) =>
        r.arm.material.color.copy(
          enabled && p >= 0.17 && Math.cos((r.j * Math.PI * 2) / 9) * side > 0
            ? activeColor
            : idleColor,
        ),
      );
      group.userData = {
        process: "ciliaryMotion",
        specimen: "Paramecium motile cilium",
        axoneme: "9 outer doublets + 2 central singlets",
        outerDoublets: 9,
        centralSinglets: 2,
        ATP: enabled ? "available" : "absent",
        motor: "axonemal dynein",
        motorDirection: "toward adjacent microtubule minus end",
        basalAnchorFixed: true,
        centerlineLength: L,
        motion: gain > 0 ? "constrained sliding produces bending" : "arrested",
        bacterialRotation: false,
        tipX: sampleX[N],
        tipY: sampleY[N],
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0.15, 0.7, 10.8], target: [0.15, -0.05, 0] },
      labels,
    };
  },
};
