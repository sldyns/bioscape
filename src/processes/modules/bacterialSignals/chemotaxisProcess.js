import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

import { helix, beadInstances } from "./structuralDetails.js";

export default {
  id: "chemotaxis",
  title: b("细菌趋化：延长有利方向的游程", "Chemotaxis: biasing runs"),
  intro: b(
    "大肠杆菌用膜受体比较随时间变化的引诱物信号，改变翻滚概率。周生鞭毛成束推动游动；这里的固定轨迹是示意实例，不是导航指令或实验轨迹。",
    "E. coli compares attractant signals over time and changes tumble probability. Peritrichous flagella bundle to propel runs. Fixed paths here are illustrative examples, not navigation instructions or measured tracks.",
  ),
  duration: 30,
  controls: [
    {
      id: "environment",
      label: b("引诱物环境", "Attractant environment"),
      default: "gradient",
      options: [
        {
          value: "gradient",
          label: b("沿游程增加", "Increasing during a run"),
        },
        { value: "uniform", label: b("均匀环境", "Uniform environment") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("游动与翻滚", "Runs and tumbles"),
      description: b(
        "周生鞭毛的基部散布在细胞表面；游动时丝状鞭毛在后方成束。",
        "Peritrichous flagella originate at distributed surface motors and form a trailing bundle during a run.",
      ),
    },
    {
      at: 0.18,
      title: b("膜受体感知变化", "Receptors detect change"),
      description: b(
        "极区的跨膜受体通过 CheW 与胞质侧 CheA 耦联。引诱物增加抑制 CheA 活性。",
        "Polar transmembrane receptors couple through CheW to cytoplasmic CheA. Increasing attractant inhibits CheA activity.",
      ),
    },
    {
      at: 0.38,
      title: b("降低翻滚偏向", "Reducing tumble bias"),
      description: b(
        "CheA 向 CheY 转移磷酸；CheZ 使 CheY-P 去磷酸化。引诱物增加时，马达附近的 CheY-P 减少。",
        "CheA transfers phosphate to CheY; CheZ dephosphorylates CheY-P. Rising attractant reduces CheY-P near motors.",
      ),
    },
    {
      at: 0.56,
      title: b("延长游程", "Extending a run"),
      description: b(
        "较低 CheY-P 降低顺时针切换概率，使逆时针旋转的鞭毛束维持较久；方向并未被直接指定。",
        "Lower CheY-P reduces clockwise switching probability, preserving a counterclockwise bundle for longer without specifying a direction.",
      ),
    },
    {
      at: 0.75,
      title: b("翻滚重新取向", "Tumbling reorients"),
      description: b(
        "从细胞后方向前看，一个马达转为顺时针；所选鞭毛由左手正常形变为右手半卷曲形并离束，再恢复。此处显示常见的多态转变，非每次反转的必然结果。",
        "Viewed from behind toward the cell, one motor reverses clockwise. Its left-handed normal filament changes to a right-handed semicoiled form and leaves the bundle, then recovers. This depicts a common polymorphic transition, not a necessary result of every reversal.",
      ),
    },
    {
      at: 0.9,
      title: b("继续取样", "Sampling continues"),
      description: b(
        "重新成束后继续游动。CheR/CheB 介导的受体适应使持续刺激下的偏向回归基线；此处未展开该反馈。",
        "The bundle reforms for another run. CheR/CheB receptor adaptation restores baseline bias under sustained stimulation; that feedback is not expanded here.",
      ),
    },
  ],
  sources: [
    {
      title: "On Torque and Tumbling in Swimming Escherichia coli",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1855780/",
    },
    {
      title:
        "Single-Cell E. coli Response to an Instantaneously Applied Chemotactic Signal",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4129482/",
    },
    {
      title:
        "Blue Light Is a Universal Signal for Escherichia coli Chemoreceptors",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6509653/",
    },
    {
      title: "The Fast Tumble Signal in Bacterial Chemotaxis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1304305/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const teal = k.material("#659893"),
      gold = k.material("#c6a060"),
      violet = k.material("#8f85a3"),
      ink = k.material("#62716f");
    const shell = k.material("#a2bdb3", {
      transparent: false,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pale = k.material("#c7d4cc"),
      pink = k.material("#ba8382");
    const cell = new THREE.Group();
    cell.name = "chemotactic-cell";
    group.add(cell);
    cell.position.set(0.25, 0.35, 0);
    // Opaque rear envelope leaves a bounded front cutaway exposing signaling.
    const envelope = k.mesh(
      new THREE.SphereGeometry(1, 48, 24, Math.PI, Math.PI),
      shell,
      [0, 0, 0],
      cell,
    );
    envelope.scale.set(1.65, 0.7, 0.55);
    const lipidHeads = [];
    for (let i = 0; i < 100; i++) {
      const angle = (i * Math.PI * 2) / 100;
      for (const side of [-1, 1])
        lipidHeads.push([
          (1.65 + side * 0.035) * Math.cos(angle),
          (0.7 + side * 0.035) * Math.sin(angle),
          0.018,
        ]);
    }
    beadInstances(
      k,
      cell,
      lipidHeads,
      0.023,
      pale,
      "cell-envelope-cut-leaflets",
    );
    const outlinePoints = Array.from({ length: 65 }, (_, i) => [
      1.65 * Math.cos((i * Math.PI) / 32),
      0.7 * Math.sin((i * Math.PI) / 32),
      0,
    ]);
    k.tube(outlinePoints, 0.025, pale, cell);
    // Paired receptor helices form an ordered polar array; tips remain cytoplasmic.
    for (let i = 0; i < 7; i++) {
      const yy = (i - 3) * 0.105;
      for (const dz of [-0.026, 0.026]) {
        helix(
          k,
          cell,
          [0.96, yy, 0.27 + dz],
          [1.67, yy, 0.27 + dz],
          0.022,
          7,
          0.012,
          teal,
        );
        k.ball([1.67, yy, 0.27 + dz], [0.085, 0.033, 0.033], teal, cell);
      }
      k.segment([0.95, yy, 0.27], [0.87, yy * 0.8, 0.31], 0.027, ink, cell);
    }
    const cheA = k.ball([0.85, 0, 0.38], [0.2, 0.3, 0.15], violet, cell);
    k.ball([1.08, 0.2, 0.35], 0.105, ink, cell); // CheW, cytoplasmic receptor coupling.
    const cheZ = k.ball([0.05, 0.35, 0.38], [0.2, 0.12, 0.13], pale, cell);
    for (const side of [-1, 1]) {
      k.ball([0.78, side * 0.19, 0.42], [0.13, 0.12, 0.1], violet, cell);
      helix(
        k,
        cell,
        [0.69, side * 0.04, 0.5],
        [0.83, side * 0.23, 0.5],
        0.034,
        3,
        0.013,
        pale,
      );
    }
    // CheZ dimer with a central docking seam, schematic protein folds.
    for (const dx of [-0.055, 0.055])
      helix(
        k,
        cell,
        [0.05 + dx, 0.25, 0.5],
        [0.05 + dx, 0.45, 0.5],
        0.026,
        3,
        0.012,
        teal,
      );
    const motors = [],
      flagella = [];
    for (let f = 0; f < 5; f++) {
      const x = -1.12 + f * 0.42,
        y = f % 2 ? 0.56 : -0.56;
      const sign = y > 0 ? 1 : -1;
      for (const layer of [-0.07, 0, 0.07]) {
        const ring = k.ring(
          [x, y + layer, 0.1],
          layer === -0.07 ? 0.115 : 0.085,
          0.021,
          layer === 0 ? gold : teal,
          cell,
        );
        ring.rotation.x = Math.PI / 2;
      }
      k.segment([x, y - 0.16, 0.1], [x, y + 0.16, 0.1], 0.026, ink, cell);
      for (let n = 0; n < 9; n++) {
        const angle = (n * Math.PI * 2) / 9;
        k.ball(
          [
            x + 0.13 * Math.cos(angle),
            y - sign * 0.04,
            0.1 + 0.13 * Math.sin(angle),
          ],
          [0.035, 0.07, 0.035],
          pale,
          cell,
        );
      }
      const hook = k.tube(
        [
          [x, y, 0.1],
          [x - 0.07, y + sign * 0.13, 0.1],
          [x - 0.16, y + sign * 0.1, 0.1],
        ],
        0.027,
        teal,
        cell,
      );
      hook.name = `flagellar-hook-${f}`;
      motors.push([x, y, 0.1]);
      const parts = [];
      for (let j = 0; j < 84; j++) {
        const part = k.segment([0, 0, 0], [0.1, 0, 0], 0.025, teal, cell);
        part.name = `flagellum-${f}-segment-${j}`;
        parts.push(part);
      }
      flagella.push(parts);
    }
    const cheYs = Array.from({ length: 5 }, (_, i) =>
      k.ball([0.5 - i * 0.3, -0.17, 0.6], 0.09, gold, cell),
    );
    const ligands = Array.from({ length: 12 }, (_, i) =>
      k.ball(
        [2.15 + (i % 3) * 0.43, -0.45 + Math.floor(i / 3) * 0.43, 0.1],
        0.075,
        gold,
      ),
    );
    // Separate illustrative track. No arrows: each segment represents a run.
    const trackGradient = [
      [-3.1, -2.15],
      [-2.2, -1.8],
      [-1.1, -2.25],
      [0.6, -1.65],
      [1.1, -2.05],
      [2.8, -1.6],
    ];
    const trackUniform = [
      [-3.1, -2.15],
      [-2.3, -1.8],
      [-2, -2.25],
      [-1.4, -1.7],
      [-1.8, -2.25],
      [-0.85, -2.0],
    ];
    const paths = [trackGradient, trackUniform];
    const traces = paths.map((points) => {
      const g = new THREE.Group();
      group.add(g);
      for (let j = 0; j < points.length - 1; j++)
        k.segment(
          [...points[j], -0.1],
          [...points[j + 1], -0.1],
          0.026,
          pale,
          g,
        );
      points
        .slice(1, -1)
        .forEach((p) => k.ring([...p, -0.08], 0.065, 0.016, pink, g));
      return g;
    });
    const cursor = k.ball([-3.1, -2.15, 0.1], [0.13, 0.07, 0.07], teal);
    const labels = [
      k.label(
        [0.4, 1.43, 0],
        "大肠杆菌 · 周生鞭毛",
        "E. coli · peritrichous flagella",
        2,
      ),
      k.label([2.22, 0.3, 0.2], "膜受体", "Membrane receptors", 2),
      k.label([0.9, 0.95, 0.6], "CheW / CheA", "CheW / CheA", 1),
      k.label([-0.1, 0.6, 0.65], "CheZ", "CheZ", 1),
      k.label([-0.45, -0.3, 0.6], "CheY-P", "CheY-P", 2),
      k.label([-1.3, -0.75, 0.3], "鞭毛马达", "Flagellar motors", 2),
      k.label(
        [-0.1, -2.85, 0],
        "固定示意轨迹：游程与翻滚",
        "Fixed illustrative track: runs and tumbles",
        1,
      ),
    ];
    const axis = new THREE.Vector3(0, 1, 0),
      a = new THREE.Vector3(),
      z = new THREE.Vector3(),
      d = new THREE.Vector3();
    const gradientTumbles = [[0.75, 0.83]],
      uniformTumbles = [
        [0.26, 0.34],
        [0.52, 0.6],
        [0.75, 0.83],
      ];
    function point(f, t, deformation, phase, out) {
      const origin = motors[f],
        spread = (f - 2) * (0.055 + deformation * (f === 0 ? 0.565 : 0.08));
      const sign = origin[1] > 0 ? 1 : -1;
      const outer = Math.min(1, t / 0.45),
        trail = Math.max(0, (t - 0.45) / 0.55);
      const x =
        t < 0.45
          ? (origin[0] - 0.16) * (1 - outer) - 1.95 * outer
          : -1.95 - 1.45 * trail;
      const y =
        t < 0.45
          ? origin[1] + sign * (0.1 + 0.27 * Math.sin((outer * Math.PI) / 2))
          : sign * 0.93 * (1 - trail) + spread * trail;
      // Along the decreasing-x tail, +twist with z=-cos is left-handed.
      // Phase decreases for CCW viewed from behind (-x toward +x).
      const amplitude = 0.12 * Math.min(1, t * 5),
        twist = f === 0 ? 36 - 60 * deformation : 36,
        angle = t * twist + phase + f;
      out.set(
        x,
        y + amplitude * Math.sin(angle),
        origin[2] - amplitude * Math.cos(angle),
      );
      return out;
    }
    function update(value, parameters = {}) {
      const p = clamp(value),
        gradient = parameters.environment !== "uniform";
      const intervals = gradient ? gradientTumbles : uniformTumbles,
        tumble = intervals.some(([start, end]) => p >= start && p < end);
      let reversedTime = 0,
        deformation = 0,
        wobble = 0;
      for (const [start, end] of intervals) {
        reversedTime += Math.max(0, Math.min(p, end) - start);
        const shape =
          ease(p, start, start + 0.015) * (1 - ease(p, end - 0.015, end));
        deformation += shape;
        wobble += shape * 0.24 * Math.sin((p - start) * 75);
      }
      const response = gradient * ease(p, 0.18, 0.38),
        cheYLevel = tumble ? 1 : 1 - 0.75 * response;
      cell.rotation.z = wobble;
      cheA.material = response && !tumble ? pale : violet;
      cheZ.scale.set(0.2, 0.12, 0.13);
      for (let i = 0; i < cheYs.length; i++) {
        const q = (p * 2 + i * 0.19) % 1;
        cheYs[i].position.set(0.65 - 1.35 * q, -0.1 - 0.38 * q, 0.6);
        cheYs[i].visible = i < Math.ceil(cheYLevel * 5);
      }
      for (let i = 0; i < ligands.length; i++) {
        ligands[i].visible = gradient || i < 4;
        ligands[i].position.x =
          2.15 + (i % 3) * 0.43 - 0.3 * ease(p, 0.1, 0.25);
      }
      for (let f = 0; f < flagella.length; f++)
        for (let j = 0; j < 84; j++) {
          const phase = -32 * p + (f === 0 ? 64 * reversedTime : 0);
          point(f, j / 84, deformation, phase, a);
          point(f, (j + 1) / 84, deformation, phase, z);
          d.copy(z).sub(a);
          const m = flagella[f][j];
          m.position.copy(a).add(z).multiplyScalar(0.5);
          m.scale.set(0.025, d.length(), 0.025);
          m.quaternion.setFromUnitVectors(axis, d.normalize());
        }
      traces[0].visible = gradient;
      traces[1].visible = !gradient;
      const path = paths[gradient ? 0 : 1],
        step = Math.min(4, Math.floor(p * 5)),
        t = p === 1 ? 1 : p * 5 - step;
      cursor.position.set(
        path[step][0] + (path[step + 1][0] - path[step][0]) * t,
        path[step][1] + (path[step + 1][1] - path[step][1]) * t,
        0.1,
      );
      cursor.rotation.z = Math.atan2(
        path[step + 1][1] - path[step][1],
        path[step + 1][0] - path[step][0],
      );
      group.userData = {
        species: "Escherichia coli",
        environment: gradient ? "gradient" : "uniform",
        flagellation: "peritrichous",
        motorState: tumble ? "one-or-more-CW" : "CCW-bundle",
        behavior: tumble ? "tumble" : "run",
        cheYPhosphorylation: cheYLevel,
        trajectory: "deterministic illustrative biased random walk",
        directionIsCommanded: false,
        structuralDetail:
          "bounded-envelope-cutaway; paired-receptor-helices; layered-basal-motors; continuous-helical-filaments",
      };
    }
    update(0);
    return {
      group,
      materials: Array.from(
        new Set(
          (() => {
            const all = [];
            group.traverse((n) => {
              if (n.material) all.push(n.material);
            });
            return all;
          })(),
        ),
      ),
      update,
      labels,
      camera: { position: [0, 1.2, 11.5], target: [0, -0.45, 0] },
    };
  },
};
