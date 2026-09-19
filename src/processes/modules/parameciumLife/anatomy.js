import { THREE } from "../../kit.js";
import { corticalRows, nuclearDetail } from "./fineStructure.js";

// An opened ventral view: the oral depression is on only one side.
export function addParamecium(kit) {
  const outline = new THREE.Shape();
  outline.moveTo(-0.2, 3.05);
  outline.bezierCurveTo(-1.4, 2.9, -1.7, 1.5, -1.48, -0.1);
  outline.bezierCurveTo(-1.4, -1.6, -0.55, -3.03, 0.2, -3.2);
  outline.bezierCurveTo(1.15, -2.7, 1.38, -1.7, 1.2, -0.8);
  outline.bezierCurveTo(0.94, -0.42, 0.6, -0.38, 0.72, 0.25);
  outline.bezierCurveTo(1.65, 1.4, 1.3, 2.8, -0.2, 3.05);
  const shell = kit.mesh(
    new THREE.ExtrudeGeometry(outline, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.17,
      bevelSegments: 4,
      steps: 1,
      curveSegments: 32,
    }),
    kit.material("#a5b6a1", {
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
    [0, 0, -0.5],
  );
  shell.renderOrder = 1;
  const pts = outline.getPoints(90);
  kit.tube(
    pts.map((p) => [p.x, p.y, 0.1]),
    0.04,
    kit.material("#7c9381"),
  );
  const cilia = [];
  for (let i = 0; i < pts.length - 1; i += 2) {
    const p = pts[i],
      n = pts[(i + 1) % pts.length];
    const dx = n.x - p.x,
      dy = n.y - p.y,
      len = Math.hypot(dx, dy);
    const cilium = kit.segment(
      [p.x, p.y, 0.12],
      [p.x + (dy / len) * 0.23, p.y - (dx / len) * 0.23, 0.22],
      0.013,
      kit.material("#96ada2"),
    );
    cilia.push({ object: cilium, angle: cilium.rotation.z });
  }
  const macro = kit.ball(
    [-0.45, 0.7, 0.1],
    [0.46, 0.73, 0.23],
    kit.material("#a5a0b5", { transparent: true, opacity: 0.6 }),
  );
  nuclearDetail(kit, macro, true);
  for (let i = 0; i < 4; i++) {
    const mic = kit.ball(
      [-0.9 + i * 0.18, 0.1, 0.12],
      0.075,
      kit.material("#77728a"),
    );
    nuclearDetail(kit, mic, false);
  }
  corticalRows(
    kit,
    kit.group,
    (u, v, w) => [
      u * 1.36 * (0.9 + v * 0.1) + 0.06 * v * v,
      v * 2.96,
      0.06 + w * 0.28,
    ],
    { rows: 15, columns: 19 },
  );
  return { cilia };
}
