import * as THREE from "three";
import { sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { bilayerOutline } from "./structuralDetail.js";
function rounded(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}
const process = {
  id: "plasmolysis",
  title: b("质壁分离与复原", "Plasmolysis and recovery"),
  intro: b(
    "洋葱表皮细胞的示意剖面：外液使用短时间内不能透过质膜的溶质。细胞壁透水且保持形状，完整的原生质体和液泡随渗透失水收缩。可选择更换稀外液或维持高渗外液；演示不代表定量渗透测量。",
    "Schematic section of an onion epidermal cell with an external solute impermeant to its plasma membrane over this interval. The water-permeable wall retains its shape while the intact protoplast and vacuole shrink. Choose dilution for recovery or continued hypertonic exposure; this is not a quantitative osmometry experiment.",
  ),
  duration: 32,
  controls: [
    {
      id: "bath",
      label: b("外液处理", "Bath treatment"),
      default: "recover",
      options: [
        {
          value: "recover",
          label: b("高渗后换稀外液", "Hypertonic, then dilute"),
        },
        { value: "hold", label: b("持续高渗", "Maintain hypertonic bath") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("膨压支撑", "Turgid cell"),
      description: b(
        "起始外液较稀，液泡充盈；膨压使质膜贴近细胞壁。",
        "Initially the dilute bath supports a large vacuole and turgor presses the plasma membrane against the wall.",
      ),
    },
    {
      at: 0.14,
      title: b("更换高渗外液", "Hypertonic bath"),
      description: b(
        "提高外液不能透膜溶质的浓度，降低外液水势；溶质可进入多孔细胞壁，但不能穿过质膜。",
        "Increasing the external impermeant solute lowers bath water potential. Solute can access the porous wall but cannot cross the plasma membrane.",
      ),
    },
    {
      at: 0.3,
      title: b("净失水、膨压下降", "Net water loss"),
      description: b(
        "水跨过质膜与液泡膜向外净移动，液泡体积和原生质体体积减小。",
        "Net water movement across the plasma membrane and tonoplast reduces vacuole and protoplast volume.",
      ),
    },
    {
      at: 0.49,
      title: b("质膜与壁分离", "Membrane retracts from wall"),
      description: b(
        "原生质体从固定细胞壁内侧回缩，间隙由外液占据；质膜始终连续。",
        "The protoplast retracts from the fixed wall, leaving an external-solution-filled gap. The membrane remains continuous.",
      ),
    },
    {
      at: 0.66,
      title: b("选择外液条件", "Bath condition determines recovery"),
      description: b(
        "换成稀外液后水净流入；若维持高渗外液，细胞继续保持质壁分离。",
        "A dilute replacement bath drives net water uptake. Continued hypertonic exposure preserves the plasmolysed state.",
      ),
    },
    {
      at: 0.9,
      title: b("可逆恢复", "Reversible recovery"),
      description: b(
        "在细胞仍存活且膜完整的前提下，稀外液可使液泡扩大、原生质体重新贴壁。高渗条件下不发生此复原。",
        "With viable cells and intact membranes, dilution expands the vacuole and restores wall contact. Recovery does not occur in the maintained hypertonic bath.",
      ),
    },
  ],
  sources: [
    {
      title: "OpenStax Biology — Passive Transport: Osmosis and Tonicity",
      url: "https://openstax.org/books/biology/pages/5-2-passive-transport",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const wallMat = k.material("#a8b887"),
      memMat = k.material("#ad785e"),
      vacMat = k.material("#82b7c0", { transparent: true, opacity: 0.72 }),
      cytoMat = k.material("#ead9b3", {
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
    const wallShape = rounded(5.3, 5.8, 0.65),
      hole = rounded(4.9, 5.4, 0.5);
    wallShape.holes.push(new THREE.Path(hole.getPoints(48)));
    const wall = k.mesh(
      new THREE.ExtrudeGeometry(wallShape, {
        depth: 0.75,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.06,
        bevelThickness: 0.06,
      }),
      wallMat,
      [0, 0, -0.45],
    );
    wall.name = "fixed porous cell wall";
    // Lamellar cellulose bundles are restricted to the cut face of the fixed wall.
    for (let layer = 0; layer < 3; layer++) {
      const contour = rounded(5.02 + layer * 0.075, 5.52 + layer * 0.075, 0.56)
        .getSpacedPoints(120)
        .map((p) => [p.x, p.y, 0.33 + layer * 0.025]);
      contour.push(contour[0]);
      k.tube(contour, 0.013, k.material(layer % 2 ? "#cad0a8" : "#8d9f70"));
      for (const side of [-1, 1])
        for (let j = 0; j < 22; j++) {
          const y = -2.15 + j * 0.205;
          k.segment(
            [side * 2.45, y, 0.35 + layer * 0.025],
            [
              side * 2.66,
              y + 0.12 * (layer % 2 ? 1 : -1),
              0.35 + layer * 0.025,
            ],
            0.012,
            k.material("#c0cba1"),
          );
        }
    }
    const protoplast = new THREE.Group();
    group.add(protoplast);
    k.mesh(
      new THREE.ExtrudeGeometry(rounded(4.72, 5.22, 0.64), {
        depth: 0.44,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.06,
        bevelThickness: 0.06,
      }),
      cytoMat,
      [0, 0, -0.2],
      protoplast,
    );
    const membranePoints = rounded(4.73, 5.23, 0.64)
      .getPoints(96)
      .map((p) => [p.x, p.y, 0.31]);
    membranePoints.push(membranePoints[0]);
    bilayerOutline(
      k,
      protoplast,
      rounded(4.73, 5.23, 0.64)
        .getSpacedPoints(192)
        .map((p) => [p.x, p.y, 0.36]),
      { gap: 0.065, head: 0.021 },
    );
    const vacuole = k.mesh(
      new THREE.ExtrudeGeometry(rounded(3.95, 4.38, 0.9), {
        depth: 0.35,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: 0.09,
        bevelThickness: 0.08,
      }),
      vacMat,
      [0.06, 0.08, -0.12],
      protoplast,
    );
    const tonoplast = rounded(3.99, 4.42, 0.91)
      .getPoints(96)
      .map((p) => [p.x + 0.06, p.y + 0.08, 0.32]);
    tonoplast.push(tonoplast[0]);
    bilayerOutline(
      k,
      protoplast,
      rounded(3.99, 4.42, 0.91)
        .getSpacedPoints(144)
        .map((p) => [p.x + 0.06, p.y + 0.08, 0.37]),
      { gap: 0.044, head: 0.015, color: "#5f979f", tailColor: "#b7c7b7" },
    );
    // Slightly raised cut-edge lip makes the vacuolar lumen unambiguous.
    k.tube(tonoplast, 0.012, k.material("#d0e3dd"), protoplast);
    const nucleus = k.ball(
      [-1.92, -0.78, 0.36],
      [0.29, 0.45, 0.17],
      k.material("#a992aa"),
      protoplast,
    );
    k.ball([-1.93, -0.79, 0.51], 0.1, k.material("#796a86"), protoplast);
    const external = [];
    for (let i = 0; i < 40; i++) {
      const side = i % 4,
        t = (Math.floor(i / 4) + 0.5) / 10;
      const x = side < 2 ? (side === 0 ? -3.1 : 3.1) : -2.8 + 5.6 * t;
      const y = side < 2 ? -2.85 + 5.7 * t : side === 2 ? -3.18 : 3.18;
      external.push(k.ball([x, y, 0.12], 0.065, k.material("#b89b6c")));
    }
    const gapSolutes = [];
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? -1 : 1;
      gapSolutes.push(
        k.ball(
          [side * 2.05, -1.8 + (i >> 1) * 0.7, 0.4],
          0.055,
          k.material("#b89b6c"),
        ),
      );
    }
    const water = [];
    for (let i = 0; i < 18; i++)
      water.push(
        k.ball([0, 0, 0.6], [0.064, 0.064, 0.046], k.material("#5598c6")),
      );
    const labels = [
      k.label([-2.6, 2.65, 0.4], "固定细胞壁", "Fixed cell wall", 3),
      k.label([1.6, 1.75, 0.65], "液泡 / 液泡膜", "Vacuole / tonoplast", 2),
      k.label([-2.3, -1.75, 0.65], "完整质膜", "Intact plasma membrane", 3),
      k.label(
        [3.05, -2.7, 0.5],
        "外液：不能透膜的溶质",
        "Bath: impermeant solute",
        2,
      ),
      k.label([2.03, 0.2, 0.65], "外液填充的间隙", "Bath-filled gap", 2),
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        recover = parameters.bath !== "hold",
        loss = ease(p, 0.18, 0.49),
        gain = recover ? ease(p, 0.68, 0.93) : 0,
        shrink = loss * (1 - gain),
        sx = 1 - 0.31 * shrink,
        sy = 1 - 0.23 * shrink;
      protoplast.scale.set(sx, sy, 1 - 0.23 * shrink);
      const high =
        ease(p, 0.1, 0.18) * (1 - (recover ? ease(p, 0.64, 0.69) : 0));
      external.forEach((m, i) => (m.visible = i < 8 || high > 0.12));
      gapSolutes.forEach((m) => (m.visible = shrink > 0.45 && high > 0.12));
      const outward = p > 0.18 && p < 0.49,
        inward = recover && p > 0.68 && p < 0.93;
      water.forEach((m, i) => {
        m.visible = outward || inward;
        const t = (p * 6 + i / 9) % 1;
        const side = i % 2 ? -1 : 1;
        const a = 1.6 * sx,
          dist = outward ? a + (3.28 - a) * t : 3.28 - (3.28 - a) * t;
        m.position.set(side * dist, -1.5 + (i % 9) * 0.375, 0.61);
      });
      labels[1].position = [1.4 * sx, 1.75 * sy, 0.65];
      labels[2].position = [-2.32 * sx, -1.7 * sy, 0.65];
      labels[4].active = shrink > 0.5;
      group.userData = {
        process: "plasmolysis",
        bath: recover ? "hypertonic-then-dilute" : "hypertonic-held",
        externalOsmolarity: high > 0.5 ? "high" : "dilute",
        solutePermeability: "impermeant-plasma-membrane",
        membraneIntact: true,
        structuralDetail:
          "fixed fibrillar wall, bilayer plasma membrane, bilayer tonoplast",
        wallDimensions: [5.3, 5.8, 0.75],
        protoplastVolumeRelative: sx * sy * (1 - 0.23 * shrink),
        vacuoleVolumeRelative: sx * sy * (1 - 0.23 * shrink),
        plasmolysed: shrink > 0.5,
        netWaterDirection: outward ? "out" : inward ? "in" : "equilibrated",
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0, 1.2, 11.2], target: [0, 0, 0] },
      labels,
    };
  },
};
export default process;
