import assert from "node:assert/strict";

// Measured event locations in the original schematic, plus phase boundaries.
// The dense sweep below is independent of the model's animation formulas.
const events = [
  0.15, 0.2045567378291807, 0.34, 0.4, 0.48, 0.63, 0.64, 0.6643492528139054,
  0.6768404829692918, 0.6865367202038728, 0.6949048136192935,
  0.7024719363482061, 0.7095009487700197, 0.7161466837767378,
  0.7225106143199171, 0.7286646363513019, 0.7346629960344517,
  0.7405489353989101, 0.7463587364700339, 0.7521244006670054,
  0.7578755993329946, 0.7636412635299661, 0.7694510646010899,
  0.7753370039655483, 0.7813353636486982, 0.7874893856800829,
  0.7938533162232624, 0.8, 0.8004990512299803, 0.8075280636517936,
  0.8110862258999822, 0.8150951863807065, 0.8234632797961272,
  0.8331595170307082, 0.8456507471860946, 0.87, 0.88,
];
const names = ["damaged-strand", "intact-template", "repair-patch"];
const corners = [];
for (const x of [-0.5, 0.5])
  for (const y of [-0.5, 0.5])
    for (const z of [-0.5, 0.5]) corners.push([x, y, z]);
const point = (a, j, c) =>
  [0, 1, 2].map(
    (k) =>
      a[j + k] * c[0] +
      a[j + 4 + k] * c[1] +
      a[j + 8 + k] * c[2] +
      a[j + 12 + k],
  );
const distance = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));

export function assertRepairBaseContinuity(model) {
  const result = {
    states: 0,
    attachments: 0,
    boundaries: 0,
    maxAttachmentError: 0,
    maxDenseStep: 0,
    maxBoundaryStep: 0,
  };
  function sample(progress, incision) {
    model.update(progress, { incision });
    model.group.updateMatrixWorld(true);
    const output = [];
    for (const name of names) {
      const bases = model.group.getObjectByName(`${name}-attached-bases`),
        phosphates = model.group.getObjectByName(`${name}-phosphate-groups`);
      assert(bases?.isInstancedMesh && phosphates?.isInstancedMesh);
      assert.equal(bases.count, 80);
      assert.equal(phosphates.count, 80);
      const a = bases.instanceMatrix.array,
        pa = phosphates.instanceMatrix.array,
        samples = [];
      for (let i = 0; i < bases.count; i++) {
        const j = i * 16,
          width = Math.hypot(a[j], a[j + 1], a[j + 2]),
          depth = Math.hypot(a[j + 8], a[j + 9], a[j + 10]),
          visible = width > 1e-8 && depth > 1e-8,
          attached = point(
            bases.matrixWorld.elements,
            0,
            point(a, j, [0, -0.5, 0]),
          ),
          phosphate = point(
            phosphates.matrixWorld.elements,
            0,
            pa.slice(j + 12, j + 15),
          ),
          error = distance(attached, phosphate);
        assert(
          error < 2e-6,
          `repair base attachment: ${name}[${i}] p=${progress}, error=${error}`,
        );
        result.attachments++;
        result.maxAttachmentError = Math.max(result.maxAttachmentError, error);
        // A cuboid's half-turn roll permutes its vertices. Compare an
        // equivalent ordering of the same actual eight corners.
        const roll = a[j] < 0 ? -1 : 1,
          local = corners.map((c) =>
            point(a, j, [c[0] * roll, c[1], c[2] * roll]),
          );
        if (visible) {
          assert(
            Math.abs(width - 0.075) < 1e-6 && Math.abs(depth - 0.032) < 1e-6,
            "repair base cross-section preserved",
          );
          for (const v of local) {
            for (let k = 0; k < 3; k++)
              assert(
                v[k] >= bases.boundingBox.min.getComponent(k) - 1e-6 &&
                  v[k] <= bases.boundingBox.max.getComponent(k) + 1e-6,
                "repair base remains inside its box",
              );
            assert(
              distance(v, bases.boundingSphere.center.toArray()) <=
                bases.boundingSphere.radius + 1e-6,
              "repair base remains inside its sphere",
            );
          }
        }
        samples.push({
          visible,
          corners: local.map((v) => point(bases.matrixWorld.elements, 0, v)),
        });
      }
      output.push(samples);
    }
    result.states++;
    return output;
  }
  const delta = (a, b) => {
    let maximum = 0;
    for (let n = 0; n < a.length; n++)
      for (let i = 0; i < a[n].length; i++)
        if (a[n][i].visible && b[n][i].visible)
          for (let j = 0; j < 8; j++)
            maximum = Math.max(
              maximum,
              distance(a[n][i].corners[j], b[n][i].corners[j]),
            );
    return maximum;
  };
  for (const incision of ["active", "blocked"]) {
    for (const event of events) {
      const left = sample(event - 1e-9, incision),
        right = sample(event + 1e-9, incision),
        jump = delta(left, right);
      assert(
        jump < 1e-5,
        `repair base finite boundary jump: ${incision} p=${event}, jump=${jump}`,
      );
      assert.deepEqual(
        sample(event - 1e-9, incision),
        left,
        "repair reverse seek restores actual geometry",
      );
      result.boundaries++;
      result.maxBoundaryStep = Math.max(result.maxBoundaryStep, jump);
    }
    let previous = sample(0, incision);
    for (let i = 1; i <= 4096; i++) {
      const next = sample(i / 4096, incision),
        jump = delta(previous, next);
      assert(
        jump < 0.05,
        `repair base finite dense jump: ${incision} p=${i / 4096}, jump=${jump}`,
      );
      result.maxDenseStep = Math.max(result.maxDenseStep, jump);
      previous = next;
    }
  }
  return result;
}
