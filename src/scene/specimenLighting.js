import * as THREE from "three";
import {
  getSpecimenLight,
  subscribeSpecimenLight,
} from "./lightingPreference.js";

// Radiance from three studio softboxes. This shader runs only while building
// the shared reflection map. Rough surfaces sample its prefiltered mip levels.
export function createSpecimenEnvironment(renderer) {
  const geometry = new THREE.BoxGeometry(8, 8, 8);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec3 viewRay;
      void main() {
        viewRay = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 viewRay;
      float softbox(vec3 ray, vec3 direction, vec2 size) {
        vec3 normal = normalize(direction);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
        vec3 up = cross(normal, right);
        float facing = dot(ray, normal);
        vec2 uv = vec2(dot(ray, right), dot(ray, up)) / max(facing, 0.01);
        vec2 edge = abs(uv) - size;
        return step(0.0, facing) * (1.0 - smoothstep(-0.06, 0.10, max(edge.x, edge.y)));
      }
      void main() {
        vec3 ray = normalize(viewRay);
        vec3 light = mix(vec3(0.12, 0.10, 0.09), vec3(0.38, 0.47, 0.51),
          smoothstep(-0.3, 0.85, ray.y));
        light += vec3(5.8, 5.4, 4.9) * softbox(ray, vec3(-0.67, 0.75, 0.46), vec2(0.70, 0.42));
        light += vec3(3.3, 4.4, 5.1) * softbox(ray, vec3(0.80, 0.44, -0.72), vec2(0.19, 0.78));
        light += vec3(0.9, 0.96, 1.0) * softbox(ray, vec3(0.22, 0.10, 1.0), vec2(0.84, 0.58));
        gl_FragColor = vec4(light, 1.0);
      }
    `,
  });
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(geometry, material));
  let generator;
  try {
    generator = new THREE.PMREMGenerator(renderer);
    return generator.fromScene(room, 0.02);
  } finally {
    generator?.dispose();
    material.dispose();
    geometry.dispose();
  }
}

// Side lighting models the relief of folded membranes. The cooler back light
// separates overlapping edges without changing the specimen's material IDs.
export function lightSpecimen(renderer, scene, invalidate) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const sky = new THREE.HemisphereLight(0xe4f1f5, 0xa89b87, 0.62);
  const key = new THREE.DirectionalLight(0xfff2df, 2.65);
  const rim = new THREE.DirectionalLight(0xd0e9f6, 1.25);
  rim.position.set(4.7, 3, -4.3);
  scene.add(sky, key, rim);
  function apply(mode) {
    const side = mode === "side";
    if (side) key.position.set(-7.5, 2.4, 1.5);
    else key.position.set(-5.8, 6.2, 4.1);
    key.updateMatrixWorld();
    key.intensity = side ? 3.15 : 2.65;
    sky.intensity = side ? 0.39 : 0.66;
    rim.intensity = side ? 1.65 : 1.25;
    scene.environmentIntensity = side ? 0.43 : 0.62;
    scene.environmentRotation.y = side ? -0.55 : 0;
    renderer.toneMappingExposure = side ? 1.0 : 1.04;
  }
  apply(getSpecimenLight());
  const dispose = subscribeSpecimenLight((mode) => {
    apply(mode);
    if (key.castShadow) renderer.shadowMap.needsUpdate = true;
    invalidate();
  });
  return { key, dispose };
}
