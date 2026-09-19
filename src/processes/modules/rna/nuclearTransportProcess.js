import {
  annularBilayer,
  proteinDomain,
  helix,
  molecularInventory,
} from "./refinementGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

export default {
  id: "nuclearTransport",
  title: b("核孔运输：NLS 蛋白质入核", "Nuclear transport: NLS protein import"),
  duration: 32,
  intro: b(
    "动物、植物与酵母共有的经典 NLS–importin α/β 入核途径示意。切换 NLS 是否暴露，观察一种较大蛋白质的受体依赖性入核。此处不模拟 mRNA 输出；多数 mRNA 的输出不由同一 Ran 循环驱动。",
    "A schematic classical NLS–importin α/β import pathway shared by animals, plants and yeast. Expose or mask the NLS to compare receptor-dependent import of a large protein cargo. This is not mRNA export; most mRNA export is not driven by this Ran cycle.",
  ),
  controls: [
    {
      id: "nls",
      label: b("核定位信号", "Nuclear localization signal"),
      default: "exposed",
      options: [
        { value: "exposed", label: b("NLS 暴露", "NLS exposed") },
        { value: "masked", label: b("NLS 被遮蔽", "NLS masked") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("核膜两侧", "Two sides of the envelope"),
      description: b(
        "左侧为胞质，右侧为核质。内外两层核膜在核孔边缘相连；核孔中央通道连通胞质与核质，不通向核周腔。",
        "Cytosol is at left and nucleoplasm at right. Inner and outer nuclear membranes join at the pore rim; the central pore connects cytosol with nucleoplasm, not the perinuclear lumen.",
      ),
    },
    {
      at: 0.16,
      title: b("识别定位信号", "Recognize the localization signal"),
      description: b(
        "importin α 识别货物蛋白的经典 NLS，并与 importin β 组成运输复合物。若 NLS 被遮蔽，本示意的大货物不能形成该复合物，停留于胞质。",
        "Importin α recognizes the cargo’s classical NLS and associates with importin β. If the NLS is masked, the large cargo in this example cannot assemble this complex and stays in the cytosol.",
      ),
    },
    {
      at: 0.34,
      title: b("进入选择性通道", "Enter the selective channel"),
      description: b(
        "importin β 与含 FG 重复的核孔蛋白进行短暂相互作用，帮助复合物穿过选择性屏障。孔道不是每次运输都开合的机械闸门。",
        "Importin β interacts transiently with FG-repeat nucleoporins, facilitating passage through the selective barrier. The pore is not a mechanical gate that opens and shuts for each cargo.",
      ),
    },
    {
      at: 0.56,
      title: b("在核侧解离", "Dissociate on the nuclear side"),
      description: b(
        "核内富集的 Ran-GTP 结合 importin β，促使运输复合物解离；辅助因子帮助货物与 importin α 分离。示意省略这些辅助因子。",
        "Nuclear Ran-GTP binds importin β and promotes disassembly; accessory factors help release cargo from importin α. Those accessory factors are omitted here.",
      ),
    },
    {
      at: 0.75,
      title: b("回收 β 受体", "Recycle the β receptor"),
      description: b(
        "importin β–Ran-GTP 返回胞质。RanGAP 等因子促进 GTP 水解并释放受体。importin α 的 CAS 依赖性回收途径未画出。",
        "Importin β–Ran-GTP returns to the cytosol, where RanGAP and other factors promote GTP hydrolysis and receptor release. The separate CAS-dependent recycling of importin α is not drawn.",
      ),
    },
    {
      at: 0.92,
      title: b(
        "由 Ran 循环保持方向性",
        "Maintain directionality with the Ran cycle",
      ),
      description: b(
        "Ran 的核内核苷酸交换与胞质侧 GTP 水解维持不对称分布，使受体在两侧具有不同的装卸状态。这里的单次轨迹不表示核孔中的确定速度或单向机械牵引。",
        "Nuclear nucleotide exchange and cytosolic GTP hydrolysis maintain Ran asymmetry and different receptor loading states on either side. This single trajectory does not imply a fixed transport speed or a unidirectional mechanical pull.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Schuller et al. (2021): The cellular environment shapes the nuclear pore complex architecture",
      url: "https://www.nature.com/articles/s41586-021-03985-3",
    },
    {
      title:
        "The Cell: The Nuclear Envelope and Traffic between the Nucleus and Cytoplasm",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9927/",
    },
    {
      title: "Components and regulation of nuclear transport processes",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7163960/",
    },
  ],
  create({ rootId = "cell" } = {}) {
    const k = sceneKit(),
      { group } = k,
      mem = k.material("#b8c7bd", {
        side: THREE.DoubleSide,
      }),
      rim = k.material("#7f9994"),
      fg = k.material("#bca58a"),
      cargoMat = k.material("#6f91af"),
      alphaMat = k.material("#b99666"),
      betaMat = k.material("#8f80a6"),
      ranMat = k.material("#729d8b"),
      maskMat = k.material("#b9b8af");
    // The open-front membrane cutaway exposes the central transport pathway.
    const envelope = new THREE.Group();
    group.add(envelope);
    const core = k.material("#c7c0a1", { side: THREE.DoubleSide });
    for (const x of [-0.46, 0.46])
      annularBilayer(k, envelope, {
        x,
        inner: 1.21,
        outer: 2.65,
        material: mem,
        tailMaterial: core,
        cut: 1.15,
      });
    // Curved paired leaflets join the inner and outer membranes at the pore rim.
    for (const face of [-1, 1]) {
      const vertices = [],
        indices = [],
        around = 56,
        across = 18,
        start = Math.PI + 1.15 / 2,
        span = Math.PI * 2 - 1.15;
      for (let i = 0; i <= around; i++)
        for (let j = 0; j <= across; j++) {
          const a = start + (span * i) / around,
            t = (Math.PI * j) / across,
            // Normal offsets of one midsurface preserve leaflet order.
            // The smallest midsurface curvature radius is 0.22²/0.46 > 0.085.
            nx = 0.22 * Math.cos(t),
            nr = -0.46 * Math.sin(t),
            length = Math.hypot(nx, nr),
            x = 0.46 * Math.cos(t) + (face * 0.085 * nx) / length,
            r = 1.21 - 0.22 * Math.sin(t) + (face * 0.085 * nr) / length;
          vertices.push(x, Math.sin(a) * r, -Math.cos(a) * r);
        }
      for (let i = 0; i < around; i++)
        for (let j = 0; j < across; j++) {
          const q = i * (across + 1) + j;
          indices.push(
            q,
            q + 1,
            q + across + 2,
            q,
            q + across + 2,
            q + across + 1,
          );
        }
      const surface = new THREE.BufferGeometry();
      surface.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      surface.setIndex(indices);
      surface.computeVertexNormals();
      const leaflet = k.mesh(surface, mem, [0, 0, 0], envelope);
      leaflet.name = `pore-rim-leaflet-${face}`;
    }
    const pore = new THREE.Group();
    group.add(pore);
    pore.name = "eightfold-nuclear-pore-scaffold";
    const spokeMat = k.material("#91a9a0"),
      railMat = k.material("#a9bcb1");
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      for (const x of [-0.67, 0, 0.67]) {
        const points = [];
        for (let j = 0; j <= 8; j++) {
          const a = angle - 0.39 + (j * 0.78) / 8;
          points.push([x, Math.cos(a) * 1.22, Math.sin(a) * 1.22]);
        }
        k.tube(points, 0.075, spokeMat, pore, 32);
        const domain = proteinDomain(
          k,
          pore,
          [x, Math.cos(angle) * 1.25, Math.sin(angle) * 1.25],
          [0.18, 0.27, 0.17],
          rim,
          i,
        );
        domain.rotation.x = angle;
        for (const sign of [-1, 1])
          k.tube(
            [
              [x, Math.cos(angle) * 0.99, Math.sin(angle) * 0.99],
              [x, Math.cos(angle) * 1.22, Math.sin(angle) * 1.22],
              [
                x,
                Math.cos(angle + sign * 0.21) * 1.42,
                Math.sin(angle + sign * 0.21) * 1.42,
              ],
            ],
            0.051,
            railMat,
            pore,
            24,
          );
      }
      k.tube(
        [
          [-0.72, Math.cos(angle) * 1.2, Math.sin(angle) * 1.2],
          [0, Math.cos(angle + 0.05) * 1.38, Math.sin(angle + 0.05) * 1.38],
          [0.72, Math.cos(angle) * 1.2, Math.sin(angle) * 1.2],
        ],
        0.067,
        rim,
        pore,
        32,
      );
      k.tube(
        [
          [0.72, Math.cos(angle) * 1.17, Math.sin(angle) * 1.17],
          [1.12, Math.cos(angle + 0.08) * 1.0, Math.sin(angle + 0.08) * 1.0],
          [1.65, Math.cos(angle) * 0.55, Math.sin(angle) * 0.55],
        ],
        0.038,
        spokeMat,
        pore,
        36,
      );
      k.tube(
        [
          [-0.72, Math.cos(angle) * 1.17, Math.sin(angle) * 1.17],
          [-1.02, Math.cos(angle + 0.1) * 1.37, Math.sin(angle + 0.1) * 1.37],
          [-1.42, Math.cos(angle + 0.23) * 1.45, Math.sin(angle + 0.23) * 1.45],
        ],
        0.027,
        railMat,
        pore,
        36,
      );
      const fgPoints = [];
      for (let j = 0; j <= 28; j++) {
        const t = j / 28,
          a = angle + t * 1.6,
          r = 0.92 - 0.48 * t;
        fgPoints.push([
          Math.sin(t * 7 + i) * 0.16,
          Math.cos(a) * r,
          Math.sin(a) * r,
        ]);
      }
      k.tube(fgPoints, 0.022, fg, pore, 56);
    }
    const basket = k.ring([1.65, 0, 0], 0.55, 0.047, rim, pore);
    basket.rotation.y = Math.PI / 2;
    // Globular protein with a folded backbone and protruding NLS, carried by a crescent receptor.
    const cargo = new THREE.Group(),
      alpha = new THREE.Group(),
      beta = new THREE.Group(),
      ran = new THREE.Group();
    group.add(cargo, alpha, beta, ran);
    cargo.name = "nls-cargo";
    proteinDomain(k, cargo, [0, 0, 0], [0.4, 0.34, 0.31], cargoMat);
    helix(
      k,
      cargo,
      [-0.23, -0.12, 0.31],
      [0.15, 0.2, 0.3],
      0.047,
      4,
      k.material("#bed0da"),
      0.02,
    );
    k.ball([-0.23, 0.17, 0.05], [0.24, 0.27, 0.22], cargoMat, cargo);
    k.ball([0.19, -0.17, 0.02], [0.22, 0.25, 0.23], cargoMat, cargo);
    k.tube(
      [
        [-0.3, -0.08, 0.27],
        [-0.1, 0.18, 0.28],
        [0.1, -0.08, 0.29],
        [0.31, 0.1, 0.2],
      ],
      0.043,
      k.material("#bdd0df"),
      cargo,
      30,
    );
    const nls = k.tube(
      [
        [0.22, 0.18, 0.08],
        [0.4, 0.28, 0.1],
        [0.5, 0.24, 0.12],
      ],
      0.075,
      alphaMat,
      cargo,
      16,
    );
    const cover = k.ball([0.43, 0.24, 0.1], [0.22, 0.18, 0.2], maskMat, cargo);
    for (let i = 0; i < 5; i++) {
      const y = -0.3 + i * 0.14;
      helix(
        k,
        alpha,
        [-0.09, y, 0.03],
        [0.09, y + 0.08, 0.06],
        0.038,
        2,
        alphaMat,
        0.025,
      );
    }
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * 0.75 + (i * Math.PI * 1.5) / 10;
      const x = Math.cos(a) * 0.43,
        y = Math.sin(a) * 0.43;
      helix(
        k,
        beta,
        [x - 0.055, y, -0.08],
        [x + 0.055, y, 0.12],
        0.046,
        2,
        betaMat,
        0.027,
      );
    }
    k.tube(
      Array.from({ length: 30 }, (_, i) => {
        const a = -Math.PI * 0.75 + (i * Math.PI * 1.5) / 29;
        return [Math.cos(a) * 0.43, Math.sin(a) * 0.43, -0.045];
      }),
      0.055,
      betaMat,
      beta,
      64,
    );
    proteinDomain(k, ran, [0, 0, 0], [0.21, 0.24, 0.2], ranMat);
    helix(
      k,
      ran,
      [-0.1, -0.1, 0.18],
      [0.09, 0.09, 0.18],
      0.034,
      3,
      railMat,
      0.017,
    );
    const gtp = k.ball([0, 0.22, 0], 0.073, fg, ran);
    const labels = [
      k.label([-2.7, 2.1, 0], "胞质", "Cytosol", 2),
      k.label([2.55, 2.1, 0], "核质", "Nucleoplasm", 2),
      k.label(
        [0, -2.8, 0],
        "双层核膜 · 核孔中央通道",
        "Double nuclear membrane · pore channel",
        2,
      ),
      k.label([-3.2, -0.8, 0], "NLS 货物", "NLS cargo", 2),
      k.label([-2.8, 1, 0], "importin α / β", "Importin α / β", 1),
      k.label([2.7, -1.4, 0], "Ran-GTP", "Ran-GTP", 1),
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        enabled = parameters.nls !== "masked",
        bind = ease(p, 0.14, 0.3),
        cross = ease(p, 0.33, 0.6),
        unload = ease(p, 0.6, 0.73),
        recycle = ease(p, 0.76, 0.9),
        hydro = ease(p, 0.9, 1);
      const cargoX = enabled ? -3.2 + 5.75 * cross : -3.2 + 0.5 * bind;
      cargo.position.set(cargoX, 0, 0);
      cover.visible = !enabled;
      nls.visible = enabled;
      alpha.position.set(
        enabled ? cargoX + 0.4 : -2.5 + 0.25 * bind,
        enabled ? 0.5 + (1 - bind) * 0.6 + unload * 0.45 : 1.1,
        0,
      );
      beta.position.set(
        enabled ? (cargoX + 0.15) * (1 - recycle) + -2.6 * recycle : -1.95,
        enabled
          ? (0.35 + (1 - bind) * 0.75) * (1 - recycle) - 0.35 * recycle
          : 1.1,
        0,
      );
      if (enabled) {
        alpha.position.x += 0.18 * unload;
        beta.position.x += 0.4 * unload * (1 - recycle);
      }
      // Alpha stays nuclear once cargo has been released; its separate export cycle is not depicted.
      if (enabled && p >= 0.73) alpha.position.set(3.13, 0.95, 0);
      const approach = ease(p, 0.55, 0.67);
      ran.position.set(
        enabled
          ? 3.3 * (1 - approach) +
              (beta.position.x + 0.42) * approach +
              hydro * 0.5
          : 3.3,
        enabled
          ? -1.05 * (1 - approach) +
              (beta.position.y + 0.1) * approach -
              hydro * 0.6
          : -1.05,
        0.04,
      );
      gtp.visible = !enabled || p < 0.96;
      labels[3].position[0] = cargoX;
      labels[4].position[0] = beta.position.x;
      labels[4].position[1] = beta.position.y + 0.82;
      labels[5].position[0] = ran.position.x;
      labels[5].position[1] = ran.position.y - 0.5;
      labels[5].text =
        enabled && p >= 0.96
          ? b("Ran-GDP", "Ran-GDP")
          : b("Ran-GTP", "Ran-GTP");
      group.userData = {
        rootId,
        pathway: "classical-NLS-import",
        direction: "cytosol-to-nucleus",
        nls: enabled ? "exposed" : "masked",
        cargoSide: enabled && cross > 0.6 ? "nucleus" : "cytosol",
        cargoReleased: enabled && unload === 1,
        receptorRecycled: enabled && recycle === 1,
        ranHydrolyzed: enabled && p >= 0.96,
        mRNAExportShown: false,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      materials: molecularInventory(group),
      camera: { position: [3.2, 2.6, 11.2], target: [0, 0, 0] },
    };
  },
};
