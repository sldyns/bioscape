export const entries = [
  {
    id: "rodRibbonTransmission",
    module: "./modules/vision/rodRibbonTransmissionProcess.js",
    roots: ["rodPhotoreceptor"],
    title: {
      zh: "视杆带状突触传递",
      en: "Transmission at a rod ribbon synapse",
    },
    summary: {
      zh: "观察暗中持续释放的小泡，以及光照如何减少谷氨酸释放、使 ON 型视杆双极细胞去极化。",
      en: "Watch vesicles fuse in darkness, then see how light reduces glutamate release and depolarizes the rod ON bipolar cell.",
    },
    color: "#a38a92",
    category: "signaling",
    thumbnail: "/process-thumbnails/rodRibbonTransmission.svg",
  },
  {
    id: "phototransduction",
    module: "./modules/vision/phototransductionProcess.js",
    roots: ["rodPhotoreceptor"],
    title: {
      zh: "杆细胞的光转导",
      en: "Rod phototransduction",
    },
    summary: {
      zh: "视紫红质吸光后，盘膜上的信号降低胞质 cGMP，使外节质膜的阳离子通道关闭。",
      en: "A flash activates the disk cascade, lowers cGMP and closes outer-segment plasma-membrane channels.",
    },
    color: "#728b98",
    category: "signaling",
    thumbnail: "/process-thumbnails/phototransduction.svg",
  },
  {
    id: "rodDiscRenewal",
    module: "./modules/vision/rodDiscRenewalProcess.js",
    roots: ["rodPhotoreceptor"],
    title: {
      zh: "视杆外节膜盘更新",
      en: "Rod outer-segment disc renewal",
    },
    summary: {
      zh: "追踪基部膜褶形成新盘，直到色素上皮摄取顶端的旧盘。",
      en: "Follow a basal membrane fold to an enclosed disc and distal uptake by the retinal pigment epithelium.",
    },
    color: "#a38268",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/rodDiscRenewal.svg",
  },
];
