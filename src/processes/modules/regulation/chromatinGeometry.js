import { THREE } from "../../kit.js";
import { histoneOctamer, molecularDNA } from "./geometry.js";

// Detailed immutable nucleosome templates share GPU geometry; only linkers deform.
export function chromatinFiber(kit) {
  const material = [
    kit.material("#7796a5"),
    kit.material("#b39bb7"),
    kit.material("#a6bfb6"),
    kit.material("#c3b6c9"),
    kit.material("#d8cfbb"),
  ];
  const seed = new THREE.Group();
  seed.name = "Nucleosome: histone octamer with 1.65-turn double-stranded DNA";
  histoneOctamer(kit, seed);
  const radial = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    binormal = new THREE.Vector3();
  function wrapped(t, s, out) {
    const angle = Math.PI / 2 - 3.3 * Math.PI * t,
      twist = 14 * Math.PI * 2 * t + s * 2.35;
    radial.set(Math.cos(angle), Math.sin(angle), 0);
    tangent
      .set(
        3.3 * Math.PI * 0.39 * Math.sin(angle),
        -3.3 * Math.PI * 0.39 * Math.cos(angle),
        0.29,
      )
      .normalize();
    binormal.crossVectors(tangent, radial).normalize();
    out.set(0.39 * Math.cos(angle), 0.39 * Math.sin(angle), 0.29 * (t - 0.5));
    out
      .addScaledVector(radial, 0.048 * Math.cos(twist))
      .addScaledVector(binormal, 0.048 * Math.sin(twist));
  }
  const wrappedDNA = molecularDNA(kit, {
    pairs: 147,
    segments: 320,
    radius: 0.016,
    phosphate: 0.023,
    baseWidth: 0.028,
    materials: material,
    parent: seed,
  });
  wrappedDNA.rails.forEach((rail, s) => {
    rail.mesh.name = `Nucleosome DNA strand ${s + 1}`;
  });
  wrappedDNA.update(wrapped);
  const positions = [0.06, 0.29, 0.4, 0.51, 0.62, 0.73, 0.95];
  const cores = positions.map((t, i) => {
    const object = i ? seed.clone(true) : seed;
    object.name = `Nucleosome ${i + 1} — eight histones, wrapped duplex and tails`;
    kit.group.add(object);
    return { t, object };
  });
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    mid = new THREE.Vector3(),
    delta = new THREE.Vector3(),
    axis = new THREE.Vector3();
  const endpoints = Array.from({ length: 2 }, () =>
    Array.from({ length: 2 }, () => ({
      point: new THREE.Vector3(),
      direction: new THREE.Vector3(),
    })),
  );
  for (let end = 0; end < 2; end++)
    for (let s = 0; s < 2; s++) {
      wrapped(end, s, endpoints[end][s].point);
      wrapped(end === 0 ? 0.00001 : 0.99999, s, a);
      endpoints[end][s].direction
        .copy(endpoints[end][s].point)
        .sub(a)
        .multiplyScalar(end === 0 ? -1 : 1)
        .normalize();
    }
  const links = Array.from({ length: 8 }, (_, i) => {
    const controls = Array.from({ length: 2 }, () =>
      Array.from({ length: 4 }, () => new THREE.Vector3()),
    );
    const reaction = {
      opening: 0,
      t: 0.34,
      origin: new THREE.Vector3(),
      x: new THREE.Vector3(),
      y: new THREE.Vector3(),
      z: new THREE.Vector3(),
      speed: 1,
    };
    const centerCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    );
    const bx = new THREE.Vector3(),
      bn = new THREE.Vector3(),
      bz = new THREE.Vector3();
    const ax = new THREE.Vector3(),
      an = new THREE.Vector3(),
      az = new THREE.Vector3();
    const direction = new THREE.Vector3(),
      target = new THREE.Vector3();
    const endDirection = [new THREE.Vector3(), new THREE.Vector3()];
    let phase0 = 0,
      winding = 0,
      radius0 = 0.045,
      radius1 = 0.045;
    const smooth = (u) => {
      u = Math.max(0, Math.min(1, u));
      return u * u * (3 - 2 * u);
    };
    function aperture(t) {
      return (
        reaction.opening * (1 - smooth((Math.abs(t - reaction.t) - 0.08) / 0.1))
      );
    }
    function basis(t, x, n, z) {
      centerCurve.getTangent(t, x);
      n.set(0, 1, 0).addScaledVector(x, -x.y).normalize();
      z.crossVectors(x, n).normalize();
    }
    function phase(t) {
      return phase0 + winding * t;
    }
    function prepare() {
      const c0 = centerCurve.v0,
        c1 = centerCurve.v1,
        c2 = centerCurve.v2,
        c3 = centerCurve.v3;
      c0.copy(controls[0][0]).add(controls[1][0]).multiplyScalar(0.5);
      c3.copy(controls[0][3]).add(controls[1][3]).multiplyScalar(0.5);
      // One non-folding axis for both rails. Independent cubic rails can have
      // different tangents and intersect after twisting, even without a bubble.
      // Route the flexible linker in front of the core while keeping endpoints.
      const bow = Math.min(0.28, c0.distanceTo(c3) * 0.22);
      c1.copy(c0).lerp(c3, 1 / 3);
      c1.z += bow;
      c2.copy(c0).lerp(c3, 2 / 3);
      c2.z += bow;
      endDirection[0].copy(controls[0][0]).sub(c0);
      endDirection[1].copy(controls[0][3]).sub(c3);
      radius0 = endDirection[0].length();
      radius1 = endDirection[1].length();
      endDirection.forEach((d) => d.normalize());
      basis(0, bx, bn, bz);
      phase0 = Math.atan2(endDirection[0].dot(bz), endDirection[0].dot(bn));
      basis(1, bx, bn, bz);
      const endPhase = Math.atan2(
        endDirection[1].dot(bz),
        endDirection[1].dot(bn),
      );
      const residual = Math.atan2(
        Math.sin(endPhase - phase0),
        Math.cos(endPhase - phase0),
      );
      winding = 8 * Math.PI + residual;
    }
    function frameAt(t, out) {
      centerCurve.getPoint(t, out.origin);
      basis(t, out.x, bn, bz);
      const angle = phase(t);
      out.y
        .copy(bn)
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(bz, Math.sin(angle));
      out.z.crossVectors(out.x, out.y).normalize();
      centerCurve.getPoint(t - 0.0001, target);
      centerCurve.getPoint(t + 0.0001, direction);
      out.speed = direction.distanceTo(target) / 0.0002;
      return out;
    }
    function curve(t, strand, out) {
      // Site positions refer to the common chromatin axis in both conditions.
      centerCurve.getPoint(t, out);
    }
    function point(t, strand, out) {
      const opening = aperture(t);
      basis(t, bx, bn, bz);
      if (opening > 0) {
        basis(reaction.t, ax, an, az);
        bx.lerp(ax, opening).normalize();
        bn.lerp(an, opening).addScaledVector(bx, -bn.dot(bx)).normalize();
        bz.crossVectors(bx, bn).normalize();
      }
      // Unwind an angle, not a strand position. The radius cannot collapse.
      const angle = phase(t) + (phase(reaction.t) - phase(t)) * opening;
      direction
        .copy(bn)
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(bz, Math.sin(angle));
      if (t < 0.04)
        direction.lerp(endDirection[0], 1 - smooth(t / 0.04)).normalize();
      if (t > 0.96)
        direction.lerp(endDirection[1], smooth((t - 0.96) / 0.04)).normalize();
      centerCurve.getPoint(t, out);
      if (opening > 0) {
        target
          .copy(reaction.origin)
          .addScaledVector(reaction.x, (t - reaction.t) * reaction.speed)
          .addScaledVector(reaction.y, 0.04);
        out.lerp(target, opening);
      }
      const radius =
        (radius0 + (radius1 - radius0) * t) * (1 - opening) + 0.14 * opening;
      out.addScaledVector(direction, (strand ? -1 : 1) * radius);
    }
    const dna = molecularDNA(kit, {
      pairs: 42,
      segments: 128,
      radius: 0.016,
      phosphate: 0.023,
      baseWidth: 0.028,
      materials: material,
    });
    dna.bonds.name = `Linker ${i + 1} base pairing`;
    dna.sugars[1].name = `Linker ${i + 1} template sugars`;
    dna.rails.forEach(
      (rail, s) => (rail.mesh.name = `Linker ${i + 1} strand ${s + 1}`),
    );
    return {
      controls,
      dna,
      point,
      curve,
      reaction,
      aperture,
      prepare,
      frameAt,
    };
  });
  function center(t, p, fold, out) {
    out.set(
      10.4 * (t - 0.5) - 0.32 * fold * Math.sin(2 * Math.PI * (t - 0.5)),
      1 -
        (2.65 + 0.3 * fold) * Math.sin(Math.PI * t) ** 2 +
        0.12 * Math.sin(t * 6 * Math.PI + p * 4),
      0.5 * Math.sin(t * 2 * Math.PI) + 0.24 * fold * Math.sin(t * 4 * Math.PI),
    );
  }
  function attach(target, core, end, s) {
    target
      .copy(endpoints[end][s].point)
      .applyQuaternion(core.object.quaternion)
      .add(core.object.position);
  }
  function frame(index, t, out) {
    return links[index].frameAt(t, out);
  }
  function update(p, fold, transcription = null) {
    cores.forEach(({ t, object }, i) => {
      center(t, p, fold, object.position);
      object.rotation.set(
        0.12 * Math.sin(i * 1.3 + p * 2),
        0.2 * Math.sin(i * 0.8 + p * 1.7),
        0.22 * Math.sin(i * 1.1 + p),
      );
    });
    links.forEach((link, i) => {
      for (let s = 0; s < 2; s++) {
        const c = link.controls[s],
          previous = cores[i - 1],
          next = cores[i];
        if (previous) attach(c[0], previous, 1, s);
        else {
          center(0, p, fold, c[0]);
          c[0].y += Math.cos(s * 2.35) * 0.048;
          c[0].z += Math.sin(s * 2.35) * 0.048;
        }
        if (next) attach(c[3], next, 0, s);
        else {
          center(1, p, fold, c[3]);
          c[3].y += Math.cos(s * 2.35) * 0.048;
          c[3].z += Math.sin(s * 2.35) * 0.048;
        }
        const handle = Math.min(0.42, c[0].distanceTo(c[3]) * 0.3);
        if (previous)
          axis
            .copy(endpoints[1][s].direction)
            .applyQuaternion(previous.object.quaternion);
        else axis.set(1, 0, 0);
        c[1].copy(c[0]).addScaledVector(axis, handle);
        if (next)
          axis
            .copy(endpoints[0][s].direction)
            .applyQuaternion(next.object.quaternion);
        else axis.set(1, 0, 0);
        c[2].copy(c[3]).addScaledVector(axis, -handle);
      }
      link.prepare();
      link.reaction.opening =
        i === 6 && transcription ? transcription.opening : 0;
      link.reaction.t = transcription?.t ?? 0.34;
      if (link.reaction.opening > 0) frame(i, link.reaction.t, link.reaction);
      link.dna.update(link.point, (t) => 1 - link.aperture(t));
    });
  }
  const siteA = new THREE.Vector3(),
    siteB = new THREE.Vector3();
  function site(index, t, out) {
    links[index].curve(t, 0, siteA);
    links[index].curve(t, 1, siteB);
    out.copy(siteA).add(siteB).multiplyScalar(0.5);
  }
  return { update, site, frame, cores, links, basePairs: 7 * 147 + 8 * 42 };
}
