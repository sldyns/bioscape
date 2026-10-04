// All retained rear surfaces use one axisymmetric family. The x stretch is
// applied by the spore group; radial dimensions apply equally to y and z.
// This keeps the cortex between the membranes throughout its growth.
export const sporeGeometry = {
  axialStretch: 1.12,
  inner: { axial: 0.72, radial: 0.72 },
  outer: { axial: 0.91, radial: 0.87 },
  cortex: {
    initial: { axial: 0.76, radial: 0.75 },
    mature: { axial: 0.85, radial: 0.81 },
  },
  coat: { axial: 1.03, radial: 0.99 },
};
