import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import phageLytic from "./phageLyticProcess.js";
import phageLysogenic from "./phageLysogenicProcess.js";
import phageAssembly from "./phageAssemblyProcess.js";
import phagePackaging from "./phagePackagingProcess.js";
let models = { phageLytic, phageLysogenic, phageAssembly, phagePackaging };
if (process.env.PHAGE_LABEL_MODELS)
  models = (await import(pathToFileURL(process.env.PHAGE_LABEL_MODELS).href))
    .default;
const world = (o, x = 0, y = 0, z = 0) =>
  o.localToWorld(new THREE.Vector3(x, y, z));
const vertex = (o, i = 0) =>
  new THREE.Vector3()
    .fromBufferAttribute(o.geometry.attributes.position, i)
    .applyMatrix4(o.matrixWorld);
function instance(o, i = 0) {
  const matrix = new THREE.Matrix4();
  o.getMatrixAt(i, matrix);
  return new THREE.Vector3()
    .setFromMatrixPosition(matrix)
    .applyMatrix4(o.matrixWorld);
}
let checks = 0,
  states = 0;
function near(label, target, reason) {
  const distance = new THREE.Vector3(...label.position).distanceTo(target);
  assert(
    distance < 2e-6,
    `${reason}: leader misses actual target by ${distance}`,
  );
  checks++;
}
function onDuplex(label, group, reason) {
  const mesh = group.children.find((o) => o.isMesh && !o.isInstancedMesh),
    geometry = mesh.geometry,
    attr = geometry.attributes.position,
    index = geometry.index,
    start = geometry.drawRange.start,
    end = Math.min(index.count, start + geometry.drawRange.count),
    anchor = new THREE.Vector3(...label.position),
    point = new THREE.Vector3();
  let distance = Infinity;
  for (let i = start; i < end; i++) {
    point
      .fromBufferAttribute(attr, index.getX(i))
      .applyMatrix4(mesh.matrixWorld);
    distance = Math.min(distance, point.distanceTo(anchor));
  }
  assert(
    distance < 0.024,
    `${reason}: leader is ${distance} from the actual drawn duplex`,
  );
  checks++;
}
function effective(o) {
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return true;
}
const samples = [
  0, 0.17, 0.3, 0.34, 0.4, 0.52, 0.65, 0.69, 0.76, 0.78, 0.81, 0.87, 0.9, 0.92,
  0.95, 0.99, 1, 0.23, 0.805, 0.105,
];
for (const [id, model] of Object.entries(models)) {
  if (process.env.PHAGE_LABEL_ONLY && process.env.PHAGE_LABEL_ONLY !== id)
    continue;
  const scene = model.create(),
    originalLabels = [...scene.labels],
    arrays = scene.labels.map((l) => l.position),
    conditions =
      id === "phageLysogenic"
        ? [{ fate: "induce" }, { fate: "maintain" }]
        : id === "phageAssembly"
          ? [{ protease: "active" }, { protease: "inactive" }]
          : id === "phagePackaging"
            ? [{ atp: "present" }, { atp: "absent" }]
            : [{}];
  for (const parameters of conditions)
    for (const p of samples) {
      scene.update(p, parameters);
      scene.group.updateMatrixWorld(true);
      const labels = scene.labels,
        g = scene.group;
      states++;
      if (id === "phageLytic") {
        const visitor = g.getObjectByName("T4-attached-visitor");
        near(
          labels[2],
          vertex(visitor.getObjectByName("T4-open-neck-capsid-shell")),
          "T4 capsid leader stays on the actual extracellular coat",
        );
        near(
          labels[0],
          vertex(g.children[0].children[0].children[0], 175),
          "envelope-region leader follows a retained rupture fragment",
        );
        if (labels[1].active) {
          const a = labels[1].position;
          assert(
            (a[0] / 2.96) ** 2 + (a[1] / 1.369) ** 2 + (a[2] / 1.036) ** 2 < 1,
            "cytoplasm region anchor lies inside the host",
          );
        }
        if (labels[3].active)
          near(
            labels[3],
            world(
              g.getObjectByName("T4-expression-ribosome-1").children[0]
                .children[0],
            ),
            "translation label targets a real ribosome domain beside RNA",
          );
        if (labels[4].active)
          onDuplex(
            labels[4],
            g.getObjectByName("T4-concatemer-0"),
            "concatemer leader touches amplified DNA",
          );
        if (labels[5].active)
          near(
            labels[5],
            vertex(
              g
                .getObjectByName("T4-progeny-1")
                .getObjectByName("T4-open-neck-capsid-shell"),
            ),
            "prohead leader follows its inner-membrane detachment",
          );
        if (labels[6].active)
          near(
            labels[6],
            vertex(
              g
                .getObjectByName("T4-progeny-0")
                .getObjectByName("T4-open-neck-capsid-shell"),
            ),
            "released-progeny leader follows actual particle translation and rotation",
          );
      } else if (id === "phageLysogenic") {
        const visitor = g.getObjectByName("lambda-attached-visitor"),
          leftCI = g.getObjectByName("lambda-CI-0");
        near(
          labels[1],
          vertex(visitor.getObjectByName("lambda-open-tail-tube"), 40 * 17),
          "lambda-tail leader identifies the actual noncontractile tube",
        );
        near(
          labels[0],
          instance(
            g
              .getObjectByName("lambda-left-host")
              .getObjectByName("paired-leaflet-headgroups"),
            48,
          ),
          "lambda envelope cutaway leader tracks its cell",
        );
        if (labels[2].active)
          near(
            labels[2],
            world(g.getObjectByName("lambda-attP-contact")),
            "attP x attB label points at the actual contact marker",
          );
        if (labels[3].active)
          onDuplex(
            labels[3],
            g.getObjectByName("lambda-integrated-prophage-0"),
            "prophage label follows actual purple DNA through division",
          );
        for (const i of [4, 6])
          if (labels[i].active) {
            assert(
              effective(leftCI),
              "CI label hides with its actual repressor",
            );
            near(
              labels[i],
              world(leftCI.children[0]),
              "CI label follows its moving/scaling protein domain",
            );
          }
        near(
          labels[5],
          world(g.getObjectByName("lambda-right-host")),
          "uninduced-daughter region leader stays in the correct lineage",
        );
        if (labels[7].active) {
          if (p < 0.83)
            onDuplex(
              labels[7],
              g.getObjectByName("lambda-integrated-prophage-0"),
              "excision label on remaining substrate",
            );
          else if (p < 0.89)
            onDuplex(
              labels[7],
              g.getObjectByName("lambda-excised-prophage"),
              "excision label follows the released circle",
            );
          else
            near(
              labels[7],
              vertex(
                g
                  .getObjectByName("lambda-progeny-0")
                  .getObjectByName("lambda-capsid-shell"),
              ),
              "late-development label follows actual released progeny",
            );
        }
      } else if (id === "phageAssembly") {
        const head = g.children[0],
          tail = g.children[1],
          scaffold = head.children.find((o) =>
            o.children.some((x) => x.name === "scaffold-protein-domains"),
          ),
          protease = scaffold.children.at(-1),
          dna = head.getObjectByName("packaged-dsDNA-with-basepairs"),
          seal = head.getObjectByName("gp14-seal-subunits");
        near(
          labels[1],
          world(tail.children[0]),
          "independent-tail leader points at its actual baseplate",
        );
        for (const i of [0, 3, 7])
          if (labels[i].active) {
            assert(effective(protease));
            near(
              labels[i],
              world(protease.children[0]),
              "gp21/scaffold label follows the protease during clearance or stall",
            );
          }
        if (labels[2].active)
          near(
            labels[2],
            world(g.getObjectByName("T4-assembly-inner-membrane").children[27]),
            "membrane leader targets the real headgroup row",
          );
        if (labels[4].active)
          onDuplex(
            labels[4],
            dna,
            "packaging leader stays on the actually loaded DNA interval",
          );
        if (labels[5].active)
          near(
            labels[5],
            instance(seal),
            "head-tail joining leader follows the seal at the attachment site",
          );
        if (labels[6].active) {
          const rows = tail.children.filter(
            (o) => o.children[0]?.name === "helical-sheath-subunits",
          );
          near(
            labels[6],
            instance(rows[10].children[0]),
            "extended-sheath leader targets actual mature sheath subunits",
          );
        }
      } else {
        const head = g.children[0],
          motor = g.children[1],
          external = g.children[2],
          portal = head.children.find((o) => o.position.y === -1.6),
          atpase = motor.children[0].children[0],
          guide = g.children.find((o) => o.geometry?.type === "ConeGeometry"),
          cut = g.children.find((o) => o.geometry?.type === "TorusGeometry");
        near(
          labels[1],
          world(portal.children[1].children[0]),
          "gp20 leader targets a real portal subunit, not empty offset space",
        );
        near(
          labels[2],
          world(atpase.children[0]),
          "gp17 leader follows motor conformation and departure",
        );
        if (labels[2].active) assert(effective(motor));
        if (labels[3].active)
          near(
            labels[3],
            world(guide),
            "translocation label follows the drawn inward arrow",
          );
        if (labels[4].active)
          near(
            labels[4],
            world(external.children[27 * 3]),
            "external-DNA leader stays on its actual moving backbone",
          );
        if (labels[5].active)
          near(
            labels[5],
            cut.visible ? world(cut, 0.19, 0, 0) : world(atpase.children[0]),
            "completion label follows the cut marker then released motor",
          );
        if (labels[6].active) {
          const seal = head.getObjectByName("gp14-seal-subunits");
          assert(effective(seal));
          near(
            labels[6],
            instance(seal),
            "gp13/gp14 leader tracks the actual scaled neck seal",
          );
        }
        if (labels[7].active)
          near(
            labels[7],
            world(motor.children[2].children[0].children[0]),
            "no-ATP annotation targets the stalled docked motor",
          );
      }
      scene.labels.forEach((l, i) => {
        assert.equal(l, originalLabels[i]);
        assert.equal(l.position, arrays[i]);
      });
      const snapshot = JSON.stringify(labels);
      scene.update(0.71, conditions.at(-1));
      scene.update(p, parameters);
      assert.equal(
        JSON.stringify(labels),
        snapshot,
        "all label anchors/visibility seek deterministically without replacing source arrays",
      );
    }
}
console.log(
  `PASS 20261004-phageLife-04: ${checks} actual-geometry label checks across ${states} states and all 7 root/condition combinations`,
);
